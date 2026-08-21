import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface TuitionCalculationInput {
  billingAccountId: string;
  studentId: string | null;
  subtotal: number;
  scholarshipCredit?: number;
  stateFundingCredit?: number;
  grantCredit?: number;
  discountAmount?: number;
  taxRatePercent?: number;
  lateFee?: number;
}

export interface TuitionCalculationResult {
  subtotal: number;
  siblingDiscount: number;
  scholarshipCredit: number;
  stateFundingCredit: number;
  grantCredit: number;
  discountAmount: number;
  taxAmount: number;
  lateFee: number;
  totalAmount: number;
  familyResponsibility: number;
}

export async function calculateTuitionInvoice(
  supabase: AuthClient,
  input: TuitionCalculationInput
): Promise<TuitionCalculationResult> {
  const { data } = await supabase.rpc("calculate_tuition_invoice_totals", {
    p_billing_account_id: input.billingAccountId,
    p_student_id: input.studentId,
    p_subtotal: input.subtotal,
    p_scholarship_credit: input.scholarshipCredit ?? 0,
    p_state_funding_credit: input.stateFundingCredit ?? 0,
    p_grant_credit: input.grantCredit ?? 0,
    p_discount_amount: input.discountAmount ?? 0,
    p_tax_rate_percent: input.taxRatePercent ?? 0,
    p_late_fee: input.lateFee ?? 0,
  });

  const row = Array.isArray(data) ? data[0] : data;
  const siblingDiscount = Number((row as { sibling_discount?: number })?.sibling_discount ?? 0);
  const taxAmount = Number((row as { tax_amount?: number })?.tax_amount ?? 0);
  const totalAmount = Number((row as { total_amount?: number })?.total_amount ?? 0);
  const familyResponsibility = Number((row as { family_responsibility?: number })?.family_responsibility ?? 0);

  return {
    subtotal: input.subtotal,
    siblingDiscount,
    scholarshipCredit: input.scholarshipCredit ?? 0,
    stateFundingCredit: input.stateFundingCredit ?? 0,
    grantCredit: input.grantCredit ?? 0,
    discountAmount: input.discountAmount ?? 0,
    taxAmount,
    lateFee: input.lateFee ?? 0,
    totalAmount,
    familyResponsibility,
  };
}

/** Resolve scholarship and state funding credits for a student from existing modules */
/**
 * Award payment states that may reduce what a family owes.
 *
 * `unknown` is deliberately excluded. State-funding records are created with
 * `payment_status` defaulting to `'unknown'` and nothing advances them, so
 * treating it as creditable silently under-bills every family holding an award
 * that has never paid a cent.
 *
 * `overdue` is excluded for the same reason — an award in arrears is not money.
 */
const CREDITABLE_FUNDING_STATUSES = ["paid", "partial", "expected"] as const;

/**
 * Fraction of a `partial` award treated as available.
 *
 * `ssis_student_funding_records` stores an award amount but no received amount,
 * so the true figure is unknowable here. This is a deliberately conservative
 * placeholder, named rather than inlined, and should be replaced with real
 * received-to-date once state funding receipts post to the ledger.
 */
const PARTIAL_AWARD_AVAILABLE_FRACTION = 0.5;

/** Invoice states whose credits no longer count as consumed. */
const NON_CONSUMING_INVOICE_STATUSES = ["void", "voided", "cancelled", "canceled"];

/** Award amount currently available from one funding record. */
export function creditableAwardAmount(record: {
  award_amount?: number | null;
  payment_status?: string | null;
}): number {
  const status = (record.payment_status ?? "").trim().toLowerCase();
  if (!(CREDITABLE_FUNDING_STATUSES as readonly string[]).includes(status)) return 0;

  const amount = Number(record.award_amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  return status === "partial" ? amount * PARTIAL_AWARD_AVAILABLE_FRACTION : amount;
}

/**
 * Credit still available after prior invoices have drawn on the awards.
 *
 * Without this, `resolveFundingCreditsForStudent` grants the full award on
 * *every* invoice. Under monthly billing that zeroes out a family's bill twelve
 * times from a single annual award.
 */
export function remainingAwardCredit(totalAwarded: number, alreadyApplied: number): number {
  return Math.max(0, totalAwarded - Math.max(0, alreadyApplied));
}

/** Sum of credits already granted to a student for one line type, as a positive number. */
async function creditAlreadyApplied(
  supabase: AuthClient,
  studentId: string,
  lineType: "scholarship" | "state_funding"
): Promise<number> {
  const { data } = await supabase
    .from("invoice_line_items")
    .select("amount, invoices(invoice_status)")
    .eq("student_id", studentId)
    .eq("line_type", lineType);

  let applied = 0;
  for (const row of data ?? []) {
    const joined = (row as { invoices?: { invoice_status?: string } | { invoice_status?: string }[] })
      .invoices;
    const invoice = Array.isArray(joined) ? joined[0] : joined;
    const status = (invoice?.invoice_status ?? "").trim().toLowerCase();
    if (NON_CONSUMING_INVOICE_STATUSES.includes(status)) continue;

    // Credits are stored as negative line amounts.
    applied += Math.abs(Number((row as { amount?: number | null }).amount ?? 0));
  }
  return applied;
}

/**
 * Resolve scholarship and state-funding credits for one invoice.
 *
 * Two rules, both of which were previously missing:
 *  1. Only awards in a real paying state reduce the bill (see
 *     {@link CREDITABLE_FUNDING_STATUSES}).
 *  2. An award is consumed as it is applied — credit already granted on prior
 *     invoices is deducted, so an annual award cannot be spent every month.
 *
 * Consumption is derived from `invoice_line_items` rather than a stored balance,
 * so it self-corrects if an invoice is voided and needs no schema change. Awards
 * and applied credit are both summed across all years: total awarded minus total
 * applied, so an unspent balance carries forward rather than being lost.
 */
export async function resolveFundingCreditsForStudent(
  supabase: AuthClient,
  studentId: string,
  invoiceSubtotal: number
) {
  let scholarshipCredit = 0;
  let stateFundingCredit = 0;

  const { data: scholarships } = await supabase
    .from("scholarship_applications")
    .select("approved_amount, remaining_award_balance, scholarship_status")
    .eq("student_id", studentId)
    .eq("scholarship_status", "approved");

  const scholarshipAwarded = (scholarships ?? []).reduce(
    (sum, s) => sum + Number(s.remaining_award_balance ?? s.approved_amount ?? 0),
    0
  );
  const scholarshipRemaining = remainingAwardCredit(
    scholarshipAwarded,
    await creditAlreadyApplied(supabase, studentId, "scholarship")
  );
  scholarshipCredit = Math.max(0, Math.min(scholarshipRemaining, invoiceSubtotal));

  const { data: ssisFunding } = await supabase
    .from("ssis_student_funding_records")
    .select("award_amount, payment_status, verification_status")
    .eq("student_id", studentId)
    .eq("verification_status", "verified")
    .in("payment_status", [...CREDITABLE_FUNDING_STATUSES]);

  const stateAwarded = (ssisFunding ?? []).reduce(
    (sum, f) => sum + creditableAwardAmount(f),
    0
  );
  const stateRemaining = remainingAwardCredit(
    stateAwarded,
    await creditAlreadyApplied(supabase, studentId, "state_funding")
  );
  stateFundingCredit = Math.max(
    0,
    Math.min(stateRemaining, invoiceSubtotal - scholarshipCredit)
  );

  return { scholarshipCredit, stateFundingCredit };
}

export async function generateTuitionInvoiceFromPlan(
  supabase: AuthClient,
  input: {
    billingAccountId: string;
    studentId: string;
    tuitionPlanId: string;
    invoiceNumber: string;
    dueDate: string;
    description?: string;
  }
) {
  const { data: plan } = await supabase
    .from("tuition_plans")
    .select("*")
    .eq("id", input.tuitionPlanId)
    .single();

  if (!plan) throw new Error("Tuition plan not found");

  const billingModel = String(
    (plan as { billing_model?: string }).billing_model ??
      plan.payment_schedule ??
      plan.billing_frequency ??
      "monthly"
  ).toLowerCase();
  const divisor =
    billingModel.includes("month") || plan.billing_frequency === "monthly"
      ? 12
      : billingModel.includes("quarter")
        ? 4
        : billingModel.includes("course") ||
            billingModel.includes("one") ||
            billingModel.includes("annual") ||
            billingModel.includes("year")
          ? 1
          : plan.billing_frequency === "weekly"
            ? 52
            : plan.billing_frequency === "daily"
              ? 180
              : plan.payment_schedule === "semester"
                ? 2
                : 1;
  const subtotal = Number(plan.annual_amount) / divisor;

  const credits = await resolveFundingCreditsForStudent(supabase, input.studentId, subtotal);
  const calc = await calculateTuitionInvoice(supabase, {
    billingAccountId: input.billingAccountId,
    studentId: input.studentId,
    subtotal,
    scholarshipCredit: credits.scholarshipCredit,
    stateFundingCredit: credits.stateFundingCredit,
    taxRatePercent: Number(plan.tax_rate_percent ?? 0),
  });

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      billing_account_id: input.billingAccountId,
      tuition_plan_id: input.tuitionPlanId,
      student_id: input.studentId,
      invoice_number: input.invoiceNumber,
      description: input.description ?? plan.name,
      subtotal: calc.subtotal,
      sibling_discount_amount: calc.siblingDiscount,
      scholarship_credit: calc.scholarshipCredit,
      state_funding_credit: calc.stateFundingCredit,
      grant_credit: calc.grantCredit,
      discount_amount: calc.discountAmount,
      tax_amount: calc.taxAmount,
      total_amount: calc.totalAmount,
      family_responsibility: calc.familyResponsibility,
      due_date: input.dueDate,
      invoice_status: "sent",
      issued_at: new Date().toISOString().split("T")[0],
      program: plan.program,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const lineItems = [
    { invoice_id: invoice.id, line_type: "tuition", description: plan.name, amount: calc.subtotal, student_id: input.studentId },
  ];
  if (calc.siblingDiscount > 0) {
    lineItems.push({ invoice_id: invoice.id, line_type: "discount", description: "Sibling discount", amount: -calc.siblingDiscount, student_id: input.studentId });
  }
  if (calc.scholarshipCredit > 0) {
    lineItems.push({ invoice_id: invoice.id, line_type: "scholarship", description: "Scholarship credit", amount: -calc.scholarshipCredit, student_id: input.studentId });
  }
  if (calc.stateFundingCredit > 0) {
    lineItems.push({ invoice_id: invoice.id, line_type: "state_funding", description: "State funding credit", amount: -calc.stateFundingCredit, student_id: input.studentId });
  }
  if (calc.taxAmount > 0) {
    lineItems.push({ invoice_id: invoice.id, line_type: "tax", description: "Tax", amount: calc.taxAmount, student_id: input.studentId });
  }
  await supabase.from("invoice_line_items").insert(lineItems);

  await supabase.rpc("sync_billing_account_balance", { p_account_id: input.billingAccountId });

  return { invoiceId: invoice.id, calculation: calc };
}
