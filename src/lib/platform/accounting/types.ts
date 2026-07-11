/**
 * Accounting Intelligence Engine — shared types.
 *
 * Sprint 020 | ACCOUNTING_INTELLIGENCE_VERSION = "0.1.0"
 *
 * Architecture:
 *   Accounting records facts.
 *   Finance analyzes facts.
 *   Executive Intelligence interprets facts.
 *   JAG decides what to do.
 *
 * Immutable rule: accounting events are NEVER deleted — only reversed.
 */

import type { FinanceDimensionalContext, FinanceMoney } from "@/lib/platform/finance/types";
import type { IntelligenceMetadata } from "@/lib/platform/intelligence/types";

export const ACCOUNTING_INTELLIGENCE_VERSION = "0.1.0";

/** Opaque metadata bag — never use `any`. */
export type AccountingMetadata = IntelligenceMetadata;

/** Re-export dimensional context from Finance for composition. */
export type AccountingDimensionalContext = FinanceDimensionalContext;
export type AccountingMoney = FinanceMoney;

// ---------------------------------------------------------------------------
// Periods
// ---------------------------------------------------------------------------

export const ACCOUNTING_PERIOD_STATUSES = [
  "open",
  "soft_close",
  "hard_close",
  "locked",
  "reopened",
  "year_end",
] as const;
export type AccountingPeriodStatus =
  (typeof ACCOUNTING_PERIOD_STATUSES)[number];

export const ACCOUNTING_PERIOD_FREQUENCIES = [
  "monthly",
  "quarterly",
  "annual",
] as const;
export type AccountingPeriodFrequency =
  (typeof ACCOUNTING_PERIOD_FREQUENCIES)[number];

export const ACCOUNTING_FISCAL_CALENDAR_KINDS = [
  "calendar_year",
  "custom_fiscal_year",
] as const;
export type AccountingFiscalCalendarKind =
  (typeof ACCOUNTING_FISCAL_CALENDAR_KINDS)[number];

export interface AccountingFiscalCalendar {
  readonly id: string;
  readonly name: string;
  readonly kind: AccountingFiscalCalendarKind;
  /** Month (1–12) when the fiscal year starts. Calendar year = 1. */
  readonly fiscalYearStartMonth: number;
  readonly createdAt: string;
  readonly metadata?: AccountingMetadata;
}

export interface AccountingPeriod {
  readonly id: string;
  readonly calendarId: string;
  readonly name: string;
  readonly fiscalYear: number;
  readonly frequency: AccountingPeriodFrequency;
  readonly periodNumber: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: AccountingPeriodStatus;
  readonly reopenedApprovalId: string | null;
  readonly closedAt: string | null;
  readonly closedBy: string | null;
  readonly createdAt: string;
  readonly metadata?: AccountingMetadata;
}

// ---------------------------------------------------------------------------
// Journal types
// ---------------------------------------------------------------------------

export const ACCOUNTING_JOURNAL_TYPES = [
  "general",
  "payroll",
  "cash",
  "grant",
  "scholarship",
  "depreciation",
  "allocation",
  "reclassification",
  "adjustment",
  "closing",
  "opening",
  "intercompany",
] as const;
export type AccountingJournalType = (typeof ACCOUNTING_JOURNAL_TYPES)[number];

export const ACCOUNTING_JOURNAL_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "posted",
  "reversed",
  "rejected",
] as const;
export type AccountingJournalStatus =
  (typeof ACCOUNTING_JOURNAL_STATUSES)[number];

export interface AccountingJournalLine {
  readonly id: string;
  readonly accountId: string;
  readonly debit: number;
  readonly credit: number;
  readonly dimensions: AccountingDimensionalContext;
  readonly memo: string;
}

export interface AccountingJournal {
  readonly id: string;
  readonly journalNumber: string;
  readonly journalType: AccountingJournalType;
  readonly status: AccountingJournalStatus;
  readonly periodId: string;
  readonly memo: string;
  readonly currency: string;
  readonly lines: readonly AccountingJournalLine[];
  readonly dimensions: AccountingDimensionalContext;
  readonly reason: string | null;
  readonly evidenceRef: string | null;
  readonly approvalRef: string | null;
  readonly sourceTransactionId: string | null;
  readonly workflowRef: string | null;
  readonly recommendationRef: string | null;
  readonly governanceDecisionRef: string | null;
  readonly financeJournalId: string | null;
  readonly reversedById: string | null;
  readonly reversesId: string | null;
  readonly fingerprint: string;
  readonly createdBy: string | null;
  readonly postedBy: string | null;
  readonly createdAt: string;
  readonly postedAt: string | null;
  readonly metadata?: AccountingMetadata;
}

export interface AccountingRecurringJournal {
  readonly id: string;
  readonly name: string;
  readonly journalType: AccountingJournalType;
  readonly template: {
    readonly memo: string;
    readonly currency: string;
    readonly lines: readonly Omit<AccountingJournalLine, "id">[];
    readonly dimensions: AccountingDimensionalContext;
  };
  readonly intervalDays: number;
  readonly nextPostDate: string;
  readonly lastPostedAt: string | null;
  readonly active: boolean;
  readonly createdAt: string;
  readonly metadata?: AccountingMetadata;
}

export interface AccountingScheduledPosting {
  readonly id: string;
  readonly journalId: string;
  readonly scheduledFor: string;
  readonly status: "pending" | "posted" | "cancelled" | "failed";
  readonly postedAt: string | null;
  readonly error: string | null;
  readonly createdAt: string;
}

// ---------------------------------------------------------------------------
// Accruals
// ---------------------------------------------------------------------------

export const ACCOUNTING_ACCRUAL_KINDS = [
  "revenue",
  "expense",
  "interest",
  "payroll",
  "grant",
] as const;
export type AccountingAccrualKind = (typeof ACCOUNTING_ACCRUAL_KINDS)[number];

export interface AccountingAccrual {
  readonly id: string;
  readonly kind: AccountingAccrualKind;
  readonly description: string;
  readonly amount: number;
  readonly currency: string;
  readonly debitAccountId: string;
  readonly creditAccountId: string;
  readonly periodId: string;
  readonly autoReverse: boolean;
  readonly reversed: boolean;
  readonly journalId: string | null;
  readonly reversalJournalId: string | null;
  readonly dimensions: AccountingDimensionalContext;
  readonly createdAt: string;
  readonly metadata?: AccountingMetadata;
}

// ---------------------------------------------------------------------------
// Deferrals
// ---------------------------------------------------------------------------

export const ACCOUNTING_DEFERRAL_KINDS = ["revenue", "expense"] as const;
export type AccountingDeferralKind = (typeof ACCOUNTING_DEFERRAL_KINDS)[number];

export interface AccountingDeferralScheduleEntry {
  readonly periodId: string;
  readonly amount: number;
  readonly recognized: boolean;
  readonly recognizedAt: string | null;
  readonly journalId: string | null;
}

export interface AccountingDeferral {
  readonly id: string;
  readonly kind: AccountingDeferralKind;
  readonly description: string;
  readonly totalAmount: number;
  readonly remainingBalance: number;
  readonly currency: string;
  readonly deferralAccountId: string;
  readonly recognitionAccountId: string;
  readonly schedule: readonly AccountingDeferralScheduleEntry[];
  readonly dimensions: AccountingDimensionalContext;
  readonly createdAt: string;
  readonly metadata?: AccountingMetadata;
}

// ---------------------------------------------------------------------------
// Allocations
// ---------------------------------------------------------------------------

export const ACCOUNTING_ALLOCATION_BASES = [
  "department",
  "campus",
  "program",
  "grant",
  "scholarship",
  "cost_center",
  "square_footage",
  "headcount",
  "enrollment",
  "custom",
] as const;
export type AccountingAllocationBase =
  (typeof ACCOUNTING_ALLOCATION_BASES)[number];

export interface AccountingAllocationTarget {
  readonly targetId: string;
  readonly label: string;
  readonly weight: number;
  readonly dimensions: AccountingDimensionalContext;
}

export interface AccountingAllocation {
  readonly id: string;
  readonly name: string;
  readonly base: AccountingAllocationBase;
  readonly sourceAccountId: string;
  readonly amount: number;
  readonly currency: string;
  readonly targets: readonly AccountingAllocationTarget[];
  readonly periodId: string;
  readonly journalId: string | null;
  readonly dimensions: AccountingDimensionalContext;
  readonly createdAt: string;
  readonly metadata?: AccountingMetadata;
}

// ---------------------------------------------------------------------------
// Reclassifications
// ---------------------------------------------------------------------------

export const ACCOUNTING_RECLASS_SCOPES = [
  "department",
  "account",
  "grant",
  "campus",
  "program",
] as const;
export type AccountingReclassScope = (typeof ACCOUNTING_RECLASS_SCOPES)[number];

export interface AccountingReclassification {
  readonly id: string;
  readonly scope: AccountingReclassScope;
  readonly reason: string;
  readonly amount: number;
  readonly currency: string;
  readonly fromAccountId: string;
  readonly toAccountId: string;
  readonly fromDimensions: AccountingDimensionalContext;
  readonly toDimensions: AccountingDimensionalContext;
  readonly periodId: string;
  readonly journalId: string | null;
  readonly evidenceRef: string | null;
  readonly approvalRef: string | null;
  readonly createdBy: string | null;
  readonly createdAt: string;
  readonly metadata?: AccountingMetadata;
}

// ---------------------------------------------------------------------------
// Adjustments
// ---------------------------------------------------------------------------

export interface AccountingAdjustment {
  readonly id: string;
  readonly description: string;
  readonly reason: string;
  readonly amount: number;
  readonly currency: string;
  readonly debitAccountId: string;
  readonly creditAccountId: string;
  readonly periodId: string;
  readonly journalId: string | null;
  readonly dimensions: AccountingDimensionalContext;
  readonly evidenceRef: string | null;
  readonly approvalRef: string | null;
  readonly createdBy: string | null;
  readonly createdAt: string;
  readonly metadata?: AccountingMetadata;
}

// ---------------------------------------------------------------------------
// Eliminations (consolidation)
// ---------------------------------------------------------------------------

export interface AccountingElimination {
  readonly id: string;
  readonly description: string;
  readonly amount: number;
  readonly currency: string;
  readonly debitAccountId: string;
  readonly creditAccountId: string;
  readonly entityFromId: string;
  readonly entityToId: string;
  readonly periodId: string;
  readonly journalId: string | null;
  readonly createdAt: string;
  readonly metadata?: AccountingMetadata;
}

// ---------------------------------------------------------------------------
// Close process
// ---------------------------------------------------------------------------

export const ACCOUNTING_CLOSE_KINDS = [
  "month",
  "quarter",
  "year_end",
] as const;
export type AccountingCloseKind = (typeof ACCOUNTING_CLOSE_KINDS)[number];

export const ACCOUNTING_CLOSE_STATUSES = [
  "in_progress",
  "pending_approval",
  "pending_board_signoff",
  "completed",
  "blocked",
] as const;
export type AccountingCloseStatus = (typeof ACCOUNTING_CLOSE_STATUSES)[number];

export interface AccountingCloseChecklistItem {
  readonly id: string;
  readonly label: string;
  readonly completed: boolean;
  readonly completedAt: string | null;
  readonly completedBy: string | null;
  readonly required: boolean;
}

export interface AccountingCloseProcess {
  readonly id: string;
  readonly kind: AccountingCloseKind;
  readonly periodId: string;
  readonly status: AccountingCloseStatus;
  readonly checklist: readonly AccountingCloseChecklistItem[];
  readonly outstandingItems: readonly string[];
  readonly missingReconciliations: readonly string[];
  readonly unpostedJournalIds: readonly string[];
  readonly approvalRef: string | null;
  readonly boardSignoffRef: string | null;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly metadata?: AccountingMetadata;
}

// ---------------------------------------------------------------------------
// Retained earnings / net assets
// ---------------------------------------------------------------------------

export const ACCOUNTING_NET_ASSET_CLASSES = [
  "unrestricted",
  "temporarily_restricted",
  "permanently_restricted",
  "restricted",
] as const;
export type AccountingNetAssetClass =
  (typeof ACCOUNTING_NET_ASSET_CLASSES)[number];

export interface AccountingRetainedEarningsEntry {
  readonly id: string;
  readonly fiscalYear: number;
  readonly periodId: string;
  readonly netIncome: number;
  readonly closingJournalId: string | null;
  readonly currency: string;
  readonly createdAt: string;
}

// ---------------------------------------------------------------------------
// Consolidation
// ---------------------------------------------------------------------------

export interface AccountingConsolidationEntity {
  readonly id: string;
  readonly name: string;
  readonly parentEntityId: string | null;
  readonly ownershipPercent: number;
  readonly active: boolean;
}

export interface AccountingConsolidationResult {
  readonly id: string;
  readonly periodId: string;
  readonly entityIds: readonly string[];
  readonly eliminationIds: readonly string[];
  readonly totalAssets: number;
  readonly totalLiabilities: number;
  readonly totalEquity: number;
  readonly currency: string;
  readonly generatedAt: string;
}

// ---------------------------------------------------------------------------
// Financial statements
// ---------------------------------------------------------------------------

export const ACCOUNTING_STATEMENT_KINDS = [
  "balance_sheet",
  "income_statement",
  "statement_of_activities",
  "statement_of_cash_flows",
  "statement_of_functional_expenses",
  "trial_balance",
  "comparative",
  "budget_vs_actual",
  "department",
  "campus",
  "grant",
  "scholarship",
] as const;
export type AccountingStatementKind =
  (typeof ACCOUNTING_STATEMENT_KINDS)[number];

export interface AccountingStatementLine {
  readonly accountId: string | null;
  readonly label: string;
  readonly amount: number;
  readonly section: string;
  readonly indent: number;
}

export interface AccountingFinancialStatement {
  readonly id: string;
  readonly kind: AccountingStatementKind;
  readonly title: string;
  readonly periodId: string;
  readonly asOfDate: string;
  readonly currency: string;
  readonly lines: readonly AccountingStatementLine[];
  readonly totals: Readonly<Record<string, number>>;
  readonly comparativePeriodId: string | null;
  readonly dimensionFilter: AccountingDimensionalContext | null;
  readonly generatedAt: string;
  readonly metadata?: AccountingMetadata;
}

// ---------------------------------------------------------------------------
// Disclosures
// ---------------------------------------------------------------------------

export interface AccountingDisclosure {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly statementKind: AccountingStatementKind | null;
  readonly periodId: string;
  readonly required: boolean;
  readonly createdAt: string;
  readonly metadata?: AccountingMetadata;
}

// ---------------------------------------------------------------------------
// Nonprofit / fund accounting
// ---------------------------------------------------------------------------

export interface AccountingFund {
  readonly id: string;
  readonly name: string;
  readonly netAssetClass: AccountingNetAssetClass;
  readonly grantId: string | null;
  readonly donorRestriction: string | null;
  readonly balance: number;
  readonly currency: string;
  readonly dimensions: AccountingDimensionalContext;
  readonly createdAt: string;
  readonly metadata?: AccountingMetadata;
}

// ---------------------------------------------------------------------------
// GAAP / Controls
// ---------------------------------------------------------------------------

export interface AccountingGaapValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export interface AccountingPostingPermission {
  readonly actorId: string;
  readonly canDraft: boolean;
  readonly canPost: boolean;
  readonly canReverse: boolean;
  readonly canClose: boolean;
  readonly canReopen: boolean;
  readonly canApprove: boolean;
}

export interface AccountingSeparationOfDutiesRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly preparerCannotApprove: boolean;
  readonly posterCannotApprove: boolean;
  readonly active: boolean;
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export const ACCOUNTING_AUDIT_EVENT_KINDS = [
  "period",
  "journal",
  "posting",
  "reversal",
  "accrual",
  "deferral",
  "allocation",
  "reclassification",
  "adjustment",
  "elimination",
  "close",
  "reconciliation",
  "statement",
  "control",
  "approval",
  "export",
] as const;
export type AccountingAuditEventKind =
  (typeof ACCOUNTING_AUDIT_EVENT_KINDS)[number];

export interface AccountingAuditEvent {
  readonly id: string;
  readonly kind: AccountingAuditEventKind;
  readonly entityId: string;
  readonly entityType: string;
  readonly action: string;
  readonly actorId: string | null;
  readonly reason: string | null;
  readonly approvalRef: string | null;
  readonly evidenceRef: string | null;
  readonly sourceTransactionId: string | null;
  readonly workflowRef: string | null;
  readonly recommendationRef: string | null;
  readonly governanceDecisionRef: string | null;
  readonly timestamp: string;
  readonly dimensions: AccountingDimensionalContext;
  readonly details: Readonly<Record<string, unknown>>;
  readonly metadata?: AccountingMetadata;
}

// ---------------------------------------------------------------------------
// Reconciliation
// ---------------------------------------------------------------------------

export const ACCOUNTING_RECONCILIATION_STATUSES = [
  "open",
  "in_progress",
  "reconciled",
  "exception",
] as const;
export type AccountingReconciliationStatus =
  (typeof ACCOUNTING_RECONCILIATION_STATUSES)[number];

export interface AccountingReconciliation {
  readonly id: string;
  readonly accountId: string;
  readonly periodId: string;
  readonly status: AccountingReconciliationStatus;
  readonly bookBalance: number;
  readonly externalBalance: number;
  readonly difference: number;
  readonly notes: string;
  readonly reconciledBy: string | null;
  readonly reconciledAt: string | null;
  readonly createdAt: string;
  readonly metadata?: AccountingMetadata;
}

// ---------------------------------------------------------------------------
// Reporting / Exports / Executive integration
// ---------------------------------------------------------------------------

export interface AccountingReport {
  readonly id: string;
  readonly title: string;
  readonly periodId: string;
  readonly statementIds: readonly string[];
  readonly generatedAt: string;
  readonly metadata?: AccountingMetadata;
}

export interface AccountingExportPackage {
  readonly id: string;
  readonly format: "json" | "csv_summary";
  readonly periodId: string;
  readonly exportedAt: string;
  readonly journalCount: number;
  readonly statementCount: number;
  readonly payload: Readonly<Record<string, unknown>>;
}

/** Standardized output for Financial Intelligence consumption. */
export interface AccountingFactsForFinance {
  readonly asOfDate: string;
  readonly currency: string;
  readonly periodId: string | null;
  readonly trialBalanceBalanced: boolean;
  readonly totalDebits: number;
  readonly totalCredits: number;
  readonly postedJournalCount: number;
  readonly openPeriodCount: number;
  readonly lockedPeriodCount: number;
  readonly outstandingReconciliations: number;
  readonly netIncome: number;
  readonly totalAssets: number;
  readonly totalLiabilities: number;
  readonly totalEquity: number;
  readonly netAssetsByClass: Readonly<Record<AccountingNetAssetClass, number>>;
}

/** Standardized output for Executive Intelligence. */
export interface AccountingFactsForExecutive {
  readonly asOfDate: string;
  readonly closeStatus: AccountingCloseStatus | null;
  readonly periodsLocked: number;
  readonly unpostedJournals: number;
  readonly missingReconciliations: number;
  readonly gaapViolations: number;
  readonly boardSignoffPending: boolean;
  readonly netIncome: number;
  readonly cashPosition: number;
}

/** Standardized output for Governance / Autonomy / Workflow / Twin / Memory. */
export interface AccountingIntegrationLinks {
  readonly auditEventCount: number;
  readonly pendingApprovals: number;
  readonly linkedWorkflows: readonly string[];
  readonly linkedRecommendations: readonly string[];
  readonly linkedGovernanceDecisions: readonly string[];
  readonly evidenceRefs: readonly string[];
}

export interface AccountingEngineCycleResult {
  readonly cycleId: string;
  readonly ranAt: string;
  readonly modulesProcessed: readonly string[];
  readonly auditEvents: number;
  readonly factsForFinance: AccountingFactsForFinance;
  readonly factsForExecutive: AccountingFactsForExecutive;
  readonly integration: AccountingIntegrationLinks;
}
