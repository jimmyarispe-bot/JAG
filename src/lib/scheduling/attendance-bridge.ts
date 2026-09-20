import type { createAuthClient } from "@/lib/supabase/server-auth";
import { logStudentCommunicationEvent } from "@/lib/ssis/timeline";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * THE DATE OF A CLASS IS ITS EASTERN DATE.
 *
 * This used to be `new Date(scheduled_start).toISOString().split("T")[0]`, which
 * is the UTC date. The network operates on Eastern and everyone else adjusts, so
 * a 7pm class in November - 00:00 UTC the following day - would have been
 * recorded as tomorrow's attendance, for the child and for the teacher's pay.
 * It happens not to bite in September at UTC-4; it would have bitten in winter,
 * quietly, and only for evening classes.
 *
 * en-CA formats as YYYY-MM-DD, which is what a `date` column wants.
 */
export function easternDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/**
 * ONE DAY, MANY CLASSES.
 *
 * `student_attendance_records` is unique on (student_id, attendance_date) - one
 * row per child per day. A Virtual child with four classes a day cannot be
 * "present in period 1, absent in period 3" there.
 *
 * The bridge used to upsert that daily row from every class independently, so
 * the day ended up reading whatever the LAST class happened to write. Last write
 * wins, silently, and a child present all morning could finish the day recorded
 * absent because their final class was.
 *
 * So the per-class rows are the truth, and the daily row is DERIVED from all of
 * them. Precedence, most-present first:
 *
 *   present / virtual_present  - they were in a class. The day is attended.
 *   early_dismissal            - they were here and left. Still attended.
 *   tardy                      - they arrived late. Still attended.
 *   absent_unexcused           - no class attended, and at least one unexcused.
 *   absent_excused             - no class attended, all excused.
 *
 * Unexcused beats excused when every class was missed, because a day containing
 * an unexplained absence is not a fully excused day. Being present in ANY class
 * beats every absence, because the child was demonstrably at school.
 */
const DAY_STATUS_PRECEDENCE = [
  "present",
  "early_dismissal",
  "tardy",
  "absent_unexcused",
  "absent_excused",
] as const;

export function rollUpDayStatus(sessionStatuses: readonly string[]): string | null {
  if (sessionStatuses.length === 0) return null;

  // virtual_present is a session-level distinction. At day level it is presence.
  const normalised = sessionStatuses.map((s) =>
    s === "virtual_present" ? "present" : s
  );

  for (const status of DAY_STATUS_PRECEDENCE) {
    if (normalised.includes(status)) return status;
  }

  // An unrecognised status is not silently dropped - it is the day's answer, so
  // whoever reads it sees the real value rather than a confident wrong one.
  return normalised[0] ?? null;
}

export async function recordSessionAttendance(
  supabase: AuthClient,
  input: {
    sessionId: string;
    studentId: string;
    status: string;
    notifyParent?: boolean;
    notes?: string;
    recordedBy?: string | null;
  }
) {
  const { data: session } = await supabase
    .from("instructional_sessions")
    .select("id, scheduled_start, course_section_id, course_sections(courses(school_id))")
    .eq("id", input.sessionId)
    .single();

  if (!session) return { error: "Session not found" };

  const dateStr = easternDate(session.scheduled_start as string);
  const cs = Array.isArray(session.course_sections) ? session.course_sections[0] : session.course_sections;
  const course = cs?.courses;
  const schoolId = (Array.isArray(course) ? course[0] : course)?.school_id as string | undefined;

  /* THE PER-CLASS ROW IS WRITTEN FIRST, AND ITS ERROR IS CHECKED.
     It used to be written last, bare - `await supabase.from(...).upsert(...)`
     with no destructuring and no check - so a refused write still returned
     { success: true } and the teacher saw a tick over nothing. Seventh instance
     of the house pattern in this codebase. It is the row that matters most:
     for a Virtual school it is the attendance record, and it is what a
     teacher's pay is verified against. */
  const { error: sessionError } = await supabase
    .from("session_attendance_records")
    .upsert(
      {
        instructional_session_id: input.sessionId,
        student_id: input.studentId,
        attendance_status: input.status,
        recorded_by: input.recordedBy ?? null,
        notes: input.notes ?? null,
      },
      { onConflict: "instructional_session_id,student_id" }
    );

  if (sessionError) return { error: sessionError.message };

  /* DERIVE THE DAY FROM EVERY CLASS THAT DAY.

     A deliberately generous window - the day before to the day after - then
     filtered by Eastern date in memory. Computing the Eastern day's UTC
     boundaries by hand is where daylight saving goes wrong; three days of one
     child's classes is a handful of rows and cannot be got wrong this way. */
  const dayBefore = new Date(new Date(session.scheduled_start as string).getTime() - 36 * 3600_000);
  const dayAfter = new Date(new Date(session.scheduled_start as string).getTime() + 36 * 3600_000);

  const { data: nearby, error: nearbyError } = await supabase
    .from("session_attendance_records")
    .select("attendance_status, instructional_sessions!inner(scheduled_start)")
    .eq("student_id", input.studentId)
    .gte("instructional_sessions.scheduled_start", dayBefore.toISOString())
    .lte("instructional_sessions.scheduled_start", dayAfter.toISOString());

  if (nearbyError) return { error: nearbyError.message };

  const sameDayStatuses = ((nearby ?? []) as unknown as Array<{
    attendance_status: string;
    instructional_sessions: { scheduled_start: string } | { scheduled_start: string }[] | null;
  }>)
    .filter((row) => {
      const s = Array.isArray(row.instructional_sessions)
        ? row.instructional_sessions[0]
        : row.instructional_sessions;
      return s?.scheduled_start ? easternDate(s.scheduled_start) === dateStr : false;
    })
    .map((row) => row.attendance_status);

  const dayStatus = rollUpDayStatus(sameDayStatuses) ?? input.status;

  const { data: sisRecord, error: sisError } = await supabase
    .from("student_attendance_records")
    .upsert(
      {
        student_id: input.studentId,
        attendance_date: dateStr,
        status: dayStatus,
        attendance_context: "period",
        notes: input.notes ?? null,
        parent_notified: input.notifyParent ?? false,
        parent_notified_at: input.notifyParent ? new Date().toISOString() : null,
        recorded_by: input.recordedBy ?? null,
      },
      { onConflict: "student_id,attendance_date" }
    )
    .select("id")
    .single();

  if (sisError) return { error: sisError.message };

  /* Link the class row to the day row. Checked, like everything else here. */
  if (sisRecord?.id) {
    const { error: linkError } = await supabase
      .from("session_attendance_records")
      .update({ sis_attendance_record_id: sisRecord.id })
      .eq("instructional_session_id", input.sessionId)
      .eq("student_id", input.studentId);

    if (linkError) return { error: linkError.message };
  }

  await logStudentCommunicationEvent(supabase, {
    studentId: input.studentId,
    schoolId,
    channel: "attendance",
    direction: "internal",
    subject: `Session attendance: ${input.status.replace(/_/g, " ")}`,
    body: input.notes ?? `Recorded from instructional session`,
    actorUserId: input.recordedBy,
    relatedEntityType: "instructional_sessions",
    relatedEntityId: input.sessionId,
  });

  if (input.notifyParent && input.status.startsWith("absent") && schoolId) {
    const statusLabel = input.status.replace(/_/g, " ");
    const { deliverParentCommunication } = await import(
      "@/lib/platform/parent-communication/deliver"
    );
    await deliverParentCommunication(supabase, {
      studentId: input.studentId,
      schoolId,
      category: "attendance",
      title: `Session attendance: ${statusLabel}`,
      body: input.notes ?? `Recorded from instructional session on ${dateStr}`,
      channel: "parent_portal",
      actorUserId: input.recordedBy,
      href: "/portal",
      relatedEntityType: "instructional_sessions",
      relatedEntityId: input.sessionId,
      metadata: { attendanceStatus: input.status, attendanceDate: dateStr },
      createFollowUpWork: true,
      followUpHref: `/dashboard/students/${input.studentId}?section=attendance`,
    });
  }

  return { success: true, sisRecordId: sisRecord?.id, dayStatus };
}
