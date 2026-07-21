"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { requireFinancePlatformEditAccess } from "./access";
import { ensureFamilyFinancialAccount } from "./accounts";
import { applyDiscount, createDiscountRule } from "./discounts";
import {
  archiveInvoice,
  deleteInvoice,
  duplicateInvoice,
  sendInvoice,
  updateInvoiceDraft,
  voidInvoice,
} from "./invoices";
import { generatePaymentPlanInstallments } from "./payment-plans";
import {
  approveRefund,
  completeRefund,
  createRefundRequest,
  rejectRefund,
} from "./refunds";
import { applyScholarshipToInvoice } from "./scholarships";
import { snapshotAging } from "./aging";
import type { DiscountType } from "./types";

function revalidateFinance() {
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard/finance/executive");
}

export async function ensureFamilyAccountAction(formData: FormData) {
  const access = await requireFinancePlatformEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await ensureFamilyFinancialAccount(supabase, {
    familyId: String(formData.get("family_id") ?? ""),
    schoolId: String(formData.get("school_id") ?? ""),
    primaryResponsibleParty: String(formData.get("primary_payer") ?? "") || null,
  });
  if (!result.ok) return { error: result.error };
  revalidateFinance();
  return result;
}

export async function voidInvoiceAction(invoiceId: string, reason?: string) {
  const access = await requireFinancePlatformEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await voidInvoice(supabase, invoiceId, reason);
  if (!result.ok) return { error: result.error, code: result.code };
  revalidateFinance();
  return result;
}

export async function sendInvoiceAction(invoiceId: string) {
  const access = await requireFinancePlatformEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await sendInvoice(supabase, invoiceId);
  if (!result.ok) return { error: result.error };
  revalidateFinance();
  return result;
}

export async function duplicateInvoiceAction(invoiceId: string) {
  const access = await requireFinancePlatformEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await duplicateInvoice(supabase, invoiceId);
  if (!result.ok) return { error: result.error };
  revalidateFinance();
  return result;
}

export async function archiveInvoiceAction(invoiceId: string) {
  const access = await requireFinancePlatformEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await archiveInvoice(supabase, invoiceId);
  if (!result.ok) return { error: result.error };
  revalidateFinance();
  return result;
}

export async function deleteInvoiceAction(input: {
  invoiceId: string;
  confirmationText: string;
  acknowledged: boolean;
}) {
  const access = await requireFinancePlatformEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await deleteInvoice(supabase, input);
  if (!result.ok) {
    return { error: result.error, code: result.code, suggestArchive: result.suggestArchive };
  }
  revalidateFinance();
  return result;
}

export async function updateInvoiceDraftAction(invoiceId: string, formData: FormData) {
  const access = await requireFinancePlatformEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const subtotalRaw = formData.get("subtotal");
  const result = await updateInvoiceDraft(supabase, invoiceId, {
    description: formData.has("description")
      ? String(formData.get("description") ?? "")
      : undefined,
    dueDate: formData.has("due_date") ? String(formData.get("due_date")) : undefined,
    subtotal: subtotalRaw != null && String(subtotalRaw) !== "" ? Number(subtotalRaw) : undefined,
  });
  if (!result.ok) return { error: result.error };
  revalidateFinance();
  return result;
}

export async function applyScholarshipAction(formData: FormData) {
  const access = await requireFinancePlatformEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const amountRaw = formData.get("amount");
  const result = await applyScholarshipToInvoice(supabase, {
    scholarshipApplicationId: String(formData.get("scholarship_application_id") ?? ""),
    invoiceId: String(formData.get("invoice_id") ?? ""),
    amount: amountRaw ? Number(amountRaw) : undefined,
  });
  if (!result.ok) return { error: result.error, code: result.code };
  revalidateFinance();
  return result;
}

export async function applyDiscountAction(formData: FormData) {
  const access = await requireFinancePlatformEditAccess();
  if (!access.ok) return { error: access.error };
  const identity = await getIdentityContext();
  const supabase = await createAuthClient();
  const result = await applyDiscount(
    supabase,
    {
      discountRuleId: String(formData.get("discount_rule_id") ?? "") || null,
      discountType: String(formData.get("discount_type") ?? "manual") as DiscountType,
      amount: Number(formData.get("amount") ?? 0),
      amountType: formData.get("amount_type") === "percent" ? "percent" : "flat",
      billingAccountId: String(formData.get("billing_account_id") ?? ""),
      invoiceId: String(formData.get("invoice_id") ?? "") || null,
      studentId: String(formData.get("student_id") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || undefined,
      baseAmount: formData.get("base_amount")
        ? Number(formData.get("base_amount"))
        : undefined,
    },
    {
      schoolId: identity?.accessibleSchoolIds?.[0] ?? null,
    }
  );
  if (!result.ok) return { error: result.error };
  revalidateFinance();
  return result;
}

export async function createDiscountRuleAction(formData: FormData) {
  const access = await requireFinancePlatformEditAccess();
  if (!access.ok) return { error: access.error };
  const identity = await getIdentityContext();
  const supabase = await createAuthClient();
  const result = await createDiscountRule(supabase, {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    discountType: String(formData.get("discount_type") ?? "promotional") as DiscountType,
    amountType: formData.get("amount_type") === "flat" ? "flat" : "percent",
    amount: Number(formData.get("amount") ?? 0),
    stackingPriority: Number(formData.get("stacking_priority") ?? 100),
    allowsStacking: formData.get("allows_stacking") !== "false",
    schoolId: String(formData.get("school_id") ?? "") || identity?.accessibleSchoolIds?.[0] || null,
  });
  if (!result.ok) return { error: result.error };
  revalidateFinance();
  return result;
}

export async function generateInstallmentsAction(formData: FormData) {
  const access = await requireFinancePlatformEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const custom = String(formData.get("custom_due_dates") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const result = await generatePaymentPlanInstallments(supabase, {
    paymentPlanId: String(formData.get("payment_plan_id") ?? ""),
    billingAccountId: String(formData.get("billing_account_id") ?? ""),
    startDate: String(formData.get("start_date") ?? new Date().toISOString().slice(0, 10)),
    installmentCount: Number(formData.get("installment_count") ?? 1),
    totalAmount: Number(formData.get("total_amount") ?? 0),
    frequency: custom.length ? "custom" : "monthly",
    customDueDates: custom.length ? custom : undefined,
  });
  if (!result.ok) return { error: result.error };
  revalidateFinance();
  return result;
}

export async function createRefundRequestAction(formData: FormData) {
  const access = await requireFinancePlatformEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await createRefundRequest(supabase, {
    billingAccountId: String(formData.get("billing_account_id") ?? ""),
    amount: Number(formData.get("amount") ?? 0),
    reason: String(formData.get("reason") ?? ""),
    invoiceId: String(formData.get("invoice_id") ?? "") || null,
    paymentId: String(formData.get("payment_id") ?? "") || null,
    familyId: String(formData.get("family_id") ?? "") || null,
    studentId: String(formData.get("student_id") ?? "") || null,
    schoolId: String(formData.get("school_id") ?? "") || null,
    refundMethod: String(formData.get("refund_method") ?? "credit_balance"),
  });
  if (!result.ok) return { error: result.error };
  revalidateFinance();
  return result;
}

export async function approveRefundAction(refundId: string) {
  const access = await requireFinancePlatformEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await approveRefund(supabase, refundId);
  if (!result.ok) return { error: result.error };
  revalidateFinance();
  return result;
}

export async function rejectRefundAction(refundId: string, reason?: string) {
  const access = await requireFinancePlatformEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await rejectRefund(supabase, refundId, reason);
  if (!result.ok) return { error: result.error };
  revalidateFinance();
  return result;
}

export async function completeRefundAction(refundId: string) {
  const access = await requireFinancePlatformEditAccess();
  if (!access.ok) return { error: access.error };
  const supabase = await createAuthClient();
  const result = await completeRefund(supabase, refundId);
  if (!result.ok) return { error: result.error };
  revalidateFinance();
  return result;
}

export async function refreshAgingSnapshotAction(schoolId?: string) {
  const access = await requireFinancePlatformEditAccess();
  if (!access.ok) return { error: access.error };
  const identity = await getIdentityContext();
  const supabase = await createAuthClient();
  const sid = schoolId || identity?.accessibleSchoolIds?.[0];
  if (!sid) return { error: "School required" };
  const aging = await snapshotAging(supabase, { schoolId: sid });
  revalidateFinance();
  return { ok: true as const, aging };
}
