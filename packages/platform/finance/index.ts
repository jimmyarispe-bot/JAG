/**
 * JAG Finance™ — public platform entry (P-008–P-012).
 */

export const FINANCE_ID = "jag-finance" as const;
export const FINANCE_VERSION = "1.4.0" as const;

export const FINANCE_DESCRIPTOR = Object.freeze({
  id: FINANCE_ID,
  name: "JAG Finance™" as const,
  version: FINANCE_VERSION,
  type: "platform-capability" as const,
  description:
    "Canonical financial operating model for multi-entity ledger, treasury, reconciliation, revenue & payables, planning & reporting, budgets, and audit — foundation for CFO™ intelligence in P-013.",
});

export type {
  AccountType,
  AgingBucket,
  BankAccount,
  BankingAccountKind,
  BankStatementImport,
  Bill,
  Budget,
  CoaTemplateId,
  CustomerKind,
  EntityKind,
  FinanceCustomer,
  FinanceDashboard,
  FinanceEntity,
  FinanceRole,
  Invoice,
  JournalEntry,
  LedgerAccount,
  Vendor,
} from "./types";
export { COA_TEMPLATES, ACCOUNT_TYPES } from "./types";
export { resetFinanceStoreForTests } from "./store";
export { FINANCE_FOUNDATION_GUARDS } from "./core";
export { FinanceEngine, createFinanceEngine } from "./engine";
export {
  TreasuryEngine,
  createTreasuryEngine,
  TREASURY_GUARDS,
  resetBankingStoreForTests,
  cashPosition,
} from "./banking";
export type {
  BankConnection,
  BankInstitution,
  BankTransaction,
  BankTransactionStatus,
  BankingException,
  BankingNotification,
  CashPosition,
  ConnectionProvider,
  MatchCandidate,
  StatementImportBatch,
  TreasuryTransferKind,
  TreasuryTransferRequest,
} from "./banking/types";
export {
  ReconciliationEngine,
  createReconciliationEngine,
  RECONCILIATION_GUARDS,
  RECONCILIATION_SIGNAL_TYPES,
  resetReconciliationStoreForTests,
  reconciliationAnalytics,
  describeDigitalTwinSignals,
} from "./reconciliation";
export type {
  AdjustmentKind,
  ApproverStage,
  MatchCardinality,
  ReconciliationException,
  ReconciliationMatch,
  ReconciliationPeriod,
  ReconciliationSignalEvent,
  ReconciliationSignalEventType,
} from "./reconciliation";
export {
  RevenueEngine,
  createRevenueEngine,
  REVENUE_GUARDS,
  EDUCATION_FUNDING_PRESETS,
  resetRevenueStoreForTests,
} from "./revenue";
export type {
  BillingMode,
  CollectionStatus,
  ContractKind,
  FundingSource,
  FundingSourceKind,
  RevenueContract,
  Subscription,
} from "./revenue";
export {
  PayablesEngine,
  createPayablesEngine,
  PAYABLES_GUARDS,
  resetPayablesStoreForTests,
} from "./payables";
export type { PaymentMethod, PurchaseOrder, PurchaseRequest } from "./payables";
export {
  FinancialReportingEngine,
  createFinancialReportingEngine,
  REPORTING_GUARDS,
  resetReportingStoreForTests,
  buildFinanceDashboard,
  trialBalanceHint,
  generateStatement,
  trialBalance,
  computeAccountBalances,
  computeVariance,
  buildExecutiveKpis,
  buildReportingDashboard,
} from "./reporting";
export type {
  ExecutiveKpis,
  FinancialStatement,
  ReportScope,
  ReportingDashboard,
  StatementKind,
  VarianceReport,
} from "./reporting";
export {
  FinancialPlanningEngine,
  createFinancialPlanningEngine,
  PLANNING_GUARDS,
  resetPlanningStoreForTests,
  createPlanningBudget,
  createForecast,
  createScenario,
  listForecasts,
  listPlanningBudgets,
} from "./planning";
export type {
  BudgetHorizon,
  BudgetKind,
  Forecast,
  ForecastMethod,
  PlanningBudget,
  Scenario,
  ScenarioKind,
} from "./planning";
export {
  listBills,
  listInvoices,
  listPayments,
  listBudgets,
  listAccounts,
  listJournals,
  listCustomers,
  listVendors,
} from "./store";
export { cashBalances } from "./treasury";
export {
  publishOperationalFinanceEvent,
  listOperationalEvents,
  listTwinProjections,
  listEvidenceRecords,
  listMemoryRecords,
  OPERATIONAL_SINKS,
  resetFinanceOpsStoreForTests,
} from "./operations/events";
