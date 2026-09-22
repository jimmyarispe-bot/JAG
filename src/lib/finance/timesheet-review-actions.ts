"use server";

import { revalidatePath } from "next/cache";
import { requireFinanceAccess } from "@/lib/platform/identity/page-guard";
import { createAuthClient } from "@/lib/supabase/server-auth";

/**
 * Approving, or not.
 *
 * NOT APPROVED IS AN ANNOTATION, NOT A BLOCKAGE. Jimmy, 22 September: "the
 * time sheet is still sent to me with comments even when not approved." So
 * declining never withholds a week - it marks it, with a reason, and the week
 * still reaches Jimmy. A review step that CAN trap a teacher's pay eventually
 * will, on a Friday night when nobody is reading.
 *
 * A REFUSAL CARRIES ITS REASON. Twenty characters, enforced by the database in
 * migration 409, for the same reason amendments carry one: the entire value of
 * "not approved" is what comes after it. The check is here too so the teacher
 * gets a sentence rather than a constraint violation.
 *
 * THE FIGURE IS NOT TOUCHED. gross_cents was frozen when she submitted.
 * Reviewing records a judgement about that figure; it does not change it.
 */
export async function reviewWeekAction(
  employeeId: string,
  weekStart: string,
  approved: boolean,
  note?: string
) {
  /* The same gate the /dashboard/finance route uses. Danni and Jimmy pass;
     a SCHOOL_LEADER does not, which is why this is Danni's job. */
  await requireFinanceAccess();

  const trimmed = (note ?? "").trim();

  if (!approved && trimmed.length < 20) {
    return {
      error:
        "Say why, in at least 20 characters. A week marked not approved still goes to Jimmy, " +
        "so the comment is the only thing that tells him — and her — what was wrong.",
    };
  }

  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("teacher_week_submissions")
    .update({
      status: approved ? "approved" : "not_approved",
      review_note: trimmed ? trimmed : null,
      reviewed_by_user_id: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("employee_id", employeeId)
    .eq("week_start", weekStart)
    .select("employee_id");

  if (error) return { error: error.message };

  /* ZERO ROWS AND NO ERROR IS A POLICY REFUSAL WEARING A SUCCESS COSTUME.
     The house fault, found four times this week. An update that matches
     nothing returns success, so check what came back. */
  if (!data || data.length === 0) {
    return {
      error:
        "Nothing was updated. Either that week is not there, or the database declined the change.",
    };
  }

  revalidatePath("/dashboard/finance/timesheets");
  revalidatePath("/dashboard/teacher/timesheets");
  return { success: true };
}
