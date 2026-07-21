import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordFinanceActivity } from "./activity";
import type { RefundRequestInput, RefundStatus } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type RefundResult =
  | { ok: true; refundId: string; auditId: string; status: RefundStatus }
  | { ok: false; error: string; code?: string };

export async function createRefundRequest(
  supabase: AuthClient,
  input: RefundRequestInput
): Promise<RefundResult> {
  const amount = Number(input.amount);
  if (amount <= 0) return { ok: false, error: "Refund amount must be positive" };

  const actorUserId = await resolveActorUserId(supabase);
  const { data: account } = await supabase
    .from("family_billing_accounts")
    .select("id, school_id, family_id")
    .eq("id", input.billingAccountId)
    .maybeSingle();

  if (!account) return { ok: false, error: "Billing account not found", code: "not_found" };

  const schoolId = input.schoolId ?? account.school_id;
  const familyId = input.familyId ?? account.family_id;
  const schoolCtx = schoolId ? await resolveSchoolContext(supabase, schoolId) : null;

  const { data, error } = await supabase
    .from("billing_refunds")
    .insert({
      organization_id: input.organizationId ?? schoolCtx?.organizationId ?? null,
      school_id: schoolId,
      billing_account_id: input.billingAccountId,
      invoice_id: input.invoiceId ?? null,
      payment_id: input.paymentId ?? null,
      family_id: familyId,
      student_id: input.studentId ?? null,
      amount,
      refund_method: input.refundMethod ?? "credit_balance",
      status: "requested",
      reason: input.reason ?? "",
      requested_by: actorUserId,
    })
    .select("id, audit_id, status")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed to create refund" };

  await recordFinanceActivity(supabase, {
    eventType: "refund.created",
    title: "Refund requested",
    summary: `$${amount.toFixed(2)}`,
    entityType: "payment",
    entityId: data.id,
    organizationId: schoolCtx?.organizationId,
    schoolId,
    familyId,
    studentId: input.studentId,
    actorUserId,
    sourceTable: "billing_refunds",
    sourceId: data.id,
    payload: { amount, status: data.status },
  });

  return {
    ok: true,
    refundId: data.id,
    auditId: data.audit_id,
    status: data.status as RefundStatus,
  };
}

export async function approveRefund(
  supabase: AuthClient,
  refundId: string
): Promise<RefundResult> {
  return setRefundStatus(supabase, refundId, "approved");
}

export async function rejectRefund(
  supabase: AuthClient,
  refundId: string,
  reason?: string
): Promise<RefundResult> {
  return setRefundStatus(supabase, refundId, "rejected", reason);
}

export async function completeRefund(
  supabase: AuthClient,
  refundId: string
): Promise<RefundResult> {
  const { data: refund } = await supabase
    .from("billing_refunds")
    .select("*")
    .eq("id", refundId)
    .maybeSingle();

  if (!refund) return { ok: false, error: "Refund not found", code: "not_found" };
  if (!["approved", "pending_approval", "requested"].includes(String(refund.status))) {
    return { ok: false, error: `Cannot complete refund in status ${refund.status}` };
  }

  const actorUserId = await resolveActorUserId(supabase);
  const now = new Date().toISOString();

  if (refund.refund_method === "credit_balance") {
    const { data: account } = await supabase
      .from("family_billing_accounts")
      .select("credit_balance")
      .eq("id", refund.billing_account_id)
      .maybeSingle();
    const next = Number(account?.credit_balance ?? 0) + Number(refund.amount);
    await supabase
      .from("family_billing_accounts")
      .update({ credit_balance: next })
      .eq("id", refund.billing_account_id);

    await supabase.from("billing_credits").insert({
      billing_account_id: refund.billing_account_id,
      amount: refund.amount,
      remaining_amount: refund.amount,
      reason: refund.reason || "Refund credit",
      source_module: "finance",
      status: "available",
      created_by: actorUserId,
    });
  }

  await supabase
    .from("billing_refunds")
    .update({
      status: "completed",
      processed_by: actorUserId,
      completed_at: now,
      reviewed_at: refund.reviewed_at ?? now,
      reviewed_by: refund.reviewed_by ?? actorUserId,
      updated_at: now,
    })
    .eq("id", refundId);

  const schoolCtx = refund.school_id
    ? await resolveSchoolContext(supabase, refund.school_id)
    : null;

  await recordFinanceActivity(supabase, {
    eventType: "refund.completed",
    title: "Refund completed",
    summary: `$${Number(refund.amount).toFixed(2)}`,
    entityType: "payment",
    entityId: refundId,
    organizationId: schoolCtx?.organizationId,
    schoolId: refund.school_id,
    familyId: refund.family_id,
    studentId: refund.student_id,
    actorUserId,
    sourceTable: "billing_refunds",
    sourceId: refundId,
  });

  return {
    ok: true,
    refundId,
    auditId: refund.audit_id,
    status: "completed",
  };
}

async function setRefundStatus(
  supabase: AuthClient,
  refundId: string,
  status: RefundStatus,
  rejectionReason?: string
): Promise<RefundResult> {
  const { data: refund } = await supabase
    .from("billing_refunds")
    .select("id, audit_id, status")
    .eq("id", refundId)
    .maybeSingle();
  if (!refund) return { ok: false, error: "Refund not found", code: "not_found" };

  const actorUserId = await resolveActorUserId(supabase);
  const now = new Date().toISOString();
  await supabase
    .from("billing_refunds")
    .update({
      status,
      reviewed_by: actorUserId,
      reviewed_at: now,
      rejection_reason: rejectionReason ?? null,
      updated_at: now,
    })
    .eq("id", refundId);

  return {
    ok: true,
    refundId,
    auditId: refund.audit_id,
    status,
  };
}

export async function listRefundQueue(
  supabase: AuthClient,
  options?: { schoolId?: string | null; status?: RefundStatus | "open" }
) {
  let request = supabase
    .from("billing_refunds")
    .select("*")
    .order("requested_at", { ascending: false });
  if (options?.schoolId) request = request.eq("school_id", options.schoolId);
  if (options?.status === "open") {
    request = request.in("status", ["requested", "pending_approval", "approved"]);
  } else if (options?.status) {
    request = request.eq("status", options.status);
  }
  const { data } = await request;
  return data ?? [];
}
