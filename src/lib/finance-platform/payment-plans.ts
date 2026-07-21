import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { PaymentPlanGenerateInput } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type PaymentPlanResult =
  | { ok: true; installmentIds: string[]; count: number }
  | { ok: false; error: string };

function addMonths(isoDate: string, months: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/**
 * Generate installment schedule for a payment plan (monthly or custom dates).
 */
export async function generatePaymentPlanInstallments(
  supabase: AuthClient,
  input: PaymentPlanGenerateInput
): Promise<PaymentPlanResult> {
  const count = Math.max(1, Math.floor(input.installmentCount));
  const total = Number(input.totalAmount);
  if (total <= 0) return { ok: false, error: "Total amount must be positive" };

  const base = Math.floor((total / count) * 100) / 100;
  const amounts = Array.from({ length: count }, () => base);
  const drift = Math.round((total - base * count) * 100) / 100;
  amounts[count - 1] = Math.round((amounts[count - 1]! + drift) * 100) / 100;

  let dueDates: string[];
  if (input.frequency === "custom" && input.customDueDates?.length) {
    dueDates = input.customDueDates.slice(0, count);
    while (dueDates.length < count) {
      dueDates.push(addMonths(input.startDate, dueDates.length));
    }
  } else {
    dueDates = Array.from({ length: count }, (_, i) => addMonths(input.startDate, i));
  }

  // Clear prior scheduled installments for regeneration
  await supabase
    .from("payment_plan_installments")
    .delete()
    .eq("payment_plan_id", input.paymentPlanId)
    .eq("status", "scheduled");

  const rows = amounts.map((amount, i) => ({
    payment_plan_id: input.paymentPlanId,
    billing_account_id: input.billingAccountId,
    installment_number: i + 1,
    due_date: dueDates[i]!,
    amount,
    status: "scheduled",
  }));

  const { data, error } = await supabase
    .from("payment_plan_installments")
    .insert(rows)
    .select("id");

  if (error) return { ok: false, error: error.message };

  await supabase
    .from("family_billing_accounts")
    .update({ payment_plan_id: input.paymentPlanId })
    .eq("id", input.billingAccountId);

  return {
    ok: true,
    installmentIds: (data ?? []).map((r) => r.id as string),
    count: rows.length,
  };
}

export async function listPaymentPlanInstallments(
  supabase: AuthClient,
  paymentPlanId: string
) {
  const { data } = await supabase
    .from("payment_plan_installments")
    .select("*")
    .eq("payment_plan_id", paymentPlanId)
    .order("installment_number");
  return data ?? [];
}
