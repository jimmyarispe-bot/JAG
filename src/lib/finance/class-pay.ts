import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * Teacher pay for classes taught in the virtual schools.
 *
 * The rule, from Jimmy on 18 September 2026: a teacher is paid a rate per
 * student ENROLLED in the section, for every class taught. Attendance is
 * recorded for the family and does not change what the teacher is owed - a
 * child who does not turn up was still taught for.
 *
 * WHY "ENROLLED AT THE TIME OF THE CLASS" AND NOT "ENROLLED NOW".
 *
 * A roster changes. If the count came from today's enrolment list, recalculating
 * August after a student drops in October would quietly reduce what a teacher
 * was already paid for August, and recalculating after a new student joins would
 * raise it. The same period would produce a different answer every time it was
 * asked, and the difference would be invisible.
 *
 * So the count is the roster AS IT STOOD on the day of the class: enrolled on or
 * before that date, and not dropped until after it. A pay period recalculated in
 * December returns exactly what it returned in August.
 *
 * NULL RATE IS NOT ZERO. A teacher with no agreed rate produces no row and is
 * named as skipped. A zero-pound row in a pay run is indistinguishable from a
 * teacher who taught nothing, and that is how somebody goes unpaid quietly.
 */

/** The two schools this applies to, by name, resolved to ids at query time. */
export const VIRTUAL_SCHOOL_NAMES = ["The Academy Virtual", "The Academy HS"];

/** Roster statuses that count as "this child was in the class". */
const COUNTED_STATUSES = ["enrolled", "completed"];

export interface EnrollmentWindow {
  enrolledAt: string;
  droppedAt: string | null;
  status: string;
}

/**
 * Was this child on the roster on the day of the class?
 *
 * Pure, and tested, because it is the one rule that decides how much money a
 * person is owed.
 */
export function onRosterOn(enrollment: EnrollmentWindow, classDate: string): boolean {
  if (!COUNTED_STATUSES.includes(enrollment.status)) return false;

  const day = classDate.slice(0, 10);
  if (enrollment.enrolledAt.slice(0, 10) > day) return false;

  // Dropped ON the day still counts: they were taught that morning.
  if (enrollment.droppedAt && enrollment.droppedAt.slice(0, 10) < day) return false;

  return true;
}

export interface ClassRate {
  baseFirstStudent: number;
  perAdditionalStudent: number;
  guestBaseFirstStudent: number;
}

/**
 * What one class pays.
 *
 * A base for the FIRST enrolled student, plus a smaller amount for every
 * student beyond. From the pay schedule of 18 September 2026 - not a flat rate
 * per head, which would pay a six-child LitLab class 6 x 20 instead of 20 + 5 x 5.
 *
 * A guest covering somebody else's class earns a lower base and the same
 * per-student amount.
 *
 * NOBODY ENROLLED PAYS NOTHING. The schedule prices "the 1st student in
 * scheduled class", so the money starts at the first child. A class with an
 * empty roster still appears in the detail list at zero, because a session that
 * ran for nobody is worth seeing rather than hiding.
 */
export function grossForClass(
  rate: ClassRate,
  studentCount: number,
  isGuest = false
): number {
  if (studentCount <= 0) return 0;
  const base = isGuest ? rate.guestBaseFirstStudent : rate.baseFirstStudent;
  const beyondFirst = (studentCount - 1) * rate.perAdditionalStudent;
  return Math.round((base + beyondFirst) * 100) / 100;
}

/**
 * The rate in force on the day of the class.
 *
 * Rates are versioned rather than edited, so a period recalculated in December
 * prices at what it priced at in August. The same reasoning as counting the
 * roster as it stood on the day: a pay run asked twice must answer twice the
 * same, or nobody can trust either answer.
 */
export function rateOn(
  rates: (ClassRate & { effectiveFrom: string; employeeId: string | null })[],
  classDate: string,
  employeeId: string
): ClassRate | null {
  const day = classDate.slice(0, 10);

  /* A rate belonging to the person beats a rate belonging to nobody. Craig Mann
     tutors at 30.00 where tutoring otherwise pays 20.00, and the course rate
     must not quietly overwrite what he was promised. Same precedence as
     workRateOn in work-pay.ts, so every rate in the system behaves one way. */
  const eligible = rates.filter(
    (r) =>
      r.effectiveFrom.slice(0, 10) <= day &&
      (r.employeeId === null || r.employeeId === employeeId)
  );
  if (eligible.length === 0) return null;

  const mine = eligible.filter((r) => r.employeeId === employeeId);
  const pool = mine.length > 0 ? mine : eligible;

  return [...pool].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? null;
}

export interface ClassPayRow {
  sessionId: string;
  employeeId: string;
  teacherName: string;
  schoolId: string;
  schoolName: string;
  courseName: string;
  sectionCode: string;
  classDate: string;
  studentCount: number;
  ratePerStudent: number;
  /** Covered by somebody other than the section's usual teacher. */
  isGuest: boolean;
  gross: number;
}

export interface ClassPayPeriod {
  rows: ClassPayRow[];
  /** Teachers who taught in the period with no agreed rate. Named, never zeroed. */
  skippedForNoRate: { employeeId: string; teacherName: string; classes: number }[];
  unavailable: string | null;
}

/**
 * Every class taught in the two virtual schools between two dates, priced.
 *
 * Reads only. Nothing is written until somebody asks for the period to be
 * committed, so opening the screen can never move money.
 */
export async function computeClassPay(
  supabase: AuthClient,
  periodStart: string,
  periodEnd: string
): Promise<ClassPayPeriod> {
  const { data: schools, error: schoolError } = await supabase
    .from("schools")
    .select("id, name")
    .in("name", VIRTUAL_SCHOOL_NAMES);

  if (schoolError) {
    return { rows: [], skippedForNoRate: [], unavailable: schoolError.message };
  }

  const schoolById = new Map((schools ?? []).map((s) => [s.id as string, s.name as string]));
  if (schoolById.size === 0) {
    return {
      rows: [],
      skippedForNoRate: [],
      unavailable: `No school is named ${VIRTUAL_SCHOOL_NAMES.join(" or ")}.`,
    };
  }

  const { data: sessions, error: sessionError } = await supabase
    .from("instructional_sessions")
    .select(
      /* A teacher's name lives on employee_profiles, not on employees - that
         table has no name columns at all - and the rate lives on the COURSE,
         in class_pay_rates, because Structured Literacy pays 35.00 where
         LitLab pays 20.00 for the same person.

         course_sections.instructor_employee_id is the section's usual teacher.
         When the session's instructor differs, somebody covered, and the class
         prices at the guest rate. */
      "id, scheduled_start, instructor_employee_id, course_section_id, " +
        "course_sections(section_code, instructor_employee_id, " +
        "courses(id, name, school_id, class_pay_rates(employee_id, base_first_student, " +
        "per_additional_student, guest_base_first_student, effective_from))), " +
        "employees(id, employee_profiles(first_name, last_name, display_name))"
    )
    .gte("scheduled_start", `${periodStart}T00:00:00`)
    .lte("scheduled_start", `${periodEnd}T23:59:59`)
    .order("scheduled_start", { ascending: true });

  if (sessionError) {
    return { rows: [], skippedForNoRate: [], unavailable: sessionError.message };
  }

  /* Supabase returns an embedded relation as an object or as a one-element
     array depending on how it reads the relationship, and without generated
     Database types it hands back GenericStringError rather than a row shape.
     Non-generic on purpose: inferring T from `T | T[]` against an unknown
     collapses to {} and every property read below it fails to compile. */
  const one = (value: unknown): Record<string, unknown> | null => {
    const first = Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
    return first && typeof first === "object"
      ? (first)
      : null;
  };

  type SessionRow = Record<string, unknown>;
  const relevant: {
    session: SessionRow;
    schoolId: string;
    sectionId: string;
    employeeId: string;
  }[] = [];

  for (const raw of (sessions ?? []) as unknown as SessionRow[]) {
    const section = one(raw.course_sections);
    const course = section ? one(section.courses) : null;
    const schoolId = course?.school_id as string | undefined;
    const employeeId = raw.instructor_employee_id as string | undefined;
    const sectionId = raw.course_section_id as string | undefined;

    if (!schoolId || !schoolById.has(schoolId)) continue;
    if (!employeeId || !sectionId) continue;

    relevant.push({ session: raw, schoolId, sectionId, employeeId });
  }

  if (relevant.length === 0) {
    return { rows: [], skippedForNoRate: [], unavailable: null };
  }

  /* One read for every roster in play, then counted per class date in memory.
     A query per session would be hundreds of round trips for one pay run. */
  const sectionIds = [...new Set(relevant.map((r) => r.sectionId))];
  const { data: enrollments, error: enrollmentError } = await supabase
    .from("student_enrollments")
    .select("course_section_id, enrollment_status, enrolled_at, dropped_at")
    .in("course_section_id", sectionIds);

  if (enrollmentError) {
    return { rows: [], skippedForNoRate: [], unavailable: enrollmentError.message };
  }

  const rosterBySection = new Map<string, EnrollmentWindow[]>();
  for (const e of (enrollments ?? []) as unknown as Record<string, unknown>[]) {
    const sectionId = e.course_section_id as string;
    const list = rosterBySection.get(sectionId) ?? [];
    list.push({
      enrolledAt: String(e.enrolled_at ?? ""),
      droppedAt: (e.dropped_at as string | null) ?? null,
      status: String(e.enrollment_status ?? ""),
    });
    rosterBySection.set(sectionId, list);
  }

  const rows: ClassPayRow[] = [];
  const skipped = new Map<string, { employeeId: string; teacherName: string; classes: number }>();

  for (const { session, schoolId, sectionId, employeeId } of relevant) {
    const employee = one(session.employees);
    const profile = employee ? one(employee.employee_profiles) : null;
    const teacherName =
      (profile?.display_name as string | undefined) ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      "Unnamed teacher";

    const classDate = String(session.scheduled_start).slice(0, 10);
    const section = one(session.course_sections);
    const course = section ? one(section.courses) : null;

    const rateRows = ((course?.class_pay_rates ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
      baseFirstStudent: Number(r.base_first_student),
      perAdditionalStudent: Number(r.per_additional_student),
      guestBaseFirstStudent: Number(r.guest_base_first_student),
      effectiveFrom: String(r.effective_from),
      employeeId: (r.employee_id as string | null) ?? null,
    }));
    const rate = rateOn(rateRows, classDate, employeeId);

    /* No rate is not a rate of nothing. Name the course and move on, because a
       zero-pound class in a pay run is indistinguishable from a class that
       never happened, and that is how somebody goes unpaid quietly. */
    if (!rate) {
      const entry = skipped.get(employeeId) ?? { employeeId, teacherName, classes: 0 };
      entry.classes += 1;
      skipped.set(employeeId, entry);
      continue;
    }

    /* Covered by somebody else: the session's instructor is not the section's
       usual one. Guest rate, and the row says so. */
    const usualTeacher = section?.instructor_employee_id as string | undefined;
    const isGuest = Boolean(usualTeacher && usualTeacher !== employeeId);

    const studentCount = (rosterBySection.get(sectionId) ?? []).filter((e) =>
      onRosterOn(e, classDate)
    ).length;

    rows.push({
      sessionId: String(session.id),
      employeeId,
      teacherName,
      schoolId,
      schoolName: schoolById.get(schoolId) ?? "",
      courseName: String(course?.name ?? "Course"),
      sectionCode: String(section?.section_code ?? ""),
      classDate,
      studentCount,
      ratePerStudent: rate.perAdditionalStudent,
      isGuest,
      gross: grossForClass(rate, studentCount, isGuest),
    });
  }

  return { rows, skippedForNoRate: [...skipped.values()], unavailable: null };
}

export interface TeacherPayTotal {
  employeeId: string;
  teacherName: string;
  classes: number;
  students: number;
  gross: number;
}

/** What each teacher is owed for the period. Pure, so it can be tested. */
export function totalsByTeacher(rows: ClassPayRow[]): TeacherPayTotal[] {
  const totals = new Map<string, TeacherPayTotal>();

  for (const row of rows) {
    const entry = totals.get(row.employeeId) ?? {
      employeeId: row.employeeId,
      teacherName: row.teacherName,
      classes: 0,
      students: 0,
      gross: 0,
    };
    entry.classes += 1;
    entry.students += row.studentCount;
    entry.gross = Math.round((entry.gross + row.gross) * 100) / 100;
    totals.set(row.employeeId, entry);
  }

  return [...totals.values()].sort((a, b) => a.teacherName.localeCompare(b.teacherName));
}
