/**
 * Founder Workspace operational slices — loaded once inside metrics fan-out.
 * Teacher/student attendance today + MTD revenue + upcoming classes.
 * No duplicate SQL when Founder cards map from the aggregate / source bundle.
 */
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const PRESENT_STATUSES = new Set([
  "present",
  "tardy",
  "early_dismissal",
  "virtual_present",
  "therapy_present",
]);

export interface FounderUpcomingClassSlice {
  id: string;
  courseName: string;
  sectionCode: string;
  scheduledStart: string;
  deliveryMode: string | null;
}

export interface FounderTeacherAttendanceSlice {
  rate: number | null;
  submitted: number;
  total: number;
}

export interface FounderStudentAttendanceSlice {
  rate: number | null;
  present: number;
  total: number;
}

export interface FounderOperationalSlice {
  monthlyRevenue: number | null;
  teacherAttendance: FounderTeacherAttendanceSlice | null;
  studentAttendance: FounderStudentAttendanceSlice | null;
  upcomingClasses: FounderUpcomingClassSlice[];
}

function monthStartIso(): string {
  const monthStart = new Date();
  monthStart.setDate(1);
  return monthStart.toISOString().split("T")[0];
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

function todayRange(): { start: string; end: string } {
  const t = todayIso();
  return { start: `${t}T00:00:00`, end: `${t}T23:59:59` };
}

function matchesSchool(
  schoolId: string | undefined,
  recordSchoolId: string | null | undefined
): boolean {
  if (!schoolId) return true;
  return recordSchoolId === schoolId;
}

async function loadMonthlyRevenue(
  supabase: AuthClient,
  schoolId?: string
): Promise<number> {
  const { data } = await supabase
    .from("payments")
    .select("amount, paid_at, invoices(family_billing_accounts(school_id))")
    .gte("paid_at", monthStartIso());

  return (data ?? [])
    .filter((payment) => {
      if (!schoolId) return true;
      const invoice = Array.isArray(payment.invoices) ? payment.invoices[0] : payment.invoices;
      const account = Array.isArray(invoice?.family_billing_accounts)
        ? invoice?.family_billing_accounts[0]
        : invoice?.family_billing_accounts;
      return matchesSchool(schoolId, (account as { school_id?: string })?.school_id);
    })
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
}

async function loadTeacherAttendance(
  supabase: AuthClient,
  schoolId?: string
): Promise<FounderTeacherAttendanceSlice> {
  const { start, end } = todayRange();

  const { data: sessions } = await supabase
    .from("instructional_sessions")
    .select("id, course_sections(courses(school_id))")
    .gte("scheduled_start", start)
    .lte("scheduled_start", end)
    .in("session_status", ["scheduled", "in_progress", "completed"]);

  const todaySessions = (sessions ?? []).filter((session) => {
    if (!schoolId) return true;
    const section = Array.isArray(session.course_sections)
      ? session.course_sections[0]
      : session.course_sections;
    const course = Array.isArray(section?.courses) ? section?.courses[0] : section?.courses;
    return matchesSchool(schoolId, (course as { school_id?: string })?.school_id);
  });

  if (!todaySessions.length) {
    return { rate: null, submitted: 0, total: 0 };
  }

  const sessionIds = todaySessions.map((s) => s.id);
  const { data: attendanceRows } = await supabase
    .from("session_attendance_records")
    .select("instructional_session_id")
    .in("instructional_session_id", sessionIds);

  const submittedSessionIds = new Set(
    (attendanceRows ?? []).map((row) => row.instructional_session_id)
  );
  const submitted = todaySessions.filter((s) => submittedSessionIds.has(s.id)).length;
  const total = todaySessions.length;

  return {
    submitted,
    total,
    rate: total ? Math.round((submitted / total) * 100) : null,
  };
}

async function loadStudentAttendance(
  supabase: AuthClient,
  schoolId?: string
): Promise<FounderStudentAttendanceSlice> {
  const date = todayIso();

  const { data } = await supabase
    .from("student_attendance_records")
    .select("status, students(school_id)")
    .eq("attendance_date", date);

  const records = (data ?? []).filter((record) => {
    if (!schoolId) return true;
    const student = Array.isArray(record.students) ? record.students[0] : record.students;
    return matchesSchool(schoolId, (student as { school_id?: string })?.school_id);
  });

  if (!records.length) {
    return { rate: null, present: 0, total: 0 };
  }

  const present = records.filter((record) => PRESENT_STATUSES.has(record.status)).length;
  return {
    present,
    total: records.length,
    rate: Math.round((present / records.length) * 100),
  };
}

async function loadUpcomingClasses(
  supabase: AuthClient,
  schoolId?: string,
  limit = 5
): Promise<FounderUpcomingClassSlice[]> {
  const { data } = await supabase
    .from("instructional_sessions")
    .select(
      "id, scheduled_start, course_sections(section_code, delivery_mode, courses(name, school_id))"
    )
    .gte("scheduled_start", new Date().toISOString())
    .eq("session_status", "scheduled")
    .order("scheduled_start")
    .limit(limit * 3);

  return (data ?? [])
    .filter((session) => {
      if (!schoolId) return true;
      const section = Array.isArray(session.course_sections)
        ? session.course_sections[0]
        : session.course_sections;
      const course = Array.isArray(section?.courses) ? section?.courses[0] : section?.courses;
      return matchesSchool(schoolId, (course as { school_id?: string })?.school_id);
    })
    .slice(0, limit)
    .map((session) => {
      const section = Array.isArray(session.course_sections)
        ? session.course_sections[0]
        : session.course_sections;
      const course = Array.isArray(section?.courses) ? section?.courses[0] : section?.courses;
      return {
        id: session.id,
        courseName: (course as { name?: string })?.name ?? "Class session",
        sectionCode: (section as { section_code?: string })?.section_code ?? "—",
        scheduledStart: session.scheduled_start,
        deliveryMode: (section as { delivery_mode?: string })?.delivery_mode ?? null,
      };
    });
}

/** Load Founder-specific operational slices once per metrics fan-out. */
export async function loadFounderOperationalSlice(
  supabase: AuthClient,
  schoolId?: string
): Promise<FounderOperationalSlice> {
  const [monthlyRevenue, teacherAttendance, studentAttendance, upcomingClasses] =
    await Promise.all([
      loadMonthlyRevenue(supabase, schoolId).catch(() => null),
      loadTeacherAttendance(supabase, schoolId).catch(() => null),
      loadStudentAttendance(supabase, schoolId).catch(() => null),
      loadUpcomingClasses(supabase, schoolId).catch(() => [] as FounderUpcomingClassSlice[]),
    ]);

  return {
    monthlyRevenue,
    teacherAttendance,
    studentAttendance,
    upcomingClasses: upcomingClasses ?? [],
  };
}
