import { randomUUID } from "node:crypto";
import { requireFinancePermission } from "../../permissions";
import { listBanks } from "../../store";
import {
  getPeriod,
  listPeriods,
  upsertPeriod,
} from "../store";
import type {
  ReconciliationAccountKind,
  ReconciliationPeriod,
  ReconciliationPeriodCadence,
  ReconciliationPeriodScope,
} from "../types";
import { publishReconciliationSignal } from "../events";
import { recordReconciliationHistory } from "../history";

function mapAccountKind(kind: string): ReconciliationAccountKind {
  const allowed: ReconciliationAccountKind[] = [
    "bank",
    "checking",
    "savings",
    "money_market",
    "credit_card",
    "loan",
    "line_of_credit",
    "investment",
    "petty_cash",
    "escrow",
    "trust",
    "intercompany",
    "restricted_cash",
    "cash",
  ];
  return (allowed.includes(kind as ReconciliationAccountKind)
    ? kind
    : "bank") as ReconciliationAccountKind;
}

export function openReconciliationPeriod(input: {
  organizationId: string;
  userId: string;
  bankAccountId: string;
  periodKey: string;
  cadence?: ReconciliationPeriodCadence;
  scope?: ReconciliationPeriodScope;
  scopeId?: string | null;
  statementBalance: number;
  bookBalance?: number;
  statementImportId?: string | null;
  accountKind?: ReconciliationAccountKind;
}): ReconciliationPeriod | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "reconcile",
  });
  if ("error" in gate) return gate;

  const bank = listBanks(input.organizationId).find(
    (b) => b.id === input.bankAccountId
  );
  if (!bank) return { error: "Bank account not found." };

  const existing = listPeriods(input.organizationId).find(
    (p) =>
      p.bankAccountId === input.bankAccountId &&
      p.periodKey === input.periodKey &&
      p.status !== "closed"
  );
  if (existing) {
    return { error: "An open period already exists for this account/key." };
  }

  const period = upsertPeriod({
    id: `rper:${randomUUID()}`,
    organizationId: input.organizationId,
    bankAccountId: input.bankAccountId,
    accountKind: input.accountKind ?? mapAccountKind(bank.kind),
    cadence: input.cadence ?? "monthly",
    scope: input.scope ?? "organization",
    scopeId: input.scopeId ?? bank.entityId,
    periodKey: input.periodKey,
    status: "open",
    statementBalance: input.statementBalance,
    bookBalance: input.bookBalance ?? bank.currentBalance ?? 0,
    currency: bank.currency,
    openedAt: new Date().toISOString(),
    openedBy: input.userId,
    closedAt: null,
    closedBy: null,
    finalizedAt: null,
    statementImportId: input.statementImportId ?? null,
    autoMatchRate: 0,
    manualMatchRate: 0,
  });

  recordReconciliationHistory({
    organizationId: input.organizationId,
    periodId: period.id,
    action: "period_opened",
    actorUserId: input.userId,
    currentState: period,
  });
  publishReconciliationSignal({
    type: "reconciliation.period_opened",
    organizationId: input.organizationId,
    periodId: period.id,
    actorUserId: input.userId,
    payload: {
      periodKey: period.periodKey,
      bankAccountId: period.bankAccountId,
      accountKind: period.accountKind,
    },
  });
  return period;
}

export function attachStatementImport(input: {
  organizationId: string;
  userId: string;
  periodId: string;
  statementImportId: string;
}): ReconciliationPeriod | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "reconcile",
  });
  if ("error" in gate) return gate;
  const period = getPeriod(input.periodId);
  if (!period || period.organizationId !== input.organizationId) {
    return { error: "Period not found." };
  }
  if (period.status === "closed") return { error: "Period is closed." };
  const updated = upsertPeriod({
    ...period,
    statementImportId: input.statementImportId,
    status: period.status === "open" ? "matching" : period.status,
  });
  recordReconciliationHistory({
    organizationId: input.organizationId,
    periodId: period.id,
    action: "statement_attached",
    actorUserId: input.userId,
    previousState: period,
    currentState: updated,
  });
  return updated;
}

export function setPeriodStatus(
  periodId: string,
  status: ReconciliationPeriod["status"],
  patch?: Partial<ReconciliationPeriod>
): ReconciliationPeriod | { error: string } {
  const period = getPeriod(periodId);
  if (!period) return { error: "Period not found." };
  return upsertPeriod({ ...period, ...patch, status });
}

export { listPeriods, getPeriod };
