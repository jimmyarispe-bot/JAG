import { resolveActorUserId } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordFinanceActivity } from "./activity";
import type { ApplyDiscountInput, DiscountRuleInput } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type DiscountResult =
  | { ok: true; amount: number; applicationId?: string }
  | { ok: false; error: string };

/** Resolve stacked discount amounts with priority + stacking rules. */
export function resolveStackedDiscounts(
  rules: Array<{
    id: string;
    amount: number;
    amountType: "percent" | "flat";
    stackingPriority: number;
    allowsStacking: boolean;
  }>,
  baseAmount: number
): { totalDiscount: number; applied: Array<{ id: string; amount: number }> } {
  const sorted = [...rules].sort((a, b) => a.stackingPriority - b.stackingPriority);
  let remaining = baseAmount;
  let totalDiscount = 0;
  const applied: Array<{ id: string; amount: number }> = [];
  let stopped = false;

  for (const rule of sorted) {
    if (stopped) break;
    const raw =
      rule.amountType === "percent"
        ? (remaining * Number(rule.amount)) / 100
        : Number(rule.amount);
    const amount = Math.min(Math.max(0, raw), remaining);
    if (amount <= 0) continue;
    applied.push({ id: rule.id, amount });
    totalDiscount += amount;
    remaining -= amount;
    if (!rule.allowsStacking) stopped = true;
  }

  return { totalDiscount, applied };
}

export async function createDiscountRule(
  supabase: AuthClient,
  input: DiscountRuleInput
): Promise<{ ok: true; ruleId: string } | { ok: false; error: string }> {
  const actorUserId = await resolveActorUserId(supabase);
  const { data, error } = await supabase
    .from("billing_discount_rules")
    .insert({
      name: input.name.trim(),
      description: input.description ?? "",
      discount_type: input.discountType,
      amount_type: input.amountType,
      amount: input.amount,
      stacking_priority: input.stackingPriority ?? 100,
      allows_stacking: input.allowsStacking ?? true,
      school_id: input.schoolId ?? null,
      organization_id: input.organizationId ?? null,
      created_by: actorUserId,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed to create discount" };
  return { ok: true, ruleId: data.id };
}

export async function applyDiscount(
  supabase: AuthClient,
  input: ApplyDiscountInput,
  context?: {
    organizationId?: string | null;
    schoolId?: string | null;
    familyId?: string | null;
  }
): Promise<DiscountResult> {
  let amount = Number(input.amount);
  if (input.amountType === "percent" && input.baseAmount != null) {
    amount = (Number(input.baseAmount) * amount) / 100;
  }
  amount = Math.max(0, Math.round(amount * 100) / 100);
  if (amount <= 0) return { ok: false, error: "Discount amount must be positive" };

  const actorUserId = await resolveActorUserId(supabase);
  const { data, error } = await supabase
    .from("billing_discount_applications")
    .insert({
      discount_rule_id: input.discountRuleId ?? null,
      billing_account_id: input.billingAccountId,
      invoice_id: input.invoiceId ?? null,
      student_id: input.studentId ?? null,
      discount_type: input.discountType,
      amount,
      amount_type: input.amountType ?? "flat",
      notes: input.notes ?? null,
      created_by: actorUserId,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  if (input.invoiceId) {
    const { data: invoice } = await supabase
      .from("invoices")
      .select("subtotal, sibling_discount_amount, total_amount, discount_amount")
      .eq("id", input.invoiceId)
      .maybeSingle();

    if (invoice) {
      const prior = Number(
        (invoice as { discount_amount?: number }).discount_amount ??
          invoice.sibling_discount_amount ??
          0
      );
      const newDiscount = prior + amount;
      const newTotal = Math.max(0, Number(invoice.subtotal) - newDiscount);
      await supabase
        .from("invoices")
        .update({
          sibling_discount_amount:
            input.discountType === "sibling" ? newDiscount : invoice.sibling_discount_amount,
          discount_amount: newDiscount,
          total_amount: newTotal,
          family_responsibility: newTotal,
        } as never)
        .eq("id", input.invoiceId);
    }
  }

  await recordFinanceActivity(supabase, {
    eventType: "discount.applied",
    title: "Discount applied",
    summary: `${input.discountType} · ${amount}`,
    entityType: "invoice",
    entityId: input.invoiceId ?? input.billingAccountId,
    organizationId: context?.organizationId,
    schoolId: context?.schoolId,
    familyId: context?.familyId,
    studentId: input.studentId,
    actorUserId,
    sourceTable: "billing_discount_applications",
    sourceId: data?.id,
    payload: {
      discountType: input.discountType,
      amount,
      billingAccountId: input.billingAccountId,
      invoiceId: input.invoiceId,
    },
  });

  return { ok: true, amount, applicationId: data?.id };
}
