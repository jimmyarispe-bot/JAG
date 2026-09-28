"use server";

import { revalidatePath } from "next/cache";

import { assertPermission } from "@/lib/platform/identity/action-guards";
import {
  buildPlan,
  standardSlots,
  type PlanLineInput,
} from "@/lib/finance/plan-builder";
import { loadPlanEditorContext } from "@/lib/finance/plan-editor";
import { lifecycleForNewPlan } from "@/lib/finance/plan-editor-shared";

/**
 * Save a tuition plan.
 *
 * THE ARITHMETIC IS DONE ON THE SERVER, AGAIN.
 *
 * The browser computes the same figures so a person can see them change as they
 * work, but nothing it computed is trusted here. What arrives is the SELECTION —
 * which items, how many sessions, which awards — and the server prices it from
 * the catalog it reads itself. A total posted from a form is a total anybody
 * can post.
 *
 * `buildPlan` throws rather than returns when a plan would owe money that no
 * payment collects. That is caught here and returned as an error, because the
 * one thing this action must never do is write a schedule that does not add up.
 */

export interface SavePlanSelection {
  readonly studentId: string;
  readonly billingMode: "scheduled" | "monthly_open";
  /** catalogItemId -> sessions per month, or 0 for "as a class". */
  readonly selectedItems: { readonly catalogItemId: string; readonly sessionsPerMonth: number }[];
  readonly awardIds: string[];
  readonly siblingDiscountPercent: number;
  readonly prorationMonths: number | null;
  readonly firstPayableMonth: string;
  readonly monthlyAmount: number | null;
  readonly paymentChannel: string | null;
  readonly notes: string | null;
}

export async function saveTuitionPlan(selection: SavePlanSelection) {
  // finance.billing is the only key that exists for this. "finance.manage"
  // reads plausibly and is not in PERMISSION_KEYS — tsc caught it, which is
  // the whole reason the keys are typed.
  const auth = await assertPermission("finance.billing");
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const ctx = await loadPlanEditorContext(selection.studentId);
  if ("error" in ctx) return { error: ctx.error };

  // MORE MONTHS ATTENDING THAN THE YEAR HAS IS REFUSED, NOT IGNORED.
  //
  // A browser still holding the old twelve-month list would send 11 or 12 for a
  // ten-month campus. buildPlan treats monthsAttending >= monthsInYear as "no
  // proration" and bills the full year, which happens to be the right number
  // and for the wrong reason - and 11 of 10 months would have been printed on
  // the family's schedule if the label were ever reached. Say what is wrong.
  if (
    selection.prorationMonths !== null &&
    selection.prorationMonths > ctx.monthsInYear
  ) {
    return {
      error:
        `This plan says ${selection.prorationMonths} months attending, but ${ctx.schoolYearName} ` +
        `at ${ctx.schoolName} runs ${ctx.schoolYearStartDate} to ${ctx.schoolYearEndDate}, ` +
        `which is ${ctx.monthsInYear} months. Reload the page and choose again.`,
    };
  }

  const chosen = new Map(
    selection.selectedItems.map((s) => [s.catalogItemId, s.sessionsPerMonth])
  );

  const lines: PlanLineInput[] = ctx.catalog
    .filter((c) => chosen.has(c.catalogItemId))
    .map((c) => {
      const sessions = chosen.get(c.catalogItemId) ?? 0;
      return {
        itemCode: c.itemCode,
        itemName: c.itemName,
        amount: c.amount,
        frequency: c.frequency,
        oneToOneSessionRate: c.oneToOneSessionRate,
        // Zero sessions means "bought as a class", which is a different price.
        // Undefined rather than 0, because 0 sessions at a session rate is a
        // real and different answer: nothing bought.
        sessionsPerMonth: sessions > 0 ? sessions : undefined,
        billedToFamily: c.billedToFamily,
      };
    });

  if (lines.length === 0 && selection.billingMode === "scheduled") {
    return { error: "Choose at least one thing this family is paying for." };
  }

  // AN AWARD WITH NO DECIDED AMOUNT IS REFUSED, NOT QUIETLY DROPPED.
  //
  // The filter below would leave it out in silence and build a plan billing
  // the family the whole tuition - a correct-looking document carrying the
  // wrong number. Name what is missing instead.
  const selectedButUndecided = ctx.awards.filter(
    (a) => selection.awardIds.includes(a.id) && !a.amountIsDecided
  );
  if (selectedButUndecided.length > 0) {
    const names = selectedButUndecided.map((a) => a.programName).join(", ");
    return {
      error:
        `${names} has no decided amount yet, so it cannot be applied to this plan. ` +
        `Record the amount on the award first, or untick it and save the plan as ` +
        `waiting on that figure.`,
    };
  }

  const awards = ctx.awards
    .filter((a) => selection.awardIds.includes(a.id) && a.status === "awarded")
    .map((a) => ({ programName: a.programName, awardedAmount: a.awardedAmount }));

  // Where this plan starts in the money chain. A child whose family has
  // applied for an award nobody has decided is not a forgotten draft - it is
  // blocked on a named figure, and plans_waiting_on_a_figure surfaces it.
  const { lifecycle, awaitingReason } = lifecycleForNewPlan(ctx.awards);

  let built;
  if (selection.billingMode === "scheduled") {
    try {
      built = buildPlan({
        lines,
        bundleDiscounts: ctx.bundles.map((b) => ({
          name: b.name,
          packageItemCode: b.packageItemCode,
          minAdditionalItems: b.minAdditionalItems,
          amount: b.amount,
        })),
        siblingDiscountPercent: selection.siblingDiscountPercent || undefined,
        scholarships: awards,
        // monthsInYear comes from the campus's own school year, never the
        // literal 12. See school-year-months.ts.
        proration:
          selection.prorationMonths && selection.prorationMonths < ctx.monthsInYear
            ? {
                monthsAttending: selection.prorationMonths,
                monthsInYear: ctx.monthsInYear,
              }
            : undefined,
        instalments: standardSlots(selection.firstPayableMonth),
      });
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Could not build that plan." };
    }
  } else if (!selection.monthlyAmount || selection.monthlyAmount <= 0) {
    return { error: "A month-to-month plan needs a monthly amount." };
  }

  // Supersede rather than delete. The schedule a family signed matters after it
  // is replaced — it is what they will hold up if they disagree with an invoice.
  const { error: supersedeError } = await supabase
    .from("student_tuition_plans")
    .update({ status: "superseded", updated_at: new Date().toISOString() })
    .eq("student_id", selection.studentId)
    .eq("school_year_id", ctx.schoolYearId)
    .eq("status", "active");

  if (supersedeError) {
    return { error: `Could not supersede the existing plan: ${supersedeError.message}` };
  }

  const channel = selection.paymentChannel?.trim() || null;

  const planRow =
    selection.billingMode === "scheduled" && built
      ? {
          student_id: selection.studentId,
          school_year_id: ctx.schoolYearId,
          billing_mode: "scheduled",
          payment_channel: channel,
          annual_tuition: built.annualTuition,
          prorated_tuition: built.proratedTuition,
          proration_label: built.prorationLabel,
          billing_basis: built.billingBasis,
          remaining_due: built.remainingDue,
          status: "active",
          lifecycle,
          awaiting_reason: awaitingReason,
          source_document: "Built in JAG",
          notes: selection.notes,
        }
      : {
          student_id: selection.studentId,
          school_year_id: ctx.schoolYearId,
          billing_mode: "monthly_open",
          payment_channel: channel,
          monthly_amount: selection.monthlyAmount,
          status: "active",
          lifecycle,
          awaiting_reason: awaitingReason,
          source_document: "Built in JAG — month to month",
          notes: selection.notes,
        };

  // `as never`: lifecycle and awaiting_reason arrived in migration 445 and the
  // generated types in src/types/database.ts predate it. Same cast, and the
  // same reason, as the state funding patch in interest-form/submit.ts. The
  // column names are still checked - by the database, which rejects one it
  // does not have.
  const { data: inserted, error: insertError } = await supabase
    .from("student_tuition_plans")
    .insert(planRow as never)
    .select("id")
    .single();

  if (insertError || !inserted) {
    // The old plan is already superseded at this point. Say so plainly rather
    // than leaving someone to discover this student now has no active plan.
    return {
      error: `Could not save the plan: ${insertError?.message ?? "no row returned"}. The previous plan was superseded, so this student currently has none — try again.`,
    };
  }

  if (selection.billingMode === "scheduled" && built) {
    const rows = built.instalments.map((i) => ({
      plan_id: inserted.id as string,
      sequence: i.sequence,
      label: i.label,
      due_date: i.dueDate,
      amount: i.amount,
      is_paid: false,
      paid_at: null,
    }));

    const { error: instalmentError } = await supabase
      .from("student_tuition_instalments")
      .insert(rows);

    if (instalmentError) {
      // A plan with no instalments is worse than no plan: the balances view
      // will report it as not adding up, and somebody will "fix" it by
      // changing the balance. Undo it.
      await supabase.from("student_tuition_plans").delete().eq("id", inserted.id);
      return {
        error: `Could not save the payment schedule: ${instalmentError.message}. Nothing was saved.`,
      };
    }
  }

  revalidatePath("/dashboard/finance/schedules");
  revalidatePath(`/dashboard/finance/plan/${selection.studentId}`);
  revalidatePath(`/dashboard/students/${selection.studentId}`);

  return { success: true as const, planId: inserted.id as string, built: built ?? null };
}
