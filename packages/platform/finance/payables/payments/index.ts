import { randomUUID } from "node:crypto";
import { requireFinancePermission } from "../../permissions";
import { recordFinanceAudit } from "../../audit";
import { listBills, upsertBill, upsertPayment } from "../../store";
import {
  listRuns,
  listSchedules,
  upsertRun,
  upsertSchedule,
  upsertDebitMemo,
  listDebitMemos,
  upsertStatement,
  listStatements,
} from "../store";
import type {
  DebitMemo,
  PaymentMethod,
  PaymentRun,
  PaymentScheduleItem,
  VendorStatement,
} from "../types";
import { publishOperationalFinanceEvent } from "../../operations/events";

export function scheduleBillPayment(input: {
  organizationId: string;
  userId: string;
  billId: string;
  scheduledAt: string;
  method: PaymentMethod;
  amount?: number;
  earlyDiscountAmount?: number;
}): PaymentScheduleItem | { error: string } {
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
    return { error: "Bill must be approved to schedule payment." };
  }
  if (input.method === "virtual_card") {
    // Future hook — schedule allowed as placeholder rail.
  }
  const amount = (input.amount ?? bill.amount) - (input.earlyDiscountAmount ?? 0);
  if (amount <= 0) return { error: "Scheduled amount must be positive." };
  return upsertSchedule({
    id: `psched:${randomUUID()}`,
    organizationId: input.organizationId,
    billId: bill.id,
    scheduledAt: input.scheduledAt,
    amount,
    method: input.method,
    earlyDiscountAmount: input.earlyDiscountAmount ?? 0,
    status: "scheduled",
  });
}

export function executePaymentRun(input: {
  organizationId: string;
  userId: string;
  scheduleIds: readonly string[];
  method: PaymentMethod;
}): PaymentRun | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "post",
  });
  if ("error" in gate) return gate;
  const schedules = listSchedules(input.organizationId).filter((s) =>
    input.scheduleIds.includes(s.id)
  );
  if (!schedules.length) return { error: "No schedules selected." };
  let total = 0;
  for (const s of schedules) {
    if (s.status !== "scheduled") {
      return { error: `Schedule ${s.id} is not open.` };
    }
    const bill = listBills(input.organizationId).find((b) => b.id === s.billId);
    if (!bill || bill.status !== "approved") {
      return { error: `Bill ${s.billId} not payable.` };
    }
    upsertBill({ ...bill, status: "paid" });
    upsertPayment({
      id: `pay:${randomUUID()}`,
      organizationId: input.organizationId,
      direction: "out",
      amount: s.amount,
      currency: bill.currency,
      vendorId: bill.vendorId,
      customerId: null,
      billId: bill.id,
      invoiceId: null,
      paidAt: new Date().toISOString(),
    });
    upsertSchedule({ ...s, status: "paid" });
    total += s.amount;
  }
  const run = upsertRun({
    id: `prun:${randomUUID()}`,
    organizationId: input.organizationId,
    method: input.method,
    scheduleIds: Object.freeze([...input.scheduleIds]),
    total,
    currency: "USD",
    executedAt: new Date().toISOString(),
    executedBy: input.userId,
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "payable.payment_run",
    recordType: "payment_run",
    recordId: run.id,
    userId: input.userId,
    newValue: run,
  });
  publishOperationalFinanceEvent({
    type: "finance.payment_run",
    organizationId: input.organizationId,
    recordType: "payment_run",
    recordId: run.id,
    actorUserId: input.userId,
    payload: { total: run.total, method: run.method, count: schedules.length },
  });
  return run;
}

export function createDebitMemo(input: {
  organizationId: string;
  userId: string;
  vendorId: string;
  amount: number;
  memo: string;
}): DebitMemo | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  return upsertDebitMemo({
    id: `dmemo:${randomUUID()}`,
    organizationId: input.organizationId,
    vendorId: input.vendorId,
    amount: input.amount,
    memo: input.memo,
    createdAt: new Date().toISOString(),
  });
}

export function generateVendorStatement(input: {
  organizationId: string;
  vendorId: string;
  periodKey: string;
}): VendorStatement {
  const open = listBills(input.organizationId).filter(
    (b) =>
      b.vendorId === input.vendorId &&
      (b.status === "approved" || b.status === "pending_approval")
  );
  const balance = open.reduce(
    (s, b) => s + (b.credit ? -b.amount : b.amount),
    0
  );
  return upsertStatement({
    id: `vstmt:${randomUUID()}`,
    organizationId: input.organizationId,
    vendorId: input.vendorId,
    periodKey: input.periodKey,
    balance,
    generatedAt: new Date().toISOString(),
  });
}

export { listSchedules, listRuns, listDebitMemos, listStatements };
