/**
 * Accounts receivable — invoices, credits, payments, aging.
 */

import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../audit";
import { requireFinancePermission } from "../permissions";
import {
  listCustomers,
  listInvoices,
  listPayments,
  upsertInvoice,
  upsertPayment,
} from "../store";
import type { AgingBucket, Invoice, PaymentRecord } from "../types";

export function createInvoice(input: {
  organizationId: string;
  userId: string;
  customerId: string;
  amount: number;
  currency?: string;
  dueAt?: string | null;
  entityId?: string | null;
  recurring?: boolean;
  credit?: boolean;
}): Invoice | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  if (
    !listCustomers(input.organizationId).some((c) => c.id === input.customerId)
  ) {
    return { error: "Customer not found." };
  }
  const invoice = upsertInvoice({
    id: `inv:${randomUUID()}`,
    organizationId: input.organizationId,
    customerId: input.customerId,
    entityId: input.entityId ?? null,
    amount: input.amount,
    currency: input.currency ?? "USD",
    dueAt: input.dueAt ?? null,
    status: "draft",
    recurring: input.recurring === true,
    credit: input.credit === true,
    createdAt: new Date().toISOString(),
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "receivable.invoice_create",
    recordType: "invoice",
    recordId: invoice.id,
    userId: input.userId,
    newValue: invoice,
  });
  return invoice;
}

export function sendInvoice(input: {
  organizationId: string;
  userId: string;
  invoiceId: string;
}): Invoice | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const existing = listInvoices(input.organizationId).find(
    (i) => i.id === input.invoiceId
  );
  if (!existing) return { error: "Invoice not found." };
  const next = upsertInvoice({ ...existing, status: "sent" });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "receivable.invoice_send",
    recordType: "invoice",
    recordId: next.id,
    userId: input.userId,
    previousValue: { status: existing.status },
    newValue: { status: next.status },
  });
  return next;
}

export function receivePayment(input: {
  organizationId: string;
  userId: string;
  invoiceId: string;
  amount?: number;
}): PaymentRecord | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const invoice = listInvoices(input.organizationId).find(
    (i) => i.id === input.invoiceId
  );
  if (!invoice) return { error: "Invoice not found." };
  if (invoice.status !== "sent" && invoice.status !== "partial") {
    return { error: "Invoice must be sent before payment." };
  }
  const amount = input.amount ?? invoice.amount;
  const paidInFull = amount >= invoice.amount;
  upsertInvoice({
    ...invoice,
    status: paidInFull ? "paid" : "partial",
  });
  const payment = upsertPayment({
    id: `pay:${randomUUID()}`,
    organizationId: input.organizationId,
    direction: "in",
    amount,
    currency: invoice.currency,
    vendorId: null,
    customerId: invoice.customerId,
    billId: null,
    invoiceId: invoice.id,
    paidAt: new Date().toISOString(),
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "receivable.receive_payment",
    recordType: "payment",
    recordId: payment.id,
    userId: input.userId,
    newValue: payment,
  });
  return payment;
}

export function receivablesAging(
  organizationId: string
): readonly AgingBucket[] {
  const open = listInvoices(organizationId).filter(
    (i) => i.status === "sent" || i.status === "partial"
  );
  const now = Date.now();
  const buckets: Record<AgingBucket["label"], number> = {
    current: 0,
    "1_30": 0,
    "31_60": 0,
    "61_90": 0,
    "90_plus": 0,
  };
  for (const inv of open) {
    const due = inv.dueAt ? Date.parse(inv.dueAt) : now;
    const days = Math.floor((now - due) / 86400000);
    const amt = inv.credit ? -inv.amount : inv.amount;
    if (days <= 0) buckets.current += amt;
    else if (days <= 30) buckets["1_30"] += amt;
    else if (days <= 60) buckets["31_60"] += amt;
    else if (days <= 90) buckets["61_90"] += amt;
    else buckets["90_plus"] += amt;
  }
  return Object.freeze(
    (Object.keys(buckets) as AgingBucket["label"][]).map((label) =>
      Object.freeze({ label, amount: buckets[label] })
    )
  );
}

export { listInvoices, listPayments };
