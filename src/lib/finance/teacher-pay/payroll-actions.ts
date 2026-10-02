"use server";

/**
 * Approving a week, and reopening one.
 *
 * These are Jimmy's and Danni's, not a teacher's. Everything a teacher does
 * lives in actions.ts, which deliberately accepts no figure at all; this file
 * is the other side of the same rule.
 *
 * NOTHING HERE ACCEPTS A FIGURE EITHER, and that is the point worth reading.
 * Approving writes frozen_total_cents - the only money ever stored rather
 * than derived - so the obvious shape would be a button handing the number
 * it is displaying to the server. It does not. The action reloads the week
 * server-side through loadTeacherWeek, the same function the screen used,
 * and approves THAT total. The browser contributes a week id and a press.
 *
 * So the figure frozen is produced by one implementation of pricing, in
 * rates.ts, with tests - not by a second one in SQL, and not by whatever
 * arrived in a request body.
 *
 * WHO IS ALLOWED IS NOT DECIDED HERE. approve_teacher_week and
 * reopen_teacher_week check may_administer_teacher_pay() inside themselves,
 * because security definer runs past row-level security and a check around a
 * function is not a check. These actions add the reason, not the boundary:
 * an RPC that refuses returns an error a person can read, which the screen
 * then shows instead of appearing to have done nothing.
 */

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { loadTeacherWeek } from "@/lib/finance/teacher-pay/week-store";

type Result = { success: true } | { error: string };

function refresh() {
  revalidatePath("/dashboard/finance/teacher-pay");
}

/**
 * Freeze a submitted week at what it is worth, now.
 *
 * The employee and week are passed rather than the total, so the amount
 * written is the one this server computes at the moment of approval.
 */
export async function approveWeekAction(
  employeeId: string,
  weekStart: string
): Promise<Result> {
  const supabase = await createAuthClient();

  const loaded = await loadTeacherWeek(supabase, employeeId, weekStart);

  if (loaded.unavailable) {
    return { error: `That week could not be read, so it was not approved: ${loaded.unavailable}` };
  }
  if (!loaded.weekId) {
    return { error: "There is no week to approve - this teacher has logged nothing." };
  }
  if (loaded.view.status === "approved") {
    return { error: "That week is already approved. Reopen it first if it needs changing." };
  }
  if (loaded.view.status !== "submitted") {
    return { error: "Only a week the teacher has submitted can be approved." };
  }

  /*
   * A week that could not be priced must not be frozen at a number that
   * silently excludes the part that failed. Said out loud instead.
   */
  if (loaded.view.problems.length > 0) {
    return {
      error:
        "Something in this week could not be priced, so approving it would freeze a figure " +
        "that leaves that out. Open the week and look before approving.",
    };
  }

  const { error } = await supabase.rpc("approve_teacher_week", {
    p_week_id: loaded.weekId,
    p_total_cents: loaded.view.totalCents,
  });

  if (error) return { error: `That week was not approved: ${error.message}` };

  refresh();
  return { success: true };
}

/**
 * Put an approved or submitted week back to open, on the record.
 *
 * The reason is required here as well as in the database. The constraint is
 * the guarantee; this is so the person finds out before the press rather
 * than after it.
 */
export async function reopenWeekAction(
  weekId: string,
  reason: string
): Promise<Result> {
  const trimmed = (reason ?? "").trim();
  if (trimmed.length < 3) {
    return { error: "Say why the week is being reopened. It goes on the record." };
  }

  const supabase = await createAuthClient();

  const { error } = await supabase.rpc("reopen_teacher_week", {
    p_week_id: weekId,
    p_reason: trimmed,
  });

  if (error) return { error: `That week was not reopened: ${error.message}` };

  refresh();
  return { success: true };
}
