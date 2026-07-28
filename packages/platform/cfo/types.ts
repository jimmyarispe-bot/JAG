/**
 * JAG CFO™ — financial reasoning types (P-013).
 * AI recommends only; never modifies accounting records.
 */

export type MetricKey =
  | "revenue"
  | "gross_margin"
  | "operating_income"
  | "ebitda"
  | "adjusted_ebitda"
  | "net_income"
  | "cash"
  | "working_capital"
  | "current_ratio"
  | "quick_ratio"
  | "debt_ratio"
  | "ar_days"
  | "ap_days"
  | "cash_conversion_cycle"
  | "operating_margin";

export type MetricDefinition = {
  readonly key: MetricKey;
  readonly name: string;
  readonly definition: string;
  readonly formula: string;
  readonly dataLineage: readonly string[];
  readonly version: string;
  readonly dimensions: readonly string[];
};

export type MetricValue = {
  readonly key: MetricKey;
  readonly value: number | null;
  readonly currency: string;
  readonly periodKey: string;
  readonly sourceRefs: readonly {
    readonly recordType: string;
    readonly recordId: string;
  }[];
};

export type MetricSnapshot = {
  readonly organizationId: string;
  readonly periodKey: string;
  readonly generatedAt: string;
  readonly metrics: Readonly<Record<MetricKey, MetricValue>>;
};

export type EbitdaAdjustmentKind =
  | "recurring"
  | "one_time"
  | "owner_compensation"
  | "non_operating"
  | "depreciation"
  | "amortization"
  | "other";

export type EbitdaAdjustment = {
  readonly id: string;
  readonly organizationId: string;
  readonly kind: EbitdaAdjustmentKind;
  readonly label: string;
  readonly amount: number;
  readonly periodKey: string;
  readonly rationale: string;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly evidenceRefs: readonly {
    readonly recordType: string;
    readonly recordId: string;
  }[];
};

export type EbitdaReport = {
  readonly id: string;
  readonly organizationId: string;
  readonly periodKey: string;
  readonly ebitda: number;
  readonly adjustedEbitda: number;
  readonly normalizedEbitda: number;
  readonly operatingIncome: number;
  readonly depreciation: number;
  readonly amortization: number;
  readonly adjustments: readonly EbitdaAdjustment[];
  readonly generatedAt: string;
  readonly sourceRefs: readonly {
    readonly recordType: string;
    readonly recordId: string;
  }[];
};

export type RunwayScenario = "best_case" | "expected" | "worst_case";

export type CashRunwayReport = {
  readonly id: string;
  readonly organizationId: string;
  readonly periodKey: string;
  readonly currentCash: number;
  readonly availableCash: number;
  readonly monthlyBurn: number;
  readonly forecastBurn: number;
  readonly runwayMonths: number | null;
  readonly sensitivity: Readonly<
    Record<RunwayScenario, { burn: number; runwayMonths: number | null }>
  >;
  readonly generatedAt: string;
};

export type QoeReport = {
  readonly id: string;
  readonly organizationId: string;
  readonly periodKey: string;
  readonly revenueQualityScore: number;
  readonly expenseQualityScore: number;
  readonly recurringRevenueShare: number | null;
  readonly customerConcentration: number | null;
  readonly vendorConcentration: number | null;
  readonly riskFactors: readonly string[];
  readonly normalizationNotes: readonly string[];
  readonly generatedAt: string;
};

export type ValuationApproach =
  | "income"
  | "market_multiple"
  | "ebitda_multiple"
  | "dcf_placeholder"
  | "asset";

export type ValuationReport = {
  readonly id: string;
  readonly organizationId: string;
  readonly periodKey: string;
  readonly approach: ValuationApproach;
  readonly value: number | null;
  readonly multiple: number | null;
  readonly notes: string;
  readonly scenarioComparisons: readonly {
    readonly label: string;
    readonly value: number | null;
  }[];
  readonly generatedAt: string;
};

export type CfoScenarioKind =
  | "hiring"
  | "salary_changes"
  | "enrollment_changes"
  | "revenue_growth"
  | "expense_growth"
  | "acquisitions"
  | "capital_purchases"
  | "debt"
  | "grant_loss"
  | "scholarship_changes"
  | "custom";

export type CfoScenarioResult = {
  readonly id: string;
  readonly organizationId: string;
  readonly kind: CfoScenarioKind;
  readonly name: string;
  readonly assumptions: Readonly<Record<string, number | string | boolean>>;
  readonly projectedRevenue: number;
  readonly projectedExpenses: number;
  readonly projectedCash: number;
  readonly projectedEbitda: number | null;
  readonly impactSummary: string;
  readonly generatedAt: string;
  readonly generatedBy: string;
};

export type RecommendationKind =
  | "hiring_delay"
  | "hiring_expansion"
  | "cost_reduction"
  | "revenue_opportunity"
  | "pricing_change"
  | "program_expansion"
  | "capital_purchase"
  | "debt_reduction"
  | "grant_strategy"
  | "vendor_optimization"
  | "cash_preservation";

export type CfoRecommendation = {
  readonly id: string;
  readonly organizationId: string;
  readonly kind: RecommendationKind;
  readonly title: string;
  readonly summary: string;
  readonly supportingEvidence: readonly {
    readonly recordType: string;
    readonly recordId: string;
    readonly note: string;
  }[];
  readonly confidence: number;
  readonly financialImpact: number;
  readonly assumptions: readonly string[];
  readonly alternatives: readonly string[];
  readonly generatedAt: string;
};

export type BoardReport = {
  readonly id: string;
  readonly organizationId: string;
  readonly periodKey: string;
  readonly executiveSummary: string;
  readonly financialHighlights: readonly string[];
  readonly keyRisks: readonly string[];
  readonly strategicOpportunities: readonly string[];
  readonly cashPosition: number;
  readonly liquidityNotes: string;
  readonly budgetStatus: string;
  readonly forecastSummary: string;
  readonly varianceSummary: string;
  readonly recommendations: readonly CfoRecommendation[];
  readonly actionItems: readonly string[];
  readonly generatedAt: string;
};

export type CfoInsight = {
  readonly id: string;
  readonly organizationId: string;
  readonly kind:
    | "positive_trend"
    | "negative_trend"
    | "emerging_risk"
    | "emerging_opportunity"
    | "outlier"
    | "anomaly";
  readonly title: string;
  readonly detail: string;
  readonly metricKey: MetricKey | null;
  readonly evidenceRefs: readonly {
    readonly recordType: string;
    readonly recordId: string;
  }[];
  readonly generatedAt: string;
};

export type AssistantAnswer = {
  readonly id: string;
  readonly organizationId: string;
  readonly question: string;
  readonly answer: string;
  readonly citations: readonly {
    readonly recordType: string;
    readonly recordId: string;
  }[];
  readonly metricKeys: readonly MetricKey[];
  readonly generatedAt: string;
};

export type FinancialAnalysis = {
  readonly id: string;
  readonly organizationId: string;
  readonly periodKey: string;
  readonly trends: readonly string[];
  readonly historical: readonly string[];
  readonly comparative: readonly string[];
  readonly ratios: Readonly<Record<string, number | null>>;
  readonly liquidity: readonly string[];
  readonly profitability: readonly string[];
  readonly operational: readonly string[];
  readonly workingCapital: readonly string[];
  readonly capitalStructure: readonly string[];
  readonly generatedAt: string;
};

export const CFO_GUARDS = Object.freeze({
  financialReasoning: true,
  consumesFinanceEngine: true,
  consumesReportingEngine: true,
  consumesPlanningEngine: true,
  duplicatesLedger: false,
  duplicatesReporting: false,
  modifiesAccountingRecords: false,
  recommendsOnly: true,
  metricRegistryRequired: true,
});
