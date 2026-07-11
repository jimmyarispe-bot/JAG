/**
 * Accounting Intelligence Engine — Public API.
 *
 * Sprint 020 | ACCOUNTING_INTELLIGENCE_VERSION = "0.1.0"
 *
 * Import path: @/lib/platform/accounting
 *
 * Accounting records facts.
 * Finance analyzes facts.
 * Executive Intelligence interprets facts.
 * JAG decides what to do.
 */

export {
  ACCOUNTING_INTELLIGENCE_VERSION,
  ACCOUNTING_PERIOD_STATUSES,
  ACCOUNTING_PERIOD_FREQUENCIES,
  ACCOUNTING_FISCAL_CALENDAR_KINDS,
  ACCOUNTING_JOURNAL_TYPES,
  ACCOUNTING_JOURNAL_STATUSES,
  ACCOUNTING_ACCRUAL_KINDS,
  ACCOUNTING_DEFERRAL_KINDS,
  ACCOUNTING_ALLOCATION_BASES,
  ACCOUNTING_RECLASS_SCOPES,
  ACCOUNTING_CLOSE_KINDS,
  ACCOUNTING_CLOSE_STATUSES,
  ACCOUNTING_NET_ASSET_CLASSES,
  ACCOUNTING_STATEMENT_KINDS,
  ACCOUNTING_AUDIT_EVENT_KINDS,
  ACCOUNTING_RECONCILIATION_STATUSES,
  type AccountingMetadata,
  type AccountingDimensionalContext,
  type AccountingMoney,
  type AccountingPeriodStatus,
  type AccountingPeriodFrequency,
  type AccountingFiscalCalendarKind,
  type AccountingFiscalCalendar,
  type AccountingPeriod,
  type AccountingJournalType,
  type AccountingJournalStatus,
  type AccountingJournalLine,
  type AccountingJournal,
  type AccountingRecurringJournal,
  type AccountingScheduledPosting,
  type AccountingAccrualKind,
  type AccountingAccrual,
  type AccountingDeferralKind,
  type AccountingDeferralScheduleEntry,
  type AccountingDeferral,
  type AccountingAllocationBase,
  type AccountingAllocationTarget,
  type AccountingAllocation,
  type AccountingReclassScope,
  type AccountingReclassification,
  type AccountingAdjustment,
  type AccountingElimination,
  type AccountingCloseKind,
  type AccountingCloseStatus,
  type AccountingCloseChecklistItem,
  type AccountingCloseProcess,
  type AccountingNetAssetClass,
  type AccountingRetainedEarningsEntry,
  type AccountingConsolidationEntity,
  type AccountingConsolidationResult,
  type AccountingStatementKind,
  type AccountingStatementLine,
  type AccountingFinancialStatement,
  type AccountingDisclosure,
  type AccountingFund,
  type AccountingGaapValidationResult,
  type AccountingPostingPermission,
  type AccountingSeparationOfDutiesRule,
  type AccountingAuditEventKind,
  type AccountingAuditEvent,
  type AccountingReconciliationStatus,
  type AccountingReconciliation,
  type AccountingReport,
  type AccountingExportPackage,
  type AccountingFactsForFinance,
  type AccountingFactsForExecutive,
  type AccountingIntegrationLinks,
  type AccountingEngineCycleResult,
} from "@/lib/platform/accounting/types";

export {
  createAccountingId,
} from "@/lib/platform/accounting/ids";

export {
  AccountingPeriods,
  createAccountingPeriods,
  type AccountingPeriodsDependencies,
  type CreateFiscalCalendarInput,
  type CreatePeriodInput,
} from "@/lib/platform/accounting/periods";

export {
  AccountingAudit,
  createAccountingAudit,
  type AccountingAuditDependencies,
  type RecordAccountingAuditInput,
} from "@/lib/platform/accounting/audit";

export {
  AccountingGaap,
  createAccountingGaap,
  type AccountingGaapDependencies,
} from "@/lib/platform/accounting/gaap";

export {
  AccountingControls,
  createAccountingControls,
  type AccountingControlsDependencies,
  type GrantPermissionInput,
} from "@/lib/platform/accounting/controls";

export {
  AccountingPosting,
  createAccountingPosting,
  type AccountingPostingDependencies,
  type DraftJournalInput,
  type PostJournalOptions,
} from "@/lib/platform/accounting/posting";

export {
  AccountingJournals,
  createAccountingJournals,
  type AccountingJournalsDependencies,
} from "@/lib/platform/accounting/journals";

export {
  AccountingAccruals,
  createAccountingAccruals,
  type AccountingAccrualsDependencies,
  type CreateAccrualInput,
} from "@/lib/platform/accounting/accruals";

export {
  AccountingDeferrals,
  createAccountingDeferrals,
  type AccountingDeferralsDependencies,
  type CreateDeferralInput,
} from "@/lib/platform/accounting/deferrals";

export {
  AccountingAllocations,
  createAccountingAllocations,
  type AccountingAllocationsDependencies,
  type CreateAllocationInput,
} from "@/lib/platform/accounting/allocations";

export {
  AccountingReclassifications,
  createAccountingReclassifications,
  type AccountingReclassificationsDependencies,
  type CreateReclassificationInput,
} from "@/lib/platform/accounting/reclassifications";

export {
  AccountingAdjustments,
  createAccountingAdjustments,
  type AccountingAdjustmentsDependencies,
  type CreateAdjustmentInput,
} from "@/lib/platform/accounting/adjustments";

export {
  AccountingEliminations,
  createAccountingEliminations,
  type AccountingEliminationsDependencies,
  type CreateEliminationInput,
} from "@/lib/platform/accounting/eliminations";

export {
  AccountingRetainedEarnings,
  createAccountingRetainedEarnings,
  type AccountingRetainedEarningsDependencies,
  type CloseToRetainedEarningsInput,
} from "@/lib/platform/accounting/retained-earnings";

export {
  AccountingConsolidation,
  createAccountingConsolidation,
  type AccountingConsolidationDependencies,
} from "@/lib/platform/accounting/consolidation";

export {
  AccountingClose,
  createAccountingClose,
  type AccountingCloseDependencies,
} from "@/lib/platform/accounting/close";

export {
  AccountingReconciliationService,
  createAccountingReconciliation,
  type AccountingReconciliationDependencies,
  type StartReconciliationInput,
} from "@/lib/platform/accounting/reconciliation";

export {
  AccountingFinancialStatements,
  createAccountingFinancialStatements,
  type AccountingFinancialStatementsDependencies,
  type GenerateStatementInput,
} from "@/lib/platform/accounting/financial-statements";

export {
  AccountingDisclosures,
  createAccountingDisclosures,
  type AccountingDisclosuresDependencies,
} from "@/lib/platform/accounting/disclosures";

export {
  AccountingNonprofit,
  createAccountingNonprofit,
  type AccountingNonprofitDependencies,
  type CreateFundInput,
} from "@/lib/platform/accounting/nonprofit";

export {
  AccountingReporting,
  createAccountingReporting,
  type AccountingReportingDependencies,
} from "@/lib/platform/accounting/reporting";

export {
  AccountingExports,
  createAccountingExports,
  type AccountingExportsDependencies,
} from "@/lib/platform/accounting/exports";

export {
  AccountingEngine,
  createAccountingIntelligence,
  type AccountingEngineDependencies,
} from "@/lib/platform/accounting/engine";
