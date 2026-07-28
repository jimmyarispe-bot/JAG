/**
 * P-010 — JAG Reconciliation™ types.
 * Financial statements / forecasting / AI CFO / EBITDA are out of scope.
 */

import type { CurrencyCode } from "../types";

export type ReconciliationAccountKind =
  | "bank"
  | "checking"
  | "savings"
  | "money_market"
  | "credit_card"
  | "loan"
  | "line_of_credit"
  | "investment"
  | "petty_cash"
  | "escrow"
  | "trust"
  | "intercompany"
  | "restricted_cash"
  | "cash";

export type MatchCardinality =
  | "one_to_one"
  | "one_to_many"
  | "many_to_one"
  | "many_to_many"
  | "split"
  | "partial"
  | "manual";

export type ReconciliationPeriodCadence =
  | "monthly"
  | "quarterly"
  | "annual";

export type ReconciliationPeriodScope =
  | "entity"
  | "department"
  | "program"
  | "project"
  | "organization";

export type ReconciliationPeriodStatus =
  | "open"
  | "matching"
  | "review"
  | "pending_approval"
  | "finalized"
  | "closed"
  | "reopened";

export type ReconciliationMatchStatus =
  | "suggested"
  | "accepted"
  | "rejected"
  | "auto_accepted";

export type ReconciliationExceptionKind =
  | "missing_transaction"
  | "duplicate"
  | "amount_mismatch"
  | "date_mismatch"
  | "unknown_payee"
  | "unknown_payer"
  | "large_variance"
  | "policy_violation"
  | "missing_approval";

export type AdjustmentKind =
  | "journal_entry"
  | "correction"
  | "write_off"
  | "bank_fee"
  | "interest"
  | "fx"
  | "miscellaneous";

export type ApproverStage =
  | "reconciler"
  | "controller"
  | "finance_manager"
  | "cfo";

export type ReconciliationSideType =
  | "bank_transaction"
  | "statement_line"
  | "journal_entry"
  | "invoice"
  | "bill"
  | "payment"
  | "transfer"
  | "adjustment";

export type ReconciliationPeriod = {
  readonly id: string;
  readonly organizationId: string;
  readonly bankAccountId: string;
  readonly accountKind: ReconciliationAccountKind;
  readonly cadence: ReconciliationPeriodCadence;
  readonly scope: ReconciliationPeriodScope;
  readonly scopeId: string | null;
  readonly periodKey: string;
  readonly status: ReconciliationPeriodStatus;
  readonly statementBalance: number;
  readonly bookBalance: number;
  readonly currency: CurrencyCode;
  readonly openedAt: string;
  readonly openedBy: string;
  readonly closedAt: string | null;
  readonly closedBy: string | null;
  readonly finalizedAt: string | null;
  readonly statementImportId: string | null;
  readonly autoMatchRate: number;
  readonly manualMatchRate: number;
};

export type ReconciliationMatch = {
  readonly id: string;
  readonly organizationId: string;
  readonly periodId: string;
  readonly cardinality: MatchCardinality;
  readonly status: ReconciliationMatchStatus;
  readonly confidence: number;
  readonly leftIds: readonly string[];
  readonly leftType: ReconciliationSideType;
  readonly rightIds: readonly string[];
  readonly rightType: ReconciliationSideType;
  readonly amount: number;
  readonly reasons: readonly string[];
  readonly createdAt: string;
  readonly createdBy: string;
  readonly acceptedAt: string | null;
  readonly acceptedBy: string | null;
  readonly automatic: boolean;
};

export type ReconciliationException = {
  readonly id: string;
  readonly organizationId: string;
  readonly periodId: string;
  readonly kind: ReconciliationExceptionKind;
  readonly severity: "low" | "medium" | "high";
  readonly message: string;
  readonly relatedIds: readonly string[];
  readonly open: boolean;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
  readonly resolvedBy: string | null;
};

export type ReconciliationAdjustment = {
  readonly id: string;
  readonly organizationId: string;
  readonly periodId: string;
  readonly kind: AdjustmentKind;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly memo: string;
  readonly journalEntryId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type ReconciliationApproval = {
  readonly id: string;
  readonly organizationId: string;
  readonly periodId: string;
  readonly stage: ApproverStage;
  readonly approvedBy: string;
  readonly approvedAt: string;
  readonly note: string | null;
};

export type ReconciliationHistoryEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly periodId: string;
  readonly action: string;
  readonly actorUserId: string;
  readonly at: string;
  readonly previousState: unknown;
  readonly currentState: unknown;
};

export type MatchSuggestion = {
  readonly id: string;
  readonly organizationId: string;
  readonly periodId: string;
  readonly cardinality: MatchCardinality;
  readonly confidence: number;
  readonly leftIds: readonly string[];
  readonly leftType: ReconciliationSideType;
  readonly rightIds: readonly string[];
  readonly rightType: ReconciliationSideType;
  readonly reasons: readonly string[];
  readonly createdAt: string;
};

export type ReconciliationAnalytics = {
  readonly organizationId: string;
  readonly generatedAt: string;
  readonly openPeriods: number;
  readonly closedPeriods: number;
  readonly outstandingTransactions: number;
  readonly openExceptions: number;
  readonly exceptionAgingDays: readonly {
    bucket: "0-7" | "8-30" | "31+";
    count: number;
  }[];
  readonly autoMatchPercent: number;
  readonly manualMatchPercent: number;
  readonly averageCompletionHours: number | null;
  readonly byStatus: readonly {
    status: ReconciliationPeriodStatus;
    count: number;
  }[];
};

/** Digital Twin / OIOS signal events from reconciliation. */
export type ReconciliationSignalEventType =
  | "reconciliation.period_opened"
  | "reconciliation.auto_matched"
  | "reconciliation.manual_match"
  | "reconciliation.exception_created"
  | "reconciliation.adjustment_posted"
  | "reconciliation.period_closed";

export type ReconciliationSignalEvent = {
  readonly id: string;
  readonly type: ReconciliationSignalEventType;
  readonly organizationId: string;
  readonly periodId: string | null;
  readonly occurredAt: string;
  readonly actorUserId: string | null;
  readonly payload: Readonly<Record<string, unknown>>;
};

export const RECONCILIATION_GUARDS = Object.freeze({
  reconciliationOnly: true,
  includesReconciliation: true,
  includesFinancialStatements: false,
  includesForecasting: false,
  includesAiCfo: false,
  includesEbitda: false,
  digitalTwinSignalSource: true,
});

export const RECONCILIATION_SIGNAL_TYPES = Object.freeze([
  "reconciliation.period_opened",
  "reconciliation.auto_matched",
  "reconciliation.manual_match",
  "reconciliation.exception_created",
  "reconciliation.adjustment_posted",
  "reconciliation.period_closed",
] as const satisfies readonly ReconciliationSignalEventType[]);
