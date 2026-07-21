import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordFinanceActivity } from "./activity";
import type { InvoiceLifecycleStatus } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type InvoiceMutationResult =
  | { ok: true; invoiceId: string; status: string }
  | { ok: false; error: string; code?: string; suggestArchive?: boolean };

async function loadInvoice(supabase: AuthClient, invoiceId: string) {
  const { data } = await supabase
    .from("invoices")
    .select("*, family_billing_accounts(school_id, family_id)")
    .eq("id", invoiceId)
    .maybeSingle();
  return data;
}

function accountCtx(invoice: {
  family_billing_accounts?: unknown;
}): { schoolId: string | null; familyId: string | null } {
  const acct = Array.isArray(invoice.family_billing_accounts)
    ? invoice.family_billing_accounts[0]
    : invoice.family_billing_accounts;
  return {
    schoolId: (acct as { school_id?: string } | null)?.school_id ?? null,
    familyId: (acct as { family_id?: string } | null)?.family_id ?? null,
  };
}

export async function voidInvoice(
  supabase: AuthClient,
  invoiceId: string,
  reason?: string
): Promise<InvoiceMutationResult> {
  const invoice = await loadInvoice(supabase, invoiceId);
  if (!invoice) return { ok: false, error: "Invoice not found", code: "not_found" };
  if (["paid", "void", "voided"].includes(String(invoice.invoice_status))) {
    return { ok: false, error: `Cannot void invoice in status ${invoice.invoice_status}` };
  }
  if (Number(invoice.amount_paid) > 0) {
    return {
      ok: false,
      error: "Invoice has payments — issue a refund instead of voiding.",
      code: "has_dependencies",
    };
  }

  const now = new Date().toISOString();
  await supabase
    .from("invoices")
    .update({
      invoice_status: "voided",
      voided_at: now,
      void_reason: reason ?? "Voided",
    })
    .eq("id", invoiceId);

  await supabase.rpc("sync_billing_account_balance", {
    p_account_id: invoice.billing_account_id,
  });

  return { ok: true, invoiceId, status: "voided" };
}

export async function sendInvoice(
  supabase: AuthClient,
  invoiceId: string
): Promise<InvoiceMutationResult> {
  const invoice = await loadInvoice(supabase, invoiceId);
  if (!invoice) return { ok: false, error: "Invoice not found", code: "not_found" };

  await supabase
    .from("invoices")
    .update({
      invoice_status: "sent",
      issued_at: new Date().toISOString().slice(0, 10),
    })
    .eq("id", invoiceId);

  const { schoolId, familyId } = accountCtx(invoice);
  const schoolCtx = schoolId ? await resolveSchoolContext(supabase, schoolId) : null;
  await recordFinanceActivity(supabase, {
    eventType: "invoice.sent",
    title: "Invoice sent",
    summary: invoice.invoice_number,
    entityId: invoiceId,
    organizationId: schoolCtx?.organizationId,
    schoolId,
    familyId,
    studentId: invoice.student_id,
    actorUserId: await resolveActorUserId(supabase),
  });

  return { ok: true, invoiceId, status: "sent" };
}

export async function markInvoiceOverdue(
  supabase: AuthClient,
  invoiceId: string
): Promise<InvoiceMutationResult> {
  const invoice = await loadInvoice(supabase, invoiceId);
  if (!invoice) return { ok: false, error: "Invoice not found", code: "not_found" };

  await supabase
    .from("invoices")
    .update({ invoice_status: "overdue" })
    .eq("id", invoiceId);

  const { schoolId, familyId } = accountCtx(invoice);
  const schoolCtx = schoolId ? await resolveSchoolContext(supabase, schoolId) : null;
  await recordFinanceActivity(supabase, {
    eventType: "invoice.overdue",
    title: "Invoice overdue",
    summary: invoice.invoice_number,
    entityId: invoiceId,
    organizationId: schoolCtx?.organizationId,
    schoolId,
    familyId,
    studentId: invoice.student_id,
    actorUserId: await resolveActorUserId(supabase),
  });

  return { ok: true, invoiceId, status: "overdue" };
}

export async function duplicateInvoice(
  supabase: AuthClient,
  invoiceId: string
): Promise<InvoiceMutationResult> {
  const invoice = await loadInvoice(supabase, invoiceId);
  if (!invoice) return { ok: false, error: "Invoice not found", code: "not_found" };

  const number = `${invoice.invoice_number}-COPY-${Date.now().toString().slice(-6)}`;
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      billing_account_id: invoice.billing_account_id,
      tuition_plan_id: invoice.tuition_plan_id,
      student_id: invoice.student_id,
      invoice_number: number,
      description: invoice.description ? `${invoice.description} (Copy)` : "Copied invoice",
      subtotal: invoice.subtotal,
      sibling_discount_amount: invoice.sibling_discount_amount,
      scholarship_credit: invoice.scholarship_credit,
      state_funding_credit: invoice.state_funding_credit,
      total_amount: invoice.total_amount,
      family_responsibility: invoice.family_responsibility,
      amount_paid: 0,
      due_date: invoice.due_date,
      invoice_status: "draft",
      duplicated_from_id: invoice.id,
      policy_locked: true,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Duplicate failed" };

  const { schoolId, familyId } = accountCtx(invoice);
  const schoolCtx = schoolId ? await resolveSchoolContext(supabase, schoolId) : null;
  await recordFinanceActivity(supabase, {
    eventType: "invoice.created",
    title: "Invoice duplicated",
    summary: number,
    entityId: data.id,
    organizationId: schoolCtx?.organizationId,
    schoolId,
    familyId,
    studentId: invoice.student_id,
    actorUserId: await resolveActorUserId(supabase),
    payload: { duplicatedFrom: invoiceId },
  });

  return { ok: true, invoiceId: data.id, status: "draft" };
}

export async function archiveInvoice(
  supabase: AuthClient,
  invoiceId: string
): Promise<InvoiceMutationResult> {
  const invoice = await loadInvoice(supabase, invoiceId);
  if (!invoice) return { ok: false, error: "Invoice not found", code: "not_found" };

  await supabase
    .from("invoices")
    .update({
      invoice_status: "archived",
      archived_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  return { ok: true, invoiceId, status: "archived" };
}

/**
 * Hard delete only draft invoices with no payments and not policy-locked.
 * Prefer void / archive.
 */
export async function deleteInvoice(
  supabase: AuthClient,
  input: {
    invoiceId: string;
    confirmationText: string;
    acknowledged: boolean;
  }
): Promise<InvoiceMutationResult> {
  const { validateDeleteConfirmation } = await import("@/lib/platform/crud");
  const confirmation = validateDeleteConfirmation(input);
  if (!confirmation.ok) {
    return { ok: false, error: confirmation.error, code: confirmation.code };
  }

  const invoice = await loadInvoice(supabase, input.invoiceId);
  if (!invoice) return { ok: false, error: "Invoice not found", code: "not_found" };

  const policyLocked = Boolean((invoice as { policy_locked?: boolean }).policy_locked ?? true);
  const canDelete =
    !policyLocked &&
    String(invoice.invoice_status) === "draft" &&
    Number(invoice.amount_paid) === 0;

  if (!canDelete) {
    return {
      ok: false,
      error:
        "Only unlocked draft invoices with no payments can be deleted. Void or archive instead.",
      code: "policy_locked",
      suggestArchive: true,
    };
  }

  await supabase.from("invoice_line_items").delete().eq("invoice_id", invoice.id);
  const { error } = await supabase.from("invoices").delete().eq("id", invoice.id);
  if (error) return { ok: false, error: error.message };

  return { ok: true, invoiceId: invoice.id, status: "deleted" };
}

export async function updateInvoiceDraft(
  supabase: AuthClient,
  invoiceId: string,
  patch: {
    description?: string;
    dueDate?: string;
    subtotal?: number;
    status?: InvoiceLifecycleStatus;
  }
): Promise<InvoiceMutationResult> {
  const invoice = await loadInvoice(supabase, invoiceId);
  if (!invoice) return { ok: false, error: "Invoice not found", code: "not_found" };
  if (!["draft", "pending"].includes(String(invoice.invoice_status))) {
    return { ok: false, error: "Only draft/pending invoices can be edited" };
  }

  const updates: Record<string, unknown> = {};
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.dueDate !== undefined) updates.due_date = patch.dueDate;
  if (patch.status !== undefined) updates.invoice_status = patch.status;
  if (patch.subtotal !== undefined) {
    updates.subtotal = patch.subtotal;
    updates.total_amount = patch.subtotal;
    updates.family_responsibility = patch.subtotal;
  }

  const { error } = await supabase.from("invoices").update(updates).eq("id", invoiceId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, invoiceId, status: String(patch.status ?? invoice.invoice_status) };
}
