import { randomUUID } from "node:crypto";
import { requireFinancePermission } from "../../permissions";
import { createJournalEntry } from "../../journal";
import {
  clearSuggestions,
  getPeriod,
  listExceptions,
  listMatches,
  listSuggestions,
  upsertMatch,
  upsertPeriod,
  upsertSuggestion,
} from "../store";
import type {
  AdjustmentKind,
  MatchCardinality,
  ReconciliationAdjustment,
  ReconciliationMatch,
  ReconciliationPeriod,
  ReconciliationSideType,
} from "../types";
import { upsertAdjustment } from "../store";
import { publishReconciliationSignal } from "../events";
import { recordReconciliationHistory } from "../history";
import { createException } from "../exceptions";
import { refreshSuggestions } from "../suggestions";
import { getMatchingRules } from "../rules";
import {
  requireClosePermission,
  requireReopenPermission,
  listApprovals,
  STAGE_ORDER,
} from "../approvals";
import { listTransactions } from "../../banking/store";
import { listAccounts } from "../../store";

function recomputeRates(periodId: string, organizationId: string): {
  autoMatchRate: number;
  manualMatchRate: number;
} {
  const matches = listMatches(organizationId, periodId).filter(
    (m) => m.status === "accepted" || m.status === "auto_accepted"
  );
  if (matches.length === 0) return { autoMatchRate: 0, manualMatchRate: 0 };
  const auto = matches.filter((m) => m.automatic).length;
  return {
    autoMatchRate: auto / matches.length,
    manualMatchRate: (matches.length - auto) / matches.length,
  };
}

export function runAutomaticMatching(input: {
  organizationId: string;
  userId: string;
  periodId: string;
}):
  | {
      period: ReconciliationPeriod;
      autoAccepted: readonly ReconciliationMatch[];
      suggestions: number;
      exceptions: number;
    }
  | { error: string } {
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

  const refreshed = refreshSuggestions({
    organizationId: input.organizationId,
    periodId: input.periodId,
  });
  if ("error" in refreshed) return refreshed;

  const rules = getMatchingRules(input.organizationId);
  const autoAccepted: ReconciliationMatch[] = [];

  for (const sug of refreshed.suggestions) {
    if (sug.confidence < rules.autoAcceptThreshold) continue;
    const match = upsertMatch({
      id: `rmatch:${randomUUID()}`,
      organizationId: input.organizationId,
      periodId: input.periodId,
      cardinality: sug.cardinality,
      status: "auto_accepted",
      confidence: sug.confidence,
      leftIds: sug.leftIds,
      leftType: sug.leftType,
      rightIds: sug.rightIds,
      rightType: sug.rightType,
      amount: 0,
      reasons: sug.reasons,
      createdAt: new Date().toISOString(),
      createdBy: input.userId,
      acceptedAt: new Date().toISOString(),
      acceptedBy: input.userId,
      automatic: true,
    });
    autoAccepted.push(match);
    publishReconciliationSignal({
      type: "reconciliation.auto_matched",
      organizationId: input.organizationId,
      periodId: input.periodId,
      actorUserId: input.userId,
      payload: {
        matchId: match.id,
        confidence: match.confidence,
        cardinality: match.cardinality,
      },
    });
  }

  for (const dup of refreshed.duplicates) {
    createException({
      organizationId: input.organizationId,
      userId: input.userId,
      periodId: input.periodId,
      kind: "duplicate",
      severity: "high",
      message: `Duplicate bank activity ${dup.a} / ${dup.b}`,
      relatedIds: [dup.a, dup.b],
    });
  }

  // Outstanding unmatched bank txns → missing / unknown exceptions
  const matchedBank = new Set(
    listMatches(input.organizationId, input.periodId)
      .filter((m) => m.status !== "rejected")
      .flatMap((m) => m.leftIds)
  );
  const txns = listTransactions(input.organizationId).filter(
    (t) =>
      t.bankAccountId === period.bankAccountId &&
      t.status !== "voided" &&
      !matchedBank.has(t.id)
  );
  for (const t of txns) {
    if (!t.vendorId && !t.customerId && !t.category) {
      createException({
        organizationId: input.organizationId,
        userId: input.userId,
        periodId: input.periodId,
        kind: t.direction === "out" ? "unknown_payee" : "unknown_payer",
        severity: "medium",
        message: `Unknown party: ${t.description}`,
        relatedIds: [t.id],
      });
    }
  }

  const variance = Math.abs(period.statementBalance - period.bookBalance);
  if (variance >= rules.largeVarianceAmount) {
    createException({
      organizationId: input.organizationId,
      userId: input.userId,
      periodId: input.periodId,
      kind: "large_variance",
      severity: "high",
      message: `Large variance ${variance} between statement and book`,
    });
  }

  // Keep non-auto suggestions for review
  clearSuggestions(input.periodId);
  for (const sug of refreshed.suggestions.filter(
    (s) => s.confidence < rules.autoAcceptThreshold
  )) {
    upsertSuggestion(sug);
  }

  const rates = recomputeRates(input.periodId, input.organizationId);
  const updated = upsertPeriod({
    ...period,
    status: "review",
    autoMatchRate: rates.autoMatchRate,
    manualMatchRate: rates.manualMatchRate,
  });

  recordReconciliationHistory({
    organizationId: input.organizationId,
    periodId: input.periodId,
    action: "automatic_matching",
    actorUserId: input.userId,
    previousState: period,
    currentState: {
      autoAccepted: autoAccepted.length,
      suggestions: listSuggestions(input.organizationId, input.periodId).length,
    },
  });

  return {
    period: updated,
    autoAccepted: Object.freeze(autoAccepted),
    suggestions: listSuggestions(input.organizationId, input.periodId).length,
    exceptions: listExceptions(input.organizationId, input.periodId).filter(
      (e) => e.open
    ).length,
  };
}

export function acceptSuggestedMatch(input: {
  organizationId: string;
  userId: string;
  periodId: string;
  suggestionId: string;
}): ReconciliationMatch | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "reconcile",
  });
  if ("error" in gate) return gate;
  const sug = listSuggestions(input.organizationId, input.periodId).find(
    (s) => s.id === input.suggestionId
  );
  if (!sug) return { error: "Suggestion not found." };
  return manualMatch({
    organizationId: input.organizationId,
    userId: input.userId,
    periodId: input.periodId,
    cardinality: sug.cardinality,
    leftIds: sug.leftIds,
    leftType: sug.leftType,
    rightIds: sug.rightIds,
    rightType: sug.rightType,
    confidence: sug.confidence,
    reasons: sug.reasons,
    automatic: false,
  });
}

export function manualMatch(input: {
  organizationId: string;
  userId: string;
  periodId: string;
  cardinality: MatchCardinality;
  leftIds: readonly string[];
  leftType: ReconciliationSideType;
  rightIds: readonly string[];
  rightType: ReconciliationSideType;
  amount?: number;
  confidence?: number;
  reasons?: readonly string[];
  automatic?: boolean;
}): ReconciliationMatch | { error: string } {
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
  if (input.leftIds.length === 0 || input.rightIds.length === 0) {
    return { error: "Both sides of the match are required." };
  }

  const match = upsertMatch({
    id: `rmatch:${randomUUID()}`,
    organizationId: input.organizationId,
    periodId: input.periodId,
    cardinality: input.cardinality,
    status: input.automatic ? "auto_accepted" : "accepted",
    confidence: input.confidence ?? (input.cardinality === "manual" ? 1 : 0.5),
    leftIds: Object.freeze([...input.leftIds]),
    leftType: input.leftType,
    rightIds: Object.freeze([...input.rightIds]),
    rightType: input.rightType,
    amount: input.amount ?? 0,
    reasons: Object.freeze([...(input.reasons ?? ["manual"])]),
    createdAt: new Date().toISOString(),
    createdBy: input.userId,
    acceptedAt: new Date().toISOString(),
    acceptedBy: input.userId,
    automatic: input.automatic ?? false,
  });

  const rates = recomputeRates(input.periodId, input.organizationId);
  upsertPeriod({
    ...period,
    status: period.status === "open" ? "matching" : period.status,
    autoMatchRate: rates.autoMatchRate,
    manualMatchRate: rates.manualMatchRate,
  });

  publishReconciliationSignal({
    type: input.automatic
      ? "reconciliation.auto_matched"
      : "reconciliation.manual_match",
    organizationId: input.organizationId,
    periodId: input.periodId,
    actorUserId: input.userId,
    payload: {
      matchId: match.id,
      cardinality: match.cardinality,
      automatic: match.automatic,
    },
  });
  recordReconciliationHistory({
    organizationId: input.organizationId,
    periodId: input.periodId,
    action: match.automatic ? "auto_matched" : "manual_match",
    actorUserId: input.userId,
    currentState: match,
  });
  return match;
}

export function postAdjustment(input: {
  organizationId: string;
  userId: string;
  periodId: string;
  kind: AdjustmentKind;
  amount: number;
  memo: string;
  createJournal?: boolean;
}): ReconciliationAdjustment | { error: string } {
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
  if (input.amount === 0) return { error: "Adjustment amount cannot be zero." };

  let journalEntryId: string | null = null;
  if (input.createJournal !== false && input.kind === "journal_entry") {
    const accounts = listAccounts(input.organizationId);
    const cash = accounts.find((a) => a.type === "asset");
    const expense = accounts.find((a) => a.type === "expense");
    if (cash && expense) {
      const je = createJournalEntry({
        organizationId: input.organizationId,
        userId: input.userId,
        description: `Reconciliation adjustment: ${input.memo}`,
        periodKey: period.periodKey,
        lines: [
          {
            accountId: cash.id,
            debit: input.amount > 0 ? Math.abs(input.amount) : 0,
            credit: input.amount < 0 ? Math.abs(input.amount) : 0,
          },
          {
            accountId: expense.id,
            debit: input.amount < 0 ? Math.abs(input.amount) : 0,
            credit: input.amount > 0 ? Math.abs(input.amount) : 0,
          },
        ],
      });
      if (!("error" in je)) journalEntryId = je.id;
    }
  }

  const adj = upsertAdjustment({
    id: `radj:${randomUUID()}`,
    organizationId: input.organizationId,
    periodId: input.periodId,
    kind: input.kind,
    amount: input.amount,
    currency: period.currency,
    memo: input.memo,
    journalEntryId,
    createdAt: new Date().toISOString(),
    createdBy: input.userId,
  });

  const bookBalance = period.bookBalance + input.amount;
  upsertPeriod({ ...period, bookBalance });

  publishReconciliationSignal({
    type: "reconciliation.adjustment_posted",
    organizationId: input.organizationId,
    periodId: input.periodId,
    actorUserId: input.userId,
    payload: {
      adjustmentId: adj.id,
      kind: adj.kind,
      amount: adj.amount,
      journalEntryId,
    },
  });
  recordReconciliationHistory({
    organizationId: input.organizationId,
    periodId: input.periodId,
    action: "adjustment_posted",
    actorUserId: input.userId,
    currentState: adj,
  });
  return adj;
}

export function finalizePeriod(input: {
  organizationId: string;
  userId: string;
  periodId: string;
}): ReconciliationPeriod | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "approve",
  });
  if ("error" in gate) return gate;
  const period = getPeriod(input.periodId);
  if (!period || period.organizationId !== input.organizationId) {
    return { error: "Period not found." };
  }
  const openEx = listExceptions(input.organizationId, input.periodId).filter(
    (e) => e.open
  );
  if (openEx.length > 0) {
    createException({
      organizationId: input.organizationId,
      userId: input.userId,
      periodId: input.periodId,
      kind: "policy_violation",
      severity: "high",
      message: "Cannot finalize with open exceptions",
    });
    return { error: "Resolve open exceptions before finalize." };
  }
  const approvals = listApprovals(input.organizationId, input.periodId);
  if (!approvals.some((a) => a.stage === "reconciler")) {
    createException({
      organizationId: input.organizationId,
      userId: input.userId,
      periodId: input.periodId,
      kind: "missing_approval",
      severity: "high",
      message: "Reconciler approval required before finalize",
    });
    return { error: "Reconciler approval required." };
  }
  const updated = upsertPeriod({
    ...period,
    status: "finalized",
    finalizedAt: new Date().toISOString(),
  });
  recordReconciliationHistory({
    organizationId: input.organizationId,
    periodId: input.periodId,
    action: "finalized",
    actorUserId: input.userId,
    previousState: period,
    currentState: updated,
  });
  return updated;
}

export function closePeriod(input: {
  organizationId: string;
  userId: string;
  periodId: string;
}): ReconciliationPeriod | { error: string } {
  const gate = requireClosePermission(input);
  if ("error" in gate) return gate;
  const period = getPeriod(input.periodId);
  if (!period || period.organizationId !== input.organizationId) {
    return { error: "Period not found." };
  }
  const approvals = listApprovals(input.organizationId, input.periodId);
  const fullyApproved = STAGE_ORDER.every((s) =>
    approvals.some((a) => a.stage === s)
  );
  if (period.status !== "finalized" && !fullyApproved) {
    return {
      error: "Period must be finalized (or fully approved) before close.",
    };
  }
  const openEx = listExceptions(input.organizationId, input.periodId).filter(
    (e) => e.open
  );
  if (openEx.length > 0) {
    return { error: "Cannot close with open exceptions." };
  }

  const updated = upsertPeriod({
    ...period,
    status: "closed",
    closedAt: new Date().toISOString(),
    closedBy: input.userId,
  });
  publishReconciliationSignal({
    type: "reconciliation.period_closed",
    organizationId: input.organizationId,
    periodId: input.periodId,
    actorUserId: input.userId,
    payload: {
      periodKey: updated.periodKey,
      autoMatchRate: updated.autoMatchRate,
      manualMatchRate: updated.manualMatchRate,
    },
  });
  recordReconciliationHistory({
    organizationId: input.organizationId,
    periodId: input.periodId,
    action: "period_closed",
    actorUserId: input.userId,
    previousState: period,
    currentState: updated,
  });
  return updated;
}

export function reopenPeriod(input: {
  organizationId: string;
  userId: string;
  periodId: string;
}): ReconciliationPeriod | { error: string } {
  const gate = requireReopenPermission(input);
  if ("error" in gate) return gate;
  const period = getPeriod(input.periodId);
  if (!period || period.organizationId !== input.organizationId) {
    return { error: "Period not found." };
  }
  if (period.status !== "closed") {
    return { error: "Only closed periods can be reopened." };
  }
  const updated = upsertPeriod({
    ...period,
    status: "reopened",
    closedAt: null,
    closedBy: null,
  });
  recordReconciliationHistory({
    organizationId: input.organizationId,
    periodId: input.periodId,
    action: "period_reopened",
    actorUserId: input.userId,
    previousState: period,
    currentState: updated,
  });
  return updated;
}
