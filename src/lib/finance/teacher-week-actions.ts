"use server";

import { revalidatePath } from "next/cache";
import { requireTeacherExperienceContext } from "@/lib/teacher/experience/access";
import { easternDate } from "@/lib/scheduling/attendance-bridge";
import { getTeacherWeek, mondayOf, WEEKLY_SUBMISSION_GO_LIVE } from "@/lib/finance/teacher-week";

/**
 * Marking a class held or not held.
 *
 * Jimmy, 19 September 2026: "if a teacher is absent or has technical issues and
 * does not hold the class then they are not paid for that class." The default
 * is paid. NOT holding it is the exception, and it is recorded by cancelling
 * the session rather than by silence - so an unpaid class always has a reason
 * attached to it and can be seen afterwards.
 */
/**
 * Who was in the room.
 *
 * ATTENDANCE HAS NEVER BEEN RECORDED IN JAG. session_attendance_records has
 * been empty since migration 082 shipped, against 1,025 classes already
 * taught. This is the first thing that writes to it.
 *
 * ABSENCE IS THE EXCEPTION, THE SAME WAY NOT-TEACHING IS. No row means the
 * child was there. A teacher who never opens a class has said nothing, and
 * saying nothing must mean the ordinary thing happened - the opposite default
 * would turn forgetting into a mark against a child, and against a teacher's
 * pay once the nobody-came rule lands.
 *
 * virtual_present, not present: these are virtual classes, and the bridge in
 * attendance-bridge.ts already folds virtual_present into a daily "present" on
 * the SIS record. Writing the session row is enough; the day follows.
 *
 * absent_unexcused is recorded for an absence because it is the literal truth -
 * no excuse has been entered. Whether a teacher should be able to mark an
 * absence EXCUSED is a state-records question, not a pay one, and is
 * deliberately left for Jimmy to decide rather than guessed at here.
 *
 * THIS DOES NOT CHANGE PAY. Tonight it records. The rule Jimmy set - pay the
 * enrolled roster unless nobody came at all - ships separately, once real
 * attendance has been seen to write correctly.
 */
export async function setAttendanceAction(
  sessionId: string,
  studentId: string,
  present: boolean
) {
  const ctx = await requireTeacherExperienceContext();

  /* Hers, or she covered it. Both are allowed to take the register - a guest
     standing in front of the class is the person who knows who is in it. */
  const { data: session, error: readError } = await ctx.supabase
    .from("instructional_sessions")
    .select("id, instructor_employee_id, scheduled_start, course_sections(instructor_employee_id)")
    .eq("id", sessionId)
    .maybeSingle();

  if (readError) return { error: readError.message };
  if (!session) return { error: "That class could not be found." };

  const sectionRel = session.course_sections as
    | { instructor_employee_id?: string | null }
    | { instructor_employee_id?: string | null }[]
    | null;
  const sectionTeacher = Array.isArray(sectionRel)
    ? sectionRel[0]?.instructor_employee_id
    : sectionRel?.instructor_employee_id;

  if (
    session.instructor_employee_id !== ctx.employeeId &&
    sectionTeacher !== ctx.employeeId
  ) {
    return { error: "That is not your class." };
  }

  /* A submitted week is a receipt. Attendance recorded after it was signed off
     would change what the receipt means without changing the receipt. */
  const weekStart = mondayOf(easternDate(session.scheduled_start as string));
  const week = await getTeacherWeek(ctx.supabase, ctx.employeeId, weekStart);
  if (week.status === "submitted") {
    return {
      error:
        "That week has been submitted and cannot be edited. File an amendment saying what changed.",
    };
  }

  const { error: writeError } = await ctx.supabase
    .from("session_attendance_records")
    .upsert(
      {
        instructional_session_id: sessionId,
        student_id: studentId,
        attendance_status: present ? "virtual_present" : "absent_unexcused",
        recorded_by: ctx.actorUserId,
        recorded_at: new Date().toISOString(),
      },
      { onConflict: "instructional_session_id,student_id" }
    );

  /* A refusal here returns zero rows and no error under some policies. The
     upsert reports its own error, so check it - the whole reason attendance
     could silently miss a third of a class was a policy that said nothing. */
  if (writeError) return { error: writeError.message };

  revalidatePath("/dashboard/teacher/timesheets");
  return { success: true };
}

export async function setClassHeldAction(sessionId: string, held: boolean, note?: string) {
  const ctx = await requireTeacherExperienceContext();

  /* The session must be this teacher's own. Without this check a teacher could
     cancel somebody else's class - and therefore somebody else's pay. */
  const { data: session, error: readError } = await ctx.supabase
    .from("instructional_sessions")
    .select("id, instructor_employee_id, scheduled_start")
    .eq("id", sessionId)
    .maybeSingle();

  if (readError) return { error: readError.message };
  if (!session) return { error: "That class could not be found." };
  if (session.instructor_employee_id !== ctx.employeeId) {
    return { error: "That is not your class." };
  }

  /* A submitted week is frozen. A forgotten class becomes an amendment, not an
     edit - the original stays exactly as it was verified. */
  const weekStart = mondayOf(easternDate(session.scheduled_start as string));
  const week = await getTeacherWeek(ctx.supabase, ctx.employeeId, weekStart);

  if (week.status === "submitted") {
    return {
      error:
        "That week has been submitted and cannot be edited. File an amendment saying what changed.",
    };
  }

  const { error: writeError } = await ctx.supabase
    .from("instructional_sessions")
    .update({
      session_status: held ? "completed" : "cancelled",
      attendance_notes: note?.trim() ? note.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("instructor_employee_id", ctx.employeeId);

  if (writeError) return { error: writeError.message };

  revalidatePath("/dashboard/teacher/timesheets");
  return { success: true };
}

/**
 * Submitting the week.
 *
 * THE FIGURE IS COMPUTED ONCE, HERE, AND KEPT. Earth Lab pays $20 plus $5 for
 * each additional student, so a class taught with four children is $35 - and if
 * this were recomputed on every read, that same class would show $30 in
 * November after one of them withdrew. The class happened with four children at
 * the rate that applied that day. A submitted week is a receipt, not a formula.
 */
export async function submitWeekAction(weekStart: string) {
  const ctx = await requireTeacherExperienceContext();

  if (weekStart < WEEKLY_SUBMISSION_GO_LIVE) {
    return { error: `Weekly submission starts on Monday ${WEEKLY_SUBMISSION_GO_LIVE}.` };
  }

  const week = await getTeacherWeek(ctx.supabase, ctx.employeeId, weekStart);

  if (week.unavailable) return { error: week.unavailable };
  if (week.status === "submitted") {
    return { error: "You have already submitted that week." };
  }

  const held = week.days.flatMap((d) => d.classes).filter((c) => c.held);

  /* An empty week is almost certainly a mistake rather than a week with no
     work in it, and submitting one freezes a zero that then needs an amendment
     to undo. Refuse, and say why. */
  if (held.length === 0) {
    return {
      error:
        "There are no held classes in that week, so there is nothing to submit. " +
        "If you taught and the classes are not here, say so before submitting.",
    };
  }

  const unrated = held.filter((c) => c.unrated);
  if (unrated.length > 0) {
    return {
      error:
        `${unrated.length} of your classes have no agreed rate, so the total would be wrong. ` +
        `Nothing has been submitted. Tell Jimmy which classes: ` +
        unrated.map((c) => `${c.courseName} on ${c.classDate}`).join(", "),
    };
  }

  const {
    data: { user },
  } = await ctx.supabase.auth.getUser();

  const { error: writeError } = await ctx.supabase.from("teacher_week_submissions").upsert(
    {
      employee_id: ctx.employeeId,
      week_start: week.weekStart,
      week_end: week.weekEnd,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      submitted_by: user?.id ?? null,
      gross_cents: Math.round(week.gross * 100),
      session_count: held.length,
      unheld_count: week.classesNotHeld,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "employee_id,week_start" }
  );

  if (writeError) return { error: writeError.message };

  revalidatePath("/dashboard/teacher/timesheets");
  return { success: true, gross: week.gross, classes: held.length };
}
