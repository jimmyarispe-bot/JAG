import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordFinanceActivity } from "./activity";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type ScholarshipApplyResult =
  | {
      ok: true;
      appliedAmount: number;
      remainingBalance: number;
      applicationId: string;
    }
  | { ok: false; error: string; code?: string };

/**
 * Apply scholarship award to an invoice with over-allocation prevention.
 * Supports multiple scholarships per student (caller may loop).
 */
export async function applyScholarshipToInvoice(
  supabase: AuthClient,
  input: {
    scholarshipApplicationId: string;
    invoiceId: string;
    amount?: number;
  }
): Promise<ScholarshipApplyResult> {
  const { data: award } = await supabase
    .from("scholarship_applications")
    .select(
      "id, student_id, approved_amount, remaining_award_balance, scholarship_status, school_id, family_id"
    )
    .eq("id", input.scholarshipApplicationId)
    .maybeSingle();

  if (!award) return { ok: false, error: "Scholarship award not found", code: "not_found" };
  if (award.scholarship_status !== "approved") {
    return { ok: false, error: "Scholarship is not approved", code: "not_approved" };
  }

  const remaining = Number(award.remaining_award_balance ?? award.approved_amount ?? 0);
  if (remaining <= 0) {
    return { ok: false, error: "No remaining scholarship balance", code: "over_allocated" };
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "id, billing_account_id, student_id, subtotal, scholarship_credit, total_amount, amount_paid, family_responsibility, family_billing_accounts(school_id, family_id)"
    )
    .eq("id", input.invoiceId)
    .maybeSingle();

  if (!invoice) return { ok: false, error: "Invoice not found", code: "not_found" };

  const openBalance =
    Number(invoice.total_amount) - Number(invoice.amount_paid ?? 0);
  const requested = input.amount != null ? Number(input.amount) : Math.min(remaining, openBalance);
  const appliedAmount = Math.min(requested, remaining, Math.max(0, openBalance));

  if (appliedAmount <= 0) {
    return { ok: false, error: "Nothing to apply", code: "zero" };
  }

  const newRemaining = Math.round((remaining - appliedAmount) * 100) / 100;
  const newCredit = Number(invoice.scholarship_credit ?? 0) + appliedAmount;
  const newTotal = Math.max(0, Number(invoice.total_amount) - appliedAmount);
  const newFamily = Math.max(
    0,
    Number(invoice.family_responsibility ?? invoice.total_amount) - appliedAmount
  );

  await supabase
    .from("scholarship_applications")
    .update({ remaining_award_balance: newRemaining })
    .eq("id", award.id);

  await supabase
    .from("invoices")
    .update({
      scholarship_credit: newCredit,
      total_amount: newTotal,
      family_responsibility: newFamily,
    })
    .eq("id", invoice.id);

  try {
    await supabase.from("scholarship_award_payments").insert({
      scholarship_application_id: award.id,
      invoice_id: invoice.id,
      amount: appliedAmount,
      status: "applied",
    });
  } catch {
    // table may have different columns — non-blocking
  }

  await supabase.from("invoice_line_items").insert({
    invoice_id: invoice.id,
    line_type: "scholarship",
    description: "Scholarship applied",
    quantity: 1,
    unit_amount: -appliedAmount,
    amount: -appliedAmount,
  });

  const acct = Array.isArray(invoice.family_billing_accounts)
    ? invoice.family_billing_accounts[0]
    : invoice.family_billing_accounts;
  const schoolId =
    (acct as { school_id?: string } | null)?.school_id ??
    (award as { school_id?: string }).school_id ??
    null;
  const familyId =
    (acct as { family_id?: string } | null)?.family_id ??
    (award as { family_id?: string }).family_id ??
    null;
  const schoolCtx = schoolId ? await resolveSchoolContext(supabase, schoolId) : null;
  const actorUserId = await resolveActorUserId(supabase);

  await recordFinanceActivity(supabase, {
    eventType: "scholarship.applied",
    title: "Scholarship applied",
    summary: `$${appliedAmount.toFixed(2)} applied to invoice`,
    entityType: "invoice",
    entityId: invoice.id,
    organizationId: schoolCtx?.organizationId,
    schoolId,
    studentId: award.student_id,
    familyId,
    actorUserId,
    sourceTable: "scholarship_applications",
    sourceId: award.id,
    payload: {
      appliedAmount,
      remainingBalance: newRemaining,
      scholarshipApplicationId: award.id,
    },
  });

  if (invoice.billing_account_id) {
    await supabase.rpc("sync_billing_account_balance", {
      p_account_id: invoice.billing_account_id,
    });
  }

  return {
    ok: true,
    appliedAmount,
    remainingBalance: newRemaining,
    applicationId: award.id,
  };
}

/** Sum available scholarship balances for a student (multi-award). */
export async function getStudentScholarshipAvailability(
  supabase: AuthClient,
  studentId: string
): Promise<{ totalRemaining: number; awards: Array<{ id: string; remaining: number }> }> {
  const { data } = await supabase
    .from("scholarship_applications")
    .select("id, remaining_award_balance, approved_amount, scholarship_status")
    .eq("student_id", studentId)
    .eq("scholarship_status", "approved");

  const awards = (data ?? []).map((a) => ({
    id: a.id as string,
    remaining: Number(a.remaining_award_balance ?? a.approved_amount ?? 0),
  }));
  const totalRemaining = awards.reduce((s, a) => s + Math.max(0, a.remaining), 0);
  return { totalRemaining, awards };
}
