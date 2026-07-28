import { randomUUID } from "node:crypto";
import { requireFinancePermission } from "../../permissions";
import { receivablesAging } from "../../receivables";
import { listInvoices } from "../../store";
import {
  listCollections,
  listPlans,
  listReminders,
  upsertCollection,
  upsertPlan,
  upsertReminder,
} from "../store";
import type {
  CollectionActivity,
  CollectionStatus,
  PaymentPlan,
  ReminderRule,
} from "../types";
import { publishOperationalFinanceEvent } from "../../operations/events";

export function recordCollectionActivity(input: {
  organizationId: string;
  userId: string;
  customerId: string;
  status: CollectionStatus;
  note: string;
  invoiceId?: string | null;
  promiseToPayAt?: string | null;
  paymentPlanId?: string | null;
}): CollectionActivity | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  const activity = upsertCollection({
    id: `coll:${randomUUID()}`,
    organizationId: input.organizationId,
    customerId: input.customerId,
    invoiceId: input.invoiceId ?? null,
    status: input.status,
    note: input.note,
    promiseToPayAt: input.promiseToPayAt ?? null,
    paymentPlanId: input.paymentPlanId ?? null,
    createdAt: new Date().toISOString(),
    createdBy: input.userId,
  });
  publishOperationalFinanceEvent({
    type: "finance.collection_activity",
    organizationId: input.organizationId,
    recordType: "collection",
    recordId: activity.id,
    actorUserId: input.userId,
    payload: { status: activity.status, customerId: activity.customerId },
  });
  return activity;
}

export function createPaymentPlan(input: {
  organizationId: string;
  userId: string;
  customerId: string;
  invoiceIds: readonly string[];
  installments: readonly { dueAt: string; amount: number }[];
}): PaymentPlan | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  if (!input.installments.length) {
    return { error: "Payment plan requires installments." };
  }
  const plan = upsertPlan({
    id: `pplan:${randomUUID()}`,
    organizationId: input.organizationId,
    customerId: input.customerId,
    invoiceIds: Object.freeze([...input.invoiceIds]),
    installments: Object.freeze([...input.installments]),
    active: true,
  });
  recordCollectionActivity({
    organizationId: input.organizationId,
    userId: input.userId,
    customerId: input.customerId,
    status: "payment_plan",
    note: "Payment plan created",
    paymentPlanId: plan.id,
  });
  return plan;
}

export function upsertReminderRule(input: {
  organizationId: string;
  userId: string;
  daysPastDue: number;
  channel: ReminderRule["channel"];
}): ReminderRule | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;
  return upsertReminder({
    id: `rrule:${randomUUID()}`,
    organizationId: input.organizationId,
    daysPastDue: input.daysPastDue,
    channel: input.channel,
    active: true,
  });
}

/** Dunning: apply reminder rules to past-due invoices. */
export function runDunning(input: {
  organizationId: string;
  userId: string;
}): readonly CollectionActivity[] {
  const rules = listReminders(input.organizationId).filter((r) => r.active);
  const now = Date.now();
  const created: CollectionActivity[] = [];
  for (const inv of listInvoices(input.organizationId)) {
    if (inv.status !== "sent" && inv.status !== "partial") continue;
    if (!inv.dueAt) continue;
    const days = Math.floor((now - Date.parse(inv.dueAt)) / 86400000);
    if (days <= 0) continue;
    const rule = rules
      .filter((r) => days >= r.daysPastDue)
      .sort((a, b) => b.daysPastDue - a.daysPastDue)[0];
    if (!rule) continue;
    const act = recordCollectionActivity({
      organizationId: input.organizationId,
      userId: input.userId,
      customerId: inv.customerId,
      invoiceId: inv.id,
      status: days >= 60 ? "dunning" : "reminder",
      note: `Auto ${rule.channel} reminder at ${rule.daysPastDue}+ days`,
    });
    if (!("error" in act)) created.push(act);
  }
  return Object.freeze(created);
}

export function collectionsAging(organizationId: string) {
  return receivablesAging(organizationId);
}

export { listCollections, listPlans, listReminders };
