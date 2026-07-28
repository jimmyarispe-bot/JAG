/**
 * Accounts payable — bills, credits, payments, aging (P-008 foundation).
 */

import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../../audit";
import { requireFinancePermission } from "../../permissions";
import {
  listBills,
  listPayments,
  listVendors,
  upsertBill,
  upsertPayment,
} from "../../store";
import type { AgingBucket, Bill, PaymentRecord } from "../../types";
import { publishOperationalFinanceEvent } from "../../operations/events";

export function createBill(input: {
  organizationId: string;
  userId: string;
  vendorId: string;
  amount: number;
  currency?: string;
  dueAt?: string | null;
  entityId?: string | null;
  recurring?: boolean;
  credit?: boolean;
}): Bill | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  if (!listVendors(input.organizationId).some((v) => v.id === input.vendorId)) {
    return { error: "Vendor not found." };
  }
  const bill = upsertBill({
    id: `bill:${randomUUID()}`,
    organizationId: input.organizationId,
    vendorId: input.vendorId,
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
    action: "payable.bill_create",
    recordType: "bill",
    recordId: bill.id,
    userId: input.userId,
    newValue: bill,
  });
  publishOperationalFinanceEvent({
    type: "finance.bill_created",
    organizationId: input.organizationId,
    recordType: "bill",
    recordId: bill.id,
    actorUserId: input.userId,
    payload: { amount: bill.amount, vendorId: bill.vendorId },
  });
  return bill;
}

export function approveBill(input: {
  organizationId: string;
  userId: string;
  billId: string;
}): Bill | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "approve",
  });
  if ("error" in gate) return gate;
  const existing = listBills(input.organizationId).find(
    (b) => b.id === input.billId
  );
  if (!existing) return { error: "Bill not found." };
  const next = upsertBill({ ...existing, status: "approved" });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "payable.bill_approve",
    recordType: "bill",
    recordId: next.id,
    userId: input.userId,
    previousValue: { status: existing.status },
    newValue: { status: next.status },
    approval: input.userId,
  });
  publishOperationalFinanceEvent({
    type: "finance.bill_approved",
    organizationId: input.organizationId,
    recordType: "bill",
    recordId: next.id,
    actorUserId: input.userId,
  });
  return next;
}

export function payBill(input: {
  organizationId: string;
  userId: string;
  billId: string;
}): PaymentRecord | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const bill = listBills(input.organizationId).find(
    (b) => b.id === input.billId
  );
  if (!bill) return { error: "Bill not found." };
  if (bill.status !== "approved") {
    return { error: "Bill must be approved before payment." };
  }
  upsertBill({ ...bill, status: "paid" });
  const payment = upsertPayment({
    id: `pay:${randomUUID()}`,
    organizationId: input.organizationId,
    direction: "out",
    amount: bill.amount,
    currency: bill.currency,
    vendorId: bill.vendorId,
    customerId: null,
    billId: bill.id,
    invoiceId: null,
    paidAt: new Date().toISOString(),
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "payable.pay",
    recordType: "payment",
    recordId: payment.id,
    userId: input.userId,
    newValue: payment,
  });
  publishOperationalFinanceEvent({
    type: "finance.vendor_payment",
    organizationId: input.organizationId,
    recordType: "payment",
    recordId: payment.id,
    actorUserId: input.userId,
    payload: { billId: bill.id, amount: payment.amount },
  });
  return payment;
}

export function payablesAging(organizationId: string): readonly AgingBucket[] {
  const open = listBills(organizationId).filter(
    (b) => b.status === "approved" || b.status === "pending_approval"
  );
  const now = Date.now();
  const buckets: Record<AgingBucket["label"], number> = {
    current: 0,
    "1_30": 0,
    "31_60": 0,
    "61_90": 0,
    "90_plus": 0,
  };
  for (const b of open) {
    const due = b.dueAt ? Date.parse(b.dueAt) : now;
    const days = Math.floor((now - due) / 86400000);
    const amt = b.credit ? -b.amount : b.amount;
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

export { listBills, listPayments };
