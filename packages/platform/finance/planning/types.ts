/**
 * P-012 — Financial planning types.
 * No AI recommendations / cash runway / valuation.
 */

export type BudgetHorizon =
  | "annual"
  | "quarterly"
  | "monthly"
  | "rolling";

export type BudgetKind =
  | "operating"
  | "capital"
  | "department"
  | "program"
  | "project"
  | "grant";

export type ForecastMethod =
  | "rolling"
  | "bottom_up"
  | "top_down"
  | "department"
  | "revenue"
  | "expense"
  | "cash_placeholder";

export type ScenarioKind =
  | "best_case"
  | "expected"
  | "worst_case"
  | "custom";

export type PlanningBudget = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly horizon: BudgetHorizon;
  readonly kind: BudgetKind;
  readonly scope: string;
  readonly scopeId: string | null;
  readonly periodKey: string;
  readonly version: number;
  readonly parentBudgetId: string | null;
  readonly foundationBudgetId: string | null;
  readonly lines: readonly {
    readonly accountId: string;
    readonly amount: number;
    readonly dimensionFilters?: Readonly<Record<string, string>>;
  }[];
  readonly scenarioKey: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type PlanningAssumption = {
  readonly id: string;
  readonly organizationId: string;
  readonly key: string;
  readonly label: string;
  readonly value: number | string | boolean;
  readonly version: number;
  readonly scenarioId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type Forecast = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly method: ForecastMethod;
  readonly periodKey: string;
  readonly version: number;
  readonly lines: readonly {
    readonly label: string;
    readonly amount: number;
    readonly accountId: string | null;
  }[];
  readonly scenarioId: string | null;
  /** Cash forecast is placeholder only in P-012. */
  readonly cashPlaceholder: boolean;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type Scenario = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly kind: ScenarioKind;
  readonly version: number;
  readonly assumptionIds: readonly string[];
  readonly createdAt: string;
  readonly createdBy: string;
};

export type Allocation = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly fromAccountId: string;
  readonly toAccountId: string;
  readonly amount: number;
  readonly periodKey: string;
  readonly dimensionFilters: Readonly<Record<string, string>>;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type PlanningModelSnapshot = {
  readonly organizationId: string;
  readonly budgetCount: number;
  readonly forecastCount: number;
  readonly scenarioCount: number;
  readonly assumptionCount: number;
  readonly allocationCount: number;
  readonly generatedAt: string;
};

export const PLANNING_GUARDS = Object.freeze({
  financialPlanning: true,
  consumesFinanceEngine: true,
  includesAiRecommendations: false,
  includesCashRunway: false,
  includesValuation: false,
  cashForecastPlaceholderOnly: true,
});
