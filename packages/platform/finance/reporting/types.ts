/**
 * P-012 — Financial reporting types.
 * AI CFO / EBITDA calculations / valuation are out of scope.
 */

export type StatementKind =
  | "balance_sheet"
  | "income_statement"
  | "cash_flow"
  | "equity_changes"
  | "trial_balance"
  | "general_ledger"
  | "account_activity";

export type ReportScope =
  | "entity"
  | "consolidated"
  | "department"
  | "division"
  | "program"
  | "campus"
  | "project"
  | "grant"
  | "fund"
  | "cost_center"
  | "class"
  | "custom";

export type ExportFormat = "pdf" | "excel" | "csv" | "json" | "api";

export type DimensionDefinition = {
  readonly id: string;
  readonly organizationId: string;
  readonly key: string;
  readonly label: string;
  readonly active: boolean;
  readonly createdAt: string;
};

export type DimensionValue = {
  readonly id: string;
  readonly organizationId: string;
  readonly dimensionId: string;
  readonly code: string;
  readonly label: string;
  readonly active: boolean;
  readonly createdAt: string;
};

/** Tag any finance record with unlimited reporting dimensions (nothing hardcoded). */
export type DimensionTag = {
  readonly id: string;
  readonly organizationId: string;
  readonly recordType: string;
  readonly recordId: string;
  readonly dimensionKey: string;
  readonly dimensionValueCode: string;
  readonly createdAt: string;
};

export type StatementLine = {
  readonly accountId: string | null;
  readonly accountNumber: string | null;
  readonly label: string;
  readonly amount: number;
  readonly section: string;
  /** Drill-down to source journals / invoices / bills. */
  readonly sourceRefs: readonly {
    readonly recordType: string;
    readonly recordId: string;
  }[];
};

export type FinancialStatement = {
  readonly id: string;
  readonly organizationId: string;
  readonly kind: StatementKind;
  readonly periodKey: string;
  readonly comparePeriodKey: string | null;
  readonly scope: ReportScope;
  readonly scopeId: string | null;
  readonly dimensionFilters: Readonly<Record<string, string>>;
  readonly lines: readonly StatementLine[];
  readonly totals: Readonly<Record<string, number>>;
  readonly generatedAt: string;
  readonly generatedBy: string;
  readonly comparative: boolean;
};

export type VarianceReport = {
  readonly id: string;
  readonly organizationId: string;
  readonly mode:
    | "budget_vs_actual"
    | "forecast_vs_actual"
    | "prior_year"
    | "prior_period";
  readonly periodKey: string;
  readonly rows: readonly {
    readonly label: string;
    readonly baseline: number;
    readonly actual: number;
    readonly dollarVariance: number;
    readonly percentVariance: number | null;
  }[];
  readonly generatedAt: string;
};

export type ExecutiveKpis = {
  readonly organizationId: string;
  readonly generatedAt: string;
  readonly revenue: number;
  readonly expenses: number;
  readonly operatingMargin: number | null;
  readonly netIncome: number;
  readonly cash: number;
  readonly ar: number;
  readonly ap: number;
  readonly collections: number;
  readonly vendorSpend: number;
  readonly enrollmentRevenue: number;
  readonly grantRevenue: number;
  readonly scholarshipRevenue: number;
  readonly programRevenue: number;
  readonly custom: Readonly<Record<string, number>>;
  /** Placeholder only — no EBITDA calculation in P-012. */
  readonly ebitdaPlaceholder: null;
};

export type ReportingDashboard = {
  readonly id: string;
  readonly organizationId: string;
  readonly kind:
    | "executive"
    | "finance"
    | "department"
    | "program"
    | "campus"
    | "grant"
    | "project";
  readonly scopeId: string | null;
  readonly kpis: ExecutiveKpis;
  readonly statementSummaries: readonly {
    readonly kind: StatementKind;
    readonly total: number;
  }[];
  readonly drillDownReady: true;
  readonly generatedAt: string;
};

export type ReportExport = {
  readonly id: string;
  readonly organizationId: string;
  readonly format: ExportFormat;
  readonly sourceType: string;
  readonly sourceId: string;
  readonly content: string;
  readonly createdAt: string;
};

export const REPORTING_GUARDS = Object.freeze({
  financialReporting: true,
  consumesFinanceEngine: true,
  includesAiCfo: false,
  includesEbitdaCalculations: false,
  includesCashRunway: false,
  includesValuation: false,
  includesBoardNarrative: false,
  ebitdaPlaceholderOnly: true,
});
