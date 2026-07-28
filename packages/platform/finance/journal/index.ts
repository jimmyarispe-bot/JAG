/**
 * General ledger journal — draft, approve, post, reverse, period lock.
 * Reconciliation is out of scope for P-008.
 */

import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../audit";
import { requireFinancePermission } from "../permissions";
import {
  getJournal,
  getPeriod,
  listJournals,
  upsertJournal,
  upsertPeriod,
} from "../store";
import type { JournalEntry, JournalKind, JournalLine } from "../types";

function periodKeyFrom(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function balanceOk(lines: readonly JournalLine[]): boolean {
  const debits = lines.reduce((a, l) => a + l.debit, 0);
  const credits = lines.reduce((a, l) => a + l.credit, 0);
  return Math.abs(debits - credits) < 0.0001 && debits > 0;
}

export function createJournalEntry(input: {
  organizationId: string;
  userId: string;
  description: string;
  entityId?: string | null;
  kind?: JournalKind;
  periodKey?: string;
  lines: readonly {
    accountId: string;
    debit?: number;
    credit?: number;
    entityId?: string | null;
    memo?: string | null;
  }[];
  recurringRule?: string | null;
}): JournalEntry | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;

  const periodKey = input.periodKey ?? periodKeyFrom();
  const period = getPeriod(input.organizationId, periodKey);
  if (period?.locked) {
    return { error: `Period ${periodKey} is locked.` };
  }

  const lines: JournalLine[] = input.lines.map((l) =>
    Object.freeze({
      id: `jl:${randomUUID()}`,
      accountId: l.accountId,
      debit: l.debit ?? 0,
      credit: l.credit ?? 0,
      entityId: l.entityId ?? input.entityId ?? null,
      memo: l.memo ?? null,
    })
  );
  if (!balanceOk(lines)) {
    return { error: "Journal entry must balance (debits = credits > 0)." };
  }

  const entry = upsertJournal({
    id: `je:${randomUUID()}`,
    organizationId: input.organizationId,
    entityId: input.entityId ?? null,
    kind: input.kind ?? "standard",
    status: "draft",
    periodKey,
    description: input.description,
    lines: Object.freeze(lines),
    attachmentIds: Object.freeze([]),
    createdBy: input.userId,
    approvedBy: null,
    postedBy: null,
    createdAt: new Date().toISOString(),
    postedAt: null,
    reversesEntryId: null,
    recurringRule: input.recurringRule ?? null,
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "journal.create",
    recordType: "journal",
    recordId: entry.id,
    userId: input.userId,
    newValue: { id: entry.id, status: entry.status },
  });
  return entry;
}

export function approveJournal(input: {
  organizationId: string;
  userId: string;
  journalId: string;
}): JournalEntry | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "approve",
  });
  if ("error" in gate) return gate;
  const existing = getJournal(input.journalId);
  if (!existing || existing.organizationId !== input.organizationId) {
    return { error: "Journal not found." };
  }
  if (existing.status === "posted") {
    return { error: "Posted journals cannot be re-approved." };
  }
  const next = upsertJournal({
    ...existing,
    status: "approved",
    approvedBy: input.userId,
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "journal.approve",
    recordType: "journal",
    recordId: next.id,
    userId: input.userId,
    previousValue: { status: existing.status },
    newValue: { status: next.status },
    approval: input.userId,
  });
  return next;
}

export function postJournal(input: {
  organizationId: string;
  userId: string;
  journalId: string;
}): JournalEntry | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "post",
  });
  if ("error" in gate) return gate;
  const existing = getJournal(input.journalId);
  if (!existing || existing.organizationId !== input.organizationId) {
    return { error: "Journal not found." };
  }
  if (existing.status !== "approved" && existing.status !== "draft") {
    // allow post from approved; drafts of adjusting may post after approve
  }
  if (existing.status !== "approved") {
    return { error: "Journal must be approved before posting." };
  }
  const period = getPeriod(input.organizationId, existing.periodKey);
  if (period?.locked) {
    return { error: `Period ${existing.periodKey} is locked.` };
  }
  const next = upsertJournal({
    ...existing,
    status: "posted",
    postedBy: input.userId,
    postedAt: new Date().toISOString(),
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "journal.post",
    recordType: "journal",
    recordId: next.id,
    userId: input.userId,
    previousValue: { status: existing.status },
    newValue: { status: next.status, postedAt: next.postedAt },
  });
  return next;
}

export function reverseJournal(input: {
  organizationId: string;
  userId: string;
  journalId: string;
}): JournalEntry | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "post",
  });
  if ("error" in gate) return gate;
  const existing = getJournal(input.journalId);
  if (!existing || existing.status !== "posted") {
    return { error: "Only posted journals can be reversed." };
  }
  const lines = existing.lines.map((l) =>
    Object.freeze({
      ...l,
      id: `jl:${randomUUID()}`,
      debit: l.credit,
      credit: l.debit,
    })
  );
  const reversing = upsertJournal({
    id: `je:${randomUUID()}`,
    organizationId: input.organizationId,
    entityId: existing.entityId,
    kind: "reversing",
    status: "posted",
    periodKey: existing.periodKey,
    description: `Reversal of ${existing.id}`,
    lines: Object.freeze(lines),
    attachmentIds: Object.freeze([]),
    createdBy: input.userId,
    approvedBy: input.userId,
    postedBy: input.userId,
    createdAt: new Date().toISOString(),
    postedAt: new Date().toISOString(),
    reversesEntryId: existing.id,
    recurringRule: null,
  });
  upsertJournal({ ...existing, status: "reversed" });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "journal.reverse",
    recordType: "journal",
    recordId: reversing.id,
    userId: input.userId,
    previousValue: { originalId: existing.id },
    newValue: { reversingId: reversing.id },
  });
  return reversing;
}

export function lockPeriod(input: {
  organizationId: string;
  userId: string;
  periodKey: string;
}): ReturnType<typeof upsertPeriod> | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "close_period",
  });
  if ("error" in gate) return gate;
  const period = upsertPeriod({
    organizationId: input.organizationId,
    periodKey: input.periodKey,
    locked: true,
    lockedAt: new Date().toISOString(),
    lockedBy: input.userId,
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "period.lock",
    recordType: "period",
    recordId: input.periodKey,
    userId: input.userId,
    newValue: period,
  });
  return period;
}

export { listJournals, getJournal, periodKeyFrom };
