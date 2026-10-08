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

/**
 * Pay something other than what the JAG worked out - paysheet change 4 of 6.
 *
 * Jimmy, 8 October 2026: "add ability to enter a different pay amount than
 * what the jag figured", and asked who: him and Danni.
 *
 * THIS ONE DOES TAKE A FIGURE, and it is the only thing in either actions
 * file that does. Everything else here refuses a number from the browser on
 * purpose - approving reloads the week server-side and freezes what IT
 * computes, so the money is produced by one implementation of pricing with
 * tests behind it.
 *
 * The override is the opposite case by definition: it exists precisely
 * because a person disagrees with that implementation. A figure nobody typed
 * is not an override, it is just the total again.
 *
 * SO IT IS STORED SOMEWHERE ELSE. override_total_cents sits BESIDE
 * frozen_total_cents and never replaces it. The computed figure keeps being
 * computed and keeps being shown. A paysheet read in March answers both
 * questions - what was worked out, and what was decided - and an override is
 * never mistaken for a fault in the rate table.
 *
 * WHO IS ALLOWED IS NOT DECIDED HERE, same as approving and reopening:
 * set_teacher_week_override checks may_administer_teacher_pay() inside
 * itself, because security definer runs past row-level security and a check
 * around a function is not a check. Migration 519 wrote its own role list
 * there and 520 removed it - one answer to who may touch a teacher's pay.
 *
 * Dollars in, cents stored. A screen that asks for cents is a screen that
 * will one day be paid a hundred times what somebody meant.
 */
export async function setWeekOverrideAction(
  weekId: string,
  dollars: string,
  reason: string
): Promise<Result> {
  const supabase = await createAuthClient();

  const trimmed = dollars.trim();

  /* Empty means "go back to what the JAG worked out", which needs no
     reason: returning to the computed figure is not a decision to defend. */
  if (trimmed === "") {
    const { error } = await supabase.rpc("set_teacher_week_override", {
      p_week_id: weekId,
      p_cents: null,
      p_reason: null,
    });
    if (error) return { error: error.message };
    refresh();
    return { success: true };
  }

  /* Typed by a person at the end of a long week. A stray $ or comma is not
     a reason to refuse, but anything else is - "1,2 00" must not quietly
     become 1200. */
  const cleaned = trimmed.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return {
      error:
        `"${trimmed}" is not an amount. Type it in dollars, like 550 or 550.25.`,
    };
  }

  /* Round AFTER multiplying. 550.29 is 55028.999... in floating point, and
     a truncation here is a cent a teacher never sees and nobody can find. */
  const cents = Math.round(Number(cleaned) * 100);

  if (!reason.trim()) {
    return {
      error:
        "Say why the amount is different. A figure somebody changed with no " +
        "reason on it is indistinguishable from a fault six weeks later.",
    };
  }

  const { error } = await supabase.rpc("set_teacher_week_override", {
    p_week_id: weekId,
    p_cents: cents,
    p_reason: reason.trim(),
  });

  if (error) return { error: error.message };

  refresh();
  return { success: true };
}
