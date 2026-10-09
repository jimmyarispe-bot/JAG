"use server";

/**
 * Everything a teacher does to their own week.
 *
 * WHAT GUARDS WHAT, AND WHY BOTH.
 *
 * Row-level security (migration 462) is the boundary: a teacher reaches their
 * own open week and nothing else, and no client may write frozen_total_cents.
 * These actions do not re-implement that - they could not be trusted to, and
 * a second copy of a rule is a second place for it to drift.
 *
 * What they DO add is the reason. RLS refuses by returning zero rows with no
 * error, which on a screen looks exactly like success. Every action below
 * checks what came back and says what happened, because "nothing visibly
 * changed" is the failure shape this platform keeps producing.
 *
 * NOTHING HERE ACCEPTS A FIGURE. No action takes cents, a total, or a rate.
 * The teacher says what they taught and who was there; the money is derived
 * in rates.ts on read. That is the whole point of the new model: the old
 * screen's gross_cents arrived from the browser and could not be verified.
 */

import { revalidatePath } from "next/cache";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { requireTeacherWeekContext } from "@/lib/finance/teacher-pay/access";
import {
  ensureOpenWeek,
  firstOfMonth,
  weekIsReachable,
  mayLogCourse,
  RATE_BY_KEY,
  RATE_KEYS_BY_EMPLOYEE,
  START_HOURS,
} from "@/lib/finance/teacher-pay/week-store";
import { EXTRA_RULES, type ExtraKind } from "@/lib/finance/teacher-pay/rates";

const PAGE = "/dashboard/teacher/week";

type Result = { success: true } | { error: string };

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/*
 * A DISCRIMINATED UNION, NOT AN OPTIONAL error FIELD.
 *
 * The first version returned either {supabase, employeeId, weekId} or
 * {error}, and callers tested `"error" in week`. TypeScript widened the two
 * into one shape carrying `error?: undefined` and the narrowing stopped
 * working - npx tsc refused it. An explicit `ok` flag cannot be widened into
 * ambiguity, and it reads the same way at every call site.
 */
type OpenWeek =
  | { ok: true; supabase: AuthClient; employeeId: string; weekId: string }
  | { ok: false; error: string };

function refresh() {
  revalidatePath(PAGE);
}

/** A week a teacher may still change. Returns its id, or why not. */
async function myOpenWeek(weekStart: string): Promise<OpenWeek> {
  const ctx = await requireTeacherWeekContext();
  if ("error" in ctx) return { ok: false, error: ctx.error };

  /* The page hides the arrow that would leave the range. This is the half
     that cannot be got round by typing a URL. */
  if (!weekIsReachable(weekStart)) {
    return {
      ok: false,
      error:
        "You can only log this week and last week. Tell Jimmy if you need an " +
        "older one reopened.",
    };
  }

  const week = await ensureOpenWeek(ctx.supabase, ctx.employeeId, weekStart);
  if ("error" in week) return { ok: false, error: week.error };

  const { data } = await ctx.supabase
    .from("teacher_weeks")
    .select("status")
    .eq("id", week.weekId)
    .maybeSingle();

  if (String(data?.status ?? "open") !== "open") {
    return {
      ok: false,
      error:
        "This week has been submitted, so it can no longer be changed. " +
        "Tell Jimmy what needs correcting.",
    };
  }

  return { ok: true, supabase: ctx.supabase, employeeId: ctx.employeeId, weekId: week.weekId };
}

/* -------------------------------------------------------------------------- */
/* Classes                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Log a class. Item 7 to item 11 in one action.
 *
 * The hour is checked here as well as by the database's own constraint,
 * because a check constraint's error message is not something to put in front
 * of a teacher at ten to midnight on a Friday.
 */
/**
 * ONE SUBMISSION, AS MANY DAYS AS WERE TICKED.
 *
 * Peter Alouise, 2 October 2026: "It will only let me select each class for
 * one day at a time, not Monday-Friday." He teaches the same class five days
 * a week and was filling the form five times.
 *
 * EACH DAY IS STILL ITS OWN CLASS. Five ticks make five rows, not one row
 * with five dates. That matters: pay is per class, a child can be absent on
 * Wednesday and present on Thursday, and a teacher may want to remove Friday
 * alone. Nothing downstream needs to learn a new shape.
 *
 * A DAY ALREADY LOGGED IS NOT AN ERROR. If Monday is already on the week and
 * the teacher ticks Monday to Friday, Monday is left exactly as it is -
 * children and all - and the other four are added. Saying "that class is
 * already there" and adding nothing would make her undo her own ticks to get
 * the four she wanted, at ten to midnight on a Friday.
 */
export async function addClassAction(input: {
  weekStart: string;
  courseId: string;
  campus: "virtual" | "hs";
  /** One date per ticked day, ISO. A single day is an array of one. */
  classDates: string[];
  startTimeEt: string;
  isGuest: boolean;
  guestForEmployeeId: string | null;
}): Promise<Result> {
  const week = await myOpenWeek(input.weekStart);
  if (!week.ok) return { error: week.error };

  if (!input.courseId) return { error: "Choose which class you taught." };

  const dates = [...new Set((input.classDates ?? []).filter(Boolean))].sort();
  if (dates.length === 0) return { error: "Tick at least one day you taught it." };
  if (!START_HOURS.includes(input.startTimeEt)) {
    return { error: "Choose a start time between 7:00am and 11:00pm." };
  }
  /* Guest and whose-class travel together or not at all - the same pairing the
     database insists on, said in words first. */
  if (input.isGuest && !input.guestForEmployeeId) {
    return { error: "You marked this as guest teaching. Say whose class it was." };
  }

  /*
   * CHECKED AGAIN HERE, NOT ONLY IN THE DROPDOWN.
   *
   * listCourseOptions leaves a restricted class out of the picker, and a
   * dropdown is not a boundary - a course id is a string in a form
   * submission. This is also what keeps the archived classes unusable: a
   * course absent from the catalogue is refused for not being on the list.
   */
  const allowed = await mayLogCourse(week.supabase, week.employeeId, input.courseId);
  if (!allowed.ok) return { error: allowed.reason };

  /*
   * INSERTED ONE DAY AT A TIME ON PURPOSE, not as one batch. A batch is a
   * single statement: one day colliding with the unique constraint rolls the
   * whole lot back, and the teacher is told nothing was saved when four of
   * her five days were perfectly good.
   */
  const alreadyThere: string[] = [];
  let added = 0;

  for (const classDate of dates) {
    const { error } = await week.supabase.from("teacher_class_entries").insert({
      teacher_week_id: week.weekId,
      course_id: input.courseId,
      campus: input.campus,
      class_date: classDate,
      start_time_et: input.startTimeEt,
      is_guest: input.isGuest,
      guest_for_employee_id: input.isGuest ? input.guestForEmployeeId : null,
    });

    if (!error) {
      added += 1;
      continue;
    }

    if (error.message.includes("teacher_class_entries_unique")) {
      alreadyThere.push(classDate);
      continue;
    }

    /* A real failure stops here and says how far it got, rather than
       pretending the earlier days did not happen. */
    refresh();
    return {
      error:
        added > 0
          ? `${added} day(s) were added, then this one failed: ${error.message}. Nothing was added twice.`
          : `The class was not saved: ${error.message}`,
    };
  }

  refresh();

  if (added === 0) {
    return {
      error:
        alreadyThere.length === 1
          ? "That class is already on that day at that hour. Nothing was added twice."
          : "Those classes are all already on the week at that hour. Nothing was added twice.",
    };
  }

  return { success: true };
}

export async function removeClassAction(weekStart: string, entryId: string): Promise<Result> {
  const week = await myOpenWeek(weekStart);
  if (!week.ok) return { error: week.error };

  const { data, error } = await week.supabase
    .from("teacher_class_entries")
    .delete()
    .eq("id", entryId)
    .eq("teacher_week_id", week.weekId)
    .select("id");

  if (error) return { error: `The class was not removed: ${error.message}` };
  /* Zero rows and no error is a refusal wearing a success costume. */
  if (!data || data.length === 0) {
    return { error: "That class was not removed. It may already be gone, or not be yours." };
  }

  refresh();
  return { success: true };
}

/**
 * She was down to teach this and did not - paysheet change 3 of 6.
 *
 * Jimmy, 8 October 2026: "teachers need to identify/select which classes
 * they missed each day".
 *
 * THE ROW STAYS. Until now the only way to say "I did not teach that" was
 * to never add it, or to remove it - and a missing row is indistinguishable
 * from a class nobody ever scheduled. Nobody can see a gap in cover without
 * asking her, and a colleague who stood in has nothing to point at.
 *
 * A MISSED CLASS PAYS NOTHING, and the pricing is not consulted to decide
 * that - week-view.ts returns zero for a missed line before it looks at the
 * roster at all. A class she did not teach must not be able to pay her by
 * accident because children are still ticked on it.
 *
 * Her own week, while it is open, like every other write here. The
 * teacher_week_id filter is what makes that true rather than hoped for.
 */
export async function setClassMissedAction(
  weekStart: string,
  entryId: string,
  missed: boolean,
  note?: string
): Promise<Result> {
  const week = await myOpenWeek(weekStart);
  if (!week.ok) return { error: week.error };

  const { data, error } = await week.supabase
    .from("teacher_class_entries")
    .update({
      missed,
      /* Cleared when she un-marks it. A reason left behind on a class she
         did teach is a sentence nobody can explain six weeks later. */
      missed_note: missed && note?.trim() ? note.trim() : null,
    })
    .eq("id", entryId)
    .eq("teacher_week_id", week.weekId)
    .select("id");

  if (error) return { error: `That was not saved: ${error.message}` };
  /* Zero rows and no error is a refusal wearing a success costume. */
  if (!data || data.length === 0) {
    return { error: "That class was not changed. It may not be yours, or the week may be closed." };
  }

  refresh();
  return { success: true };
}

/* -------------------------------------------------------------------------- */
/* Who was on the class                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Schedule a child onto a class - item 12. THIS is what the class pays on.
 *
 * Marking somebody absent afterwards does not take it away again: Jimmy,
 * 29 September, an absence does not reduce the teacher's pay. The two facts
 * live in one row for exactly that reason.
 */
export async function scheduleStudentAction(
  weekStart: string,
  entryId: string,
  studentId: string
): Promise<Result> {
  const week = await myOpenWeek(weekStart);
  if (!week.ok) return { error: week.error };

  const { error } = await week.supabase
    .from("teacher_class_students")
    .insert({ entry_id: entryId, student_id: studentId });

  if (error) {
    if (error.message.includes("teacher_class_students_unique")) {
      return { error: "That child is already on this class." };
    }
    return { error: `That child was not added: ${error.message}` };
  }

  refresh();
  return { success: true };
}

export async function unscheduleStudentAction(
  weekStart: string,
  entryId: string,
  studentId: string
): Promise<Result> {
  const week = await myOpenWeek(weekStart);
  if (!week.ok) return { error: week.error };

  const { data, error } = await week.supabase
    .from("teacher_class_students")
    .delete()
    .eq("entry_id", entryId)
    .eq("student_id", studentId)
    .select("id");

  if (error) return { error: `That child was not removed: ${error.message}` };
  if (!data || data.length === 0) {
    return { error: "That child was not removed. The class may not be yours." };
  }

  refresh();
  return { success: true };
}

/**
 * The same children, on the other days of the same class.
 *
 * Ticking Monday to Friday makes five classes. Tapping nine children onto
 * each of them is forty-five taps for a week somebody already taught. This
 * is the one button that does the other four.
 *
 * IT ONLY FILLS EMPTY CLASSES, and that is the whole safety of it. A day
 * that already has children on it is left exactly alone - because a teacher
 * who has already corrected Wednesday's roster should not have it quietly
 * overwritten by Monday's. If she wants Wednesday replaced, she can take the
 * children off it herself and press this again.
 *
 * ABSENCES ARE NOT COPIED either. Who was scheduled travels; who failed to
 * turn up on Monday is a fact about Monday.
 */
export async function copyRosterToMyOtherClassesAction(
  weekStart: string,
  entryId: string
): Promise<Result> {
  const week = await myOpenWeek(weekStart);
  if (!week.ok) return { error: week.error };

  /* The class being copied FROM, and that it is this teacher's own week. */
  const { data: source, error: sourceError } = await week.supabase
    .from("teacher_class_entries")
    .select("id, course_id")
    .eq("id", entryId)
    .eq("teacher_week_id", week.weekId)
    .maybeSingle();

  if (sourceError) return { error: `Could not read that class: ${sourceError.message}` };
  if (!source) return { error: "That class is not on your week." };

  const { data: roster, error: rosterError } = await week.supabase
    .from("teacher_class_students")
    .select("student_id")
    .eq("entry_id", entryId);

  if (rosterError) return { error: `Could not read the children: ${rosterError.message}` };
  if (!roster || roster.length === 0) {
    return { error: "Put the children on this class first, then copy them across." };
  }

  const { data: siblings, error: siblingError } = await week.supabase
    .from("teacher_class_entries")
    .select("id")
    .eq("teacher_week_id", week.weekId)
    .eq("course_id", (source as { course_id: string }).course_id)
    .neq("id", entryId);

  if (siblingError) return { error: `Could not find the other days: ${siblingError.message}` };
  if (!siblings || siblings.length === 0) {
    return { error: "There are no other days of this class on your week to copy to." };
  }

  const studentIds = (roster as { student_id: string }[]).map((r) => r.student_id);
  let filled = 0;
  let skipped = 0;

  for (const sibling of siblings as { id: string }[]) {
    const { count, error: countError } = await week.supabase
      .from("teacher_class_students")
      .select("id", { count: "exact", head: true })
      .eq("entry_id", sibling.id);

    if (countError) return { error: `Could not check a day: ${countError.message}` };

    /* Already has children. Left alone, and counted so she is told. */
    if ((count ?? 0) > 0) {
      skipped += 1;
      continue;
    }

    const { error: insertError } = await week.supabase
      .from("teacher_class_students")
      .insert(studentIds.map((studentId) => ({ entry_id: sibling.id, student_id: studentId })));

    if (insertError) {
      refresh();
      return {
        error:
          filled > 0
            ? `${filled} day(s) were filled, then this one failed: ${insertError.message}`
            : `The children were not copied: ${insertError.message}`,
      };
    }
    filled += 1;
  }

  refresh();

  if (filled === 0) {
    return {
      error:
        `The other ${skipped} day(s) of this class already have children on them, ` +
        `so nothing was changed. Take the children off a day first if you want it replaced.`,
    };
  }
  return { success: true };
}

/** Item 13. Recorded, and deliberately without effect on the money. */
export async function setAbsentAction(
  weekStart: string,
  entryId: string,
  studentId: string,
  absent: boolean
): Promise<Result> {
  const week = await myOpenWeek(weekStart);
  if (!week.ok) return { error: week.error };

  const { data, error } = await week.supabase
    .from("teacher_class_students")
    .update({ absent })
    .eq("entry_id", entryId)
    .eq("student_id", studentId)
    .select("id");

  if (error) return { error: `Attendance was not saved: ${error.message}` };
  if (!data || data.length === 0) {
    return { error: "Attendance was not saved. The class may not be yours." };
  }

  refresh();
  return { success: true };
}

/* -------------------------------------------------------------------------- */
/* The extras — item 17                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Set how many of one kind of extra this week carries. Zero removes it.
 *
 * The month rules and the monthly caps are rates.ts's job and the database's;
 * this refuses only what it can say plainly - a kind nobody recognises, or a
 * count that is not a count.
 */
export async function setExtraClaimAction(
  weekStart: string,
  kind: ExtraKind,
  quantity: number
): Promise<Result> {
  const week = await myOpenWeek(weekStart);
  if (!week.ok) return { error: week.error };

  const rule = EXTRA_RULES[kind];
  if (!rule) return { error: "That is not something that can be claimed." };
  if (!Number.isFinite(quantity) || quantity < 0) {
    return { error: `${rule.label}: enter how many, or zero.` };
  }
  if (rule.per !== "hour" && !Number.isInteger(quantity)) {
    return { error: `${rule.label} is counted in whole numbers.` };
  }

  const claimMonth = firstOfMonth(weekStart);

  if (quantity === 0) {
    await week.supabase
      .from("teacher_extra_claims")
      .delete()
      .eq("teacher_week_id", week.weekId)
      .eq("kind", kind)
      .eq("claim_month", claimMonth);
    refresh();
    return { success: true };
  }

  /* Delete-then-insert rather than upsert: the unique index that enforces the
     monthly cap covers (employee_id, kind, claim_month) and only for two of
     the five kinds, so there is no single conflict target an upsert could
     name that is right for all of them. */
  await week.supabase
    .from("teacher_extra_claims")
    .delete()
    .eq("teacher_week_id", week.weekId)
    .eq("kind", kind)
    .eq("claim_month", claimMonth);

  const { error } = await week.supabase.from("teacher_extra_claims").insert({
    teacher_week_id: week.weekId,
    employee_id: week.employeeId,
    claim_month: claimMonth,
    kind,
    quantity,
  });

  if (error) {
    if (error.message.includes("once_a_month")) {
      return {
        error: `${rule.label} has already been claimed this month, and it is one a month.`,
      };
    }
    return { error: `${rule.label} was not saved: ${error.message}` };
  }

  refresh();
  return { success: true };
}

/* -------------------------------------------------------------------------- */
/* The two hourly rates                                                       */
/* -------------------------------------------------------------------------- */

/** Craig Mann's tutoring and Katie Vetere's admin hours. Nobody else has one. */
export async function setHourlyClaimAction(
  weekStart: string,
  rateKey: string,
  hours: number
): Promise<Result> {
  const week = await myOpenWeek(weekStart);
  if (!week.ok) return { error: week.error };

  const rate = RATE_BY_KEY[rateKey];
  if (!rate) return { error: "That is not an hourly rate this platform knows." };

  /*
   * WHOSE RATE IS IT. Added 9 October 2026, within the hour of 002b12a5.
   *
   * Until that commit this function asked only whether the rate EXISTED. That
   * was survivable for exactly as long as no hourly box rendered anywhere -
   * teacher_hourly_claims was empty platform-wide, so no teacher had a reason
   * to know a rate key, and none was ever posted.
   *
   * 002b12a5 turned the boxes on. Craig Mann's rate is $30.00 an hour with
   * weeklyHourCap null, so from that deploy until this one, any of thirteen
   * teachers could have posted craig_mann_ivy_ash_tutoring with four hundred
   * hours and put a well-formed $12,000 line on Jimmy's payroll screen. The
   * picker never offered it; a server action is not a picker.
   *
   * CHECKED HERE AND NOT ONLY IN THE PICKER, because migration 462's policies
   * let a teacher write any row on her own open week. Row-level security
   * establishes WHICH WEEK is hers. It has never had an opinion about which
   * rates she holds, and this is the only place that can.
   *
   * A RATE SHE NO LONGER HOLDS BUT HAS ALREADY CLAIMED STAYS EDITABLE. Taking
   * somebody off RATE_KEYS_BY_EMPLOYEE must not freeze hours already entered
   * under it, or a week is left with a figure its owner cannot correct and
   * nobody can reconcile.
   */
  if (!(RATE_KEYS_BY_EMPLOYEE[week.employeeId] ?? []).includes(rateKey)) {
    const { data: alreadyClaimed } = await week.supabase
      .from("teacher_hourly_claims")
      .select("rate_key")
      .eq("teacher_week_id", week.weekId)
      .eq("rate_key", rateKey)
      .maybeSingle();

    if (!alreadyClaimed) {
      return { error: `${rate.label} is not one of your rates. Tell Jimmy if that is wrong.` };
    }
  }

  if (!Number.isFinite(hours) || hours < 0) return { error: `${rate.label}: enter your hours.` };
  if (rate.weeklyHourCap !== null && hours > rate.weeklyHourCap) {
    return { error: `${rate.label} is capped at ${rate.weeklyHourCap} hours a week.` };
  }

  if (hours === 0) {
    await week.supabase
      .from("teacher_hourly_claims")
      .delete()
      .eq("teacher_week_id", week.weekId)
      .eq("rate_key", rateKey);
    refresh();
    return { success: true };
  }

  const { error } = await week.supabase
    .from("teacher_hourly_claims")
    .upsert(
      { teacher_week_id: week.weekId, rate_key: rateKey, hours },
      { onConflict: "teacher_week_id,rate_key" }
    );

  if (error) return { error: `${rate.label} was not saved: ${error.message}` };

  refresh();
  return { success: true };
}

/* -------------------------------------------------------------------------- */
/* The week itself                                                            */
/* -------------------------------------------------------------------------- */

/** Item 16. Saved as she types it, not held until Submit. */
export async function saveKookyNoteAction(weekStart: string, note: string): Promise<Result> {
  const week = await myOpenWeek(weekStart);
  if (!week.ok) return { error: week.error };

  const { data, error } = await week.supabase
    .from("teacher_weeks")
    .update({ kooky_note: note.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", week.weekId)
    .select("id");

  if (error) return { error: `That was not saved: ${error.message}` };
  if (!data || data.length === 0) return { error: "That was not saved." };

  refresh();
  return { success: true };
}

/**
 * Submit, and the week closes.
 *
 * NO FIGURE IS WRITTEN HERE, and that is not an omission. frozen_total_cents
 * is refused to every client by migration 462's WITH CHECK; freezing it
 * belongs to a function that runs with the authority to be trusted, and that
 * function is the next thing to build. Until it exists, a submitted week's
 * total is recomputed on read from rows that can no longer change - which is
 * stable, because nothing underneath a submitted week is writable.
 *
 * A WEEK WITH NOTHING IN IT IS NOT A WEEK. Refusing an empty submission is
 * the difference between "I taught nothing" and "I forgot", and only one of
 * those should be silent.
 */
export async function submitWeekAction(weekStart: string, note: string): Promise<Result> {
  const week = await myOpenWeek(weekStart);
  if (!week.ok) return { error: week.error };

  const { count } = await week.supabase
    .from("teacher_class_entries")
    .select("id", { count: "exact", head: true })
    .eq("teacher_week_id", week.weekId);

  const { count: hourlyCount } = await week.supabase
    .from("teacher_hourly_claims")
    .select("id", { count: "exact", head: true })
    .eq("teacher_week_id", week.weekId);

  if ((count ?? 0) === 0 && (hourlyCount ?? 0) === 0) {
    return {
      error:
        "There is nothing in this week yet. Add the classes you taught before submitting, " +
        "or tell Jimmy if you genuinely taught none.",
    };
  }

  const { data, error } = await week.supabase
    .from("teacher_weeks")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      kooky_note: note.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", week.weekId)
    .select("id");

  if (error) return { error: `Your week was not submitted: ${error.message}` };
  if (!data || data.length === 0) {
    return { error: "Your week was not submitted, and no reason was given." };
  }

  refresh();
  return { success: true };
}
