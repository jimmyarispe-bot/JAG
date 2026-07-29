/**
 * Teacher class range views — reads instructional_sessions (Scheduling SoR).
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import { formatAcademyTime } from "@/lib/scheduling/academy-way";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function rangeFor(view: "daily" | "weekly" | "monthly") {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  if (view === "daily") end.setHours(23, 59, 59, 999);
  else if (view === "weekly") end.setDate(end.getDate() + 7);
  else end.setDate(end.getDate() + 31);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getTeacherClassesInRange(
  supabase: AuthClient,
  employeeId: string,
  view: "daily" | "weekly" | "monthly" = "daily"
) {
  const { start, end } = rangeFor(view);

  const { data: sessions } = await supabase
    .from("instructional_sessions")
    .select(
      `
      id, scheduled_start, scheduled_end, course_section_id, meeting_url, status,
      instructional_session_deliveries(lesson_status),
      course_sections(
        section_code, delivery_mode,
        courses(name, code)
      )
    `
    )
    .eq("instructor_employee_id", employeeId)
    .gte("scheduled_start", start)
    .lte("scheduled_start", end)
    .order("scheduled_start");

  const sessionList = sessions ?? [];
  const sectionIds = [
    ...new Set(sessionList.map((s) => s.course_section_id).filter(Boolean)),
  ] as string[];

  const { data: enrollments } = sectionIds.length
    ? await supabase
        .from("student_enrollments")
        .select("course_section_id, student_id")
        .in("course_section_id", sectionIds)
        .eq("enrollment_status", "enrolled")
    : { data: [] as { course_section_id: string; student_id: string }[] };

  const counts = new Map<string, number>();
  for (const e of enrollments ?? []) {
    counts.set(e.course_section_id, (counts.get(e.course_section_id) ?? 0) + 1);
  }

  const sessionIds = sessionList.map((s) => s.id);
  const { data: attendance } = sessionIds.length
    ? await supabase
        .from("session_attendance_records")
        .select("instructional_session_id, attendance_status")
        .in("instructional_session_id", sessionIds)
    : { data: [] as { instructional_session_id: string; attendance_status: string }[] };

  const attendanceDone = new Set(
    (attendance ?? [])
      .filter((a) => a.attendance_status && a.attendance_status !== "pending")
      .map((a) => a.instructional_session_id)
  );

  return sessionList.map((s) => {
    const cs = Array.isArray(s.course_sections) ? s.course_sections[0] : s.course_sections;
    const course = Array.isArray(cs?.courses) ? cs?.courses[0] : cs?.courses;
    const deliveryRaw = s.instructional_session_deliveries;
    const delivery = Array.isArray(deliveryRaw) ? deliveryRaw[0] : deliveryRaw;
    return {
      id: s.id as string,
      scheduledStart: s.scheduled_start as string,
      timeDisplay: formatAcademyTime(s.scheduled_start as string),
      courseName: (course as { name?: string } | null)?.name ?? "Class",
      sectionCode: (cs as { section_code?: string } | null)?.section_code ?? "",
      studentCount: counts.get(s.course_section_id as string) ?? 0,
      meetingUrl: (s as { meeting_url?: string | null }).meeting_url ?? null,
      lessonStatus:
        (delivery as { lesson_status?: string } | null)?.lesson_status ?? "not_started",
      attendanceStarted: attendanceDone.has(s.id as string),
      href: `/dashboard/teacher/sessions/${s.id}`,
    };
  });
}
