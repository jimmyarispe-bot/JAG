import { randomUUID } from "node:crypto";
import { requireFinancePermission } from "../../permissions";
import { recordFinanceAudit } from "../../audit";
import {
  listInvoices,
  listPayments,
  upsertInvoice,
  upsertPayment,
} from "../../store";
import { publishOperationalFinanceEvent } from "../../operations/events";
import type { Invoice, PaymentRecord } from "../../types";

export function receiveCustomerPayment(input: {
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
  const prior = listPayments(input.organizationId)
    .filter((p) => p.invoiceId === invoice.id && p.direction === "in")
    .reduce((s, p) => s + p.amount, 0);
  const amount = input.amount ?? invoice.amount - prior;
  if (amount <= 0) return { error: "Payment amount must be positive." };
  const totalPaid = prior + amount;
  const paidInFull = totalPaid >= invoice.amount - 0.001;
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
    action: "revenue.customer_payment",
    recordType: "payment",
    recordId: payment.id,
    userId: input.userId,
    newValue: payment,
  });
  publishOperationalFinanceEvent({
    type: "finance.customer_payment",
    organizationId: input.organizationId,
    recordType: "payment",
    recordId: payment.id,
    actorUserId: input.userId,
    payload: {
      invoiceId: invoice.id,
      amount,
      partial: !paidInFull,
    },
  });
  return payment;
}

export function issueCreditMemo(input: {
  organizationId: string;
  userId: string;
  customerId: string;
  amount: number;
  memo?: string;
}): Invoice | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const credit = upsertInvoice({
    id: `inv:${randomUUID()}`,
    organizationId: input.organizationId,
    customerId: input.customerId,
    entityId: null,
    amount: input.amount,
    currency: "USD",
    dueAt: null,
    status: "sent",
    recurring: false,
    credit: true,
    createdAt: new Date().toISOString(),
  });
  publishOperationalFinanceEvent({
    type: "finance.credit_memo",
    organizationId: input.organizationId,
    recordType: "invoice",
    recordId: credit.id,
    actorUserId: input.userId,
    payload: { amount: credit.amount, memo: input.memo ?? null },
  });
  return credit;
}

export function refundPayment(input: {
  organizationId: string;
  userId: string;
  paymentId: string;
  amount?: number;
}): PaymentRecord | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const original = listPayments(input.organizationId).find(
    (p) => p.id === input.paymentId
  );
  if (!original || original.direction !== "in") {
    return { error: "Original customer payment not found." };
  }
  const amount = input.amount ?? original.amount;
  const refund = upsertPayment({
    id: `pay:${randomUUID()}`,
    organizationId: input.organizationId,
    direction: "out",
    amount,
    currency: original.currency,
    vendorId: null,
    customerId: original.customerId,
    billId: null,
    invoiceId: original.invoiceId,
    paidAt: new Date().toISOString(),
  });
  publishOperationalFinanceEvent({
    type: "finance.refund",
    organizationId: input.organizationId,
    recordType: "payment",
    recordId: refund.id,
    actorUserId: input.userId,
    payload: { originalPaymentId: original.id, amount },
  });
  return refund;
}

export function writeOffInvoice(input: {
  organizationId: string;
  userId: string;
  invoiceId: string;
}): Invoice | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "approve",
  });
  if ("error" in gate) return gate;
  const invoice = listInvoices(input.organizationId).find(
    (i) => i.id === input.invoiceId
  );
  if (!invoice) return { error: "Invoice not found." };
  const next = upsertInvoice({ ...invoice, status: "void" });
  publishOperationalFinanceEvent({
    type: "finance.write_off",
    organizationId: input.organizationId,
    recordType: "invoice",
    recordId: next.id,
    actorUserId: input.userId,
    payload: { amount: next.amount },
  });
  return next;
}

export { listPayments };
