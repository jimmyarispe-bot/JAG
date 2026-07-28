import { createInvoice, listInvoices, sendInvoice } from "../../receivables";
import { requireFinancePermission } from "../../permissions";
import {
  getContract,
  getFunding,
  listInvoiceMeta,
  upsertInvoiceMeta,
  upsertSubscription,
  listSubscriptions,
} from "../store";
import type { BillingMode, RevenueInvoiceMeta } from "../types";
import { publishOperationalFinanceEvent } from "../../operations/events";
import type { Invoice } from "../../types";

export function createRevenueInvoice(input: {
  organizationId: string;
  userId: string;
  customerId: string;
  amount: number;
  billingMode?: BillingMode;
  contractId?: string | null;
  subscriptionId?: string | null;
  fundingSourceId?: string | null;
  dueAt?: string | null;
  recurring?: boolean;
  currency?: string;
  deferredAmount?: number;
}): (Invoice & { meta: RevenueInvoiceMeta }) | { error: string } {
  if (input.fundingSourceId && !getFunding(input.fundingSourceId)) {
    return { error: "Funding source not found." };
  }
  if (input.contractId && !getContract(input.contractId)) {
    return { error: "Contract not found." };
  }

  const invoice = createInvoice({
    organizationId: input.organizationId,
    userId: input.userId,
    customerId: input.customerId,
    amount: input.amount,
    dueAt: input.dueAt,
    recurring: input.recurring,
    currency: input.currency,
  });
  if ("error" in invoice) return invoice;

  const deferred = input.deferredAmount ?? 0;
  const meta = upsertInvoiceMeta({
    invoiceId: invoice.id,
    organizationId: input.organizationId,
    contractId: input.contractId ?? null,
    subscriptionId: input.subscriptionId ?? null,
    fundingSourceId: input.fundingSourceId ?? null,
    billingMode: input.billingMode ?? "manual",
    deferredAmount: deferred,
    recognizedAmount: Math.max(0, input.amount - deferred),
  });

  publishOperationalFinanceEvent({
    type: "finance.invoice_created",
    organizationId: input.organizationId,
    recordType: "invoice",
    recordId: invoice.id,
    actorUserId: input.userId,
    payload: {
      amount: invoice.amount,
      fundingSourceId: meta.fundingSourceId,
      billingMode: meta.billingMode,
    },
  });

  if (meta.fundingSourceId) {
    publishOperationalFinanceEvent({
      type: "finance.funding_applied",
      organizationId: input.organizationId,
      recordType: "invoice",
      recordId: invoice.id,
      actorUserId: input.userId,
      payload: { fundingSourceId: meta.fundingSourceId },
    });
  }

  return { ...invoice, meta };
}

export function sendRevenueInvoice(input: {
  organizationId: string;
  userId: string;
  invoiceId: string;
}): Invoice | { error: string } {
  const sent = sendInvoice(input);
  if ("error" in sent) return sent;
  publishOperationalFinanceEvent({
    type: "finance.invoice_sent",
    organizationId: input.organizationId,
    recordType: "invoice",
    recordId: sent.id,
    actorUserId: input.userId,
  });
  return sent;
}

export function billSubscription(input: {
  organizationId: string;
  userId: string;
  subscriptionId: string;
}): (Invoice & { meta: RevenueInvoiceMeta }) | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const sub = listSubscriptions(input.organizationId).find(
    (s) => s.id === input.subscriptionId
  );
  if (!sub || !sub.active) return { error: "Subscription not found or inactive." };

  const inv = createRevenueInvoice({
    organizationId: input.organizationId,
    userId: input.userId,
    customerId: sub.customerId,
    amount: sub.amount,
    currency: sub.currency,
    billingMode: "recurring",
    subscriptionId: sub.id,
    contractId: sub.contractId,
    fundingSourceId: sub.fundingSourceId,
    recurring: true,
  });
  if ("error" in inv) return inv;

  const next = new Date(sub.nextBillAt);
  if (sub.interval === "monthly") next.setUTCMonth(next.getUTCMonth() + 1);
  else if (sub.interval === "quarterly") next.setUTCMonth(next.getUTCMonth() + 3);
  else next.setUTCFullYear(next.getUTCFullYear() + 1);
  upsertSubscription({ ...sub, nextBillAt: next.toISOString() });

  publishOperationalFinanceEvent({
    type: "finance.subscription_billed",
    organizationId: input.organizationId,
    recordType: "subscription",
    recordId: sub.id,
    actorUserId: input.userId,
    payload: { invoiceId: inv.id, amount: inv.amount },
  });
  return inv;
}

export { listInvoices, listInvoiceMeta };
