"use server";

/**
 * FINALIZING CONTRACT - THE THINGS JIMMY DOES ON THE PAGE.
 *
 * Jimmy, 18 October 2026: "this page is only accessible by jimmy right now".
 * Every action re-checks that here, on the server. Hiding a button is not a
 * permission; a server action can be called by anybody who can load the page.
 *
 * "Jimmy" is the FOUNDER role, the same test the sidebar and the founder
 * dashboard use (canViewFounderDashboard) - one rule, not a name.
 */

import { revalidatePath } from "next/cache";

import { transitionCaseStage } from "@/lib/admissions/case/orchestration";
import { convertLeadToStudentAction } from "@/lib/admissions/handoff/actions";
import { canViewFounderDashboard } from "@/lib/dashboard/founder-dashboard-access";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";

import { firstPayableInstalment, type FinalizingInstalment } from "./load";
import { notifyEnrolledByFirstPayment } from "./notify";

const PAYMENT_METHODS = [
  "ach",
  "credit_card",
  "check",
  "cash",
  "square",
  "classwallet",
  "state_direct",
  "scholarship",
  "other",
] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

async function requireJimmy() {
  const ctx = await getIdentityContext();
  if (!ctx) return { error: "Please sign in again." } as const;
  if (!canViewFounderDashboard(ctx)) {
    return { error: "Finalizing Contract is open to Jimmy only." } as const;
  }
  const supabase = await createAuthClient();
  return { ctx, supabase } as const;
}

function refresh() {
  revalidatePath("/dashboard/admissions/finalizing");
  revalidatePath("/dashboard/enrolled-students");
  revalidatePath("/dashboard/admissions");
}

function money(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

function text(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Step 1 - the child becomes a student record. Nothing is billed or activated. */
export async function createStudentRecordAction(leadId: string) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const result = await convertLeadToStudentAction(leadId);
  refresh();
  return result;
}

/**
 * Step 2 - a scholarship. Either awarded, with its amount, or applied for with
 * no amount yet. Never a guessed figure: an unknown award recorded as $0 is a
 * contract for full tuition with nothing flagged (migration 446).
 */
export async function addScholarshipAction(formData: FormData) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const { supabase } = auth;

  const studentId = text(formData.get("student_id"));
  const schoolId = text(formData.get("school_id"));
  const programName = text(formData.get("program_name"));
  const programCode = text(formData.get("program_code"));
  const awardYear = text(formData.get("award_year"));
  const status = text(formData.get("status"));
  const amount = money(formData.get("amount"));

  if (!studentId || !schoolId) return { error: "Create the student record first." };
  if (!programName) return { error: "Name the scholarship." };
  if (!awardYear) return { error: "Give the school year, for example 2026-2027." };
  if (status !== "awarded" && status !== "applied") return { error: "Choose awarded or applied for." };
  if (status === "awarded" && (amount === null || amount < 0)) {
    return { error: "An awarded scholarship needs its amount." };
  }

  const { error } = await supabase.from("scholarship_awards").insert({
    student_id: studentId,
    school_id: schoolId,
    program_name: programName,
    program_code: programCode,
    award_year: awardYear,
    status,
    awarded_amount: status === "awarded" ? amount : null,
    awarded_on: status === "awarded" ? new Date().toISOString().slice(0, 10) : null,
    applied_on: status === "applied" ? new Date().toISOString().slice(0, 10) : null,
  });
  if (error) return { error: error.message };
  refresh();
  return { success: true };
}

/** An applied-for scholarship gets its amount, or a scholarship is removed. */
export async function updateScholarshipAction(formData: FormData) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const { supabase } = auth;

  const awardId = text(formData.get("award_id"));
  const intent = text(formData.get("intent"));
  if (!awardId) return { error: "Missing scholarship." };

  if (intent === "withdraw") {
    const { error } = await supabase
      .from("scholarship_awards")
      .update({ status: "withdrawn", awarded_amount: null })
      .eq("id", awardId);
    if (error) return { error: error.message };
    refresh();
    return { success: true };
  }

  const amount = money(formData.get("amount"));
  if (amount === null || amount < 0) return { error: "Enter the awarded amount." };
  const { error } = await supabase
    .from("scholarship_awards")
    .update({
      status: "awarded",
      awarded_amount: amount,
      awarded_on: new Date().toISOString().slice(0, 10),
    })
    .eq("id", awardId);
  if (error) return { error: error.message };
  refresh();
  return { success: true };
}

/**
 * Step 3 - the plan is final. Only a plan whose every figure is known may be:
 * the database refuses `final` while it is waiting on a scholarship amount,
 * and refuses it without the figures the contract will print.
 */
export async function markPlanFinalAction(planId: string) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const { supabase } = auth;

  const { data: plan, error: readError } = await supabase
    .from("student_tuition_plans")
    .select("id, lifecycle, student_id")
    .eq("id", planId)
    .maybeSingle();
  if (readError) return { error: readError.message };
  if (!plan) return { error: "That plan could not be found." };
  if (plan.lifecycle === "awaiting_scholarship_amounts") {
    return { error: "This plan is still waiting on a scholarship amount. Record it, then rebuild the plan." };
  }
  if (plan.lifecycle !== "draft") {
    return { error: `This plan is ${String(plan.lifecycle).replace(/_/g, " ")}, not a draft.` };
  }

  const { data: pending } = await supabase
    .from("scholarship_awards")
    .select("id")
    .eq("student_id", plan.student_id)
    .eq("status", "applied")
    .limit(1);
  if ((pending ?? []).length > 0) {
    return { error: "A scholarship is still applied for with no amount. Record it first." };
  }

  const { error } = await supabase
    .from("student_tuition_plans")
    .update({
      lifecycle: "final",
      lifecycle_changed_at: new Date().toISOString(),
      lifecycle_note: "Marked final on Finalizing Contract",
    })
    .eq("id", planId);
  if (error) return { error: error.message };
  refresh();
  return { success: true };
}

/**
 * Step 5 - a payment. Recorded against one instalment.
 *
 * A PART PAYMENT STAYS UNPAID. Only an amount that covers the instalment marks
 * it paid; less is recorded and the instalment stays open.
 *
 * THE FIRST PAYMENT ENROLLS THE CHILD. Jimmy: "once the initial payment is
 * made move these to Enrolled Students". When the first instalment that asks
 * for money is paid in full, the lead moves to `enrolled` and Jimmy is told.
 */
export async function recordPaymentAction(formData: FormData) {
  const auth = await requireJimmy();
  if ("error" in auth) return { error: auth.error };
  const { supabase, ctx } = auth;

  const instalmentId = text(formData.get("instalment_id"));
  const leadId = text(formData.get("lead_id"));
  const amount = money(formData.get("amount"));
  const paidOn = text(formData.get("paid_on"));
  const method = text(formData.get("method"));
  const reference = text(formData.get("reference"));
  const notes = text(formData.get("notes"));

  if (!instalmentId || !leadId) return { error: "Missing payment details." };
  if (amount === null || amount <= 0) return { error: "Enter the amount received." };
  if (!paidOn || !/^\d{4}-\d{2}-\d{2}$/.test(paidOn)) return { error: "Enter the date it was received." };
  if (!method || !(PAYMENT_METHODS as readonly string[]).includes(method)) {
    return { error: "Choose how it was paid." };
  }

  const { data: inst, error: instError } = await supabase
    .from("student_tuition_instalments")
    .select("id, plan_id, amount, is_paid, paid_amount")
    .eq("id", instalmentId)
    .maybeSingle();
  if (instError) return { error: instError.message };
  if (!inst) return { error: "That payment line could not be found." };
  if (inst.is_paid) return { error: "That payment is already recorded as paid." };

  const already = Number(inst.paid_amount ?? 0);
  const total = Math.round((already + amount) * 100) / 100;
  const due = Number(inst.amount);
  const fullyPaid = total >= due;

  const { error: updateError } = await supabase
    .from("student_tuition_instalments")
    .update({
      paid_amount: total,
      paid_at: paidOn,
      is_paid: fullyPaid,
      payment_method: method as PaymentMethod,
      payment_reference: reference,
      payment_notes: notes,
      payment_recorded_by: ctx.id,
      payment_recorded_at: new Date().toISOString(),
    })
    .eq("id", instalmentId);
  if (updateError) return { error: updateError.message };

  let enrolled = false;
  if (fullyPaid) {
    const { data: all } = await supabase
      .from("student_tuition_instalments")
      .select("id, sequence, amount, is_paid")
      .eq("plan_id", inst.plan_id);
    const first = firstPayableInstalment(
      ((all ?? []) as Record<string, unknown>[]).map(
        (i): FinalizingInstalment => ({
          id: String(i.id),
          sequence: Number(i.sequence),
          label: null,
          dueDate: null,
          amount: Number(i.amount),
          isPaid: Boolean(i.is_paid),
          paidAt: null,
          paidAmount: null,
          paymentMethod: null,
          paymentReference: null,
        })
      )
    );

    const { data: lead } = await supabase
      .from("admissions_leads")
      .select("lead_stage")
      .eq("id", leadId)
      .maybeSingle();

    if (first && first.isPaid && lead?.lead_stage === "accepted") {
      const moved = await transitionCaseStage(supabase, leadId, "enrolled", ctx.id);
      if (moved.error) {
        refresh();
        return {
          success: true,
          enrolled: false,
          warning: `Payment recorded, but the move to Enrolled failed: ${moved.error}`,
        };
      }
      enrolled = true;
      await notifyEnrolledByFirstPayment(supabase, leadId);
    }
  }

  refresh();
  return { success: true, fullyPaid, enrolled };
}
