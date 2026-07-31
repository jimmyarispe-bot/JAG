/**
 * Deterministic Forecasting & Scenario Planning (Sprint 070).
 * No LLMs, no ML — every projection is formula-based and explainable.
 */

export type ForecastDomain =
  | "admissions"
  | "enrollment"
  | "staffing"
  | "finance"
  | "capacity";

export type ScenarioId =
  | "baseline"
  | "high_growth"
  | "low_growth"
  | "reduced_staffing"
  | "expanded_capacity";

export type ForecastTrend = "up" | "down" | "flat" | "unknown";

export type ForecastAssumption = {
  key: string;
  label: string;
  value: number;
  unit: string;
  source: string;
};

export type SupportingDatum = {
  key: string;
  label: string;
  value: number | null;
  source: string;
};

export type ForecastExplanation = {
  assumptions: ForecastAssumption[];
  supportingData: SupportingDatum[];
  calculationSummary: string;
  confidenceNotes: string[];
};

export type DomainForecast = {
  domain: ForecastDomain;
  label: string;
  status: "ready" | "insufficient_data";
  /** Primary projected headline value for Founder cards. */
  projectedValue: number | null;
  unit: string;
  horizonLabel: string;
  trend: ForecastTrend;
  explanation: ForecastExplanation | null;
  insufficientReason: string | null;
  /** Extra projected metrics for detail views. */
  details: Record<string, number | null>;
};

export type ScenarioDefinition = {
  id: ScenarioId;
  label: string;
  description: string;
  /** Multipliers applied to model assumptions (deterministic). */
  multipliers: {
    admissionsVolume: number;
    enrollmentGrowth: number;
    attrition: number;
    studentsPerTeacher: number;
    hiringPace: number;
    tuitionRevenue: number;
    collectionRate: number;
    seatCapacity: number;
  };
};

export type ScenarioForecastBundle = {
  scenarioId: ScenarioId;
  scenarioLabel: string;
  description: string;
  forecasts: DomainForecast[];
};

export type ForecastingHistoryBundle = {
  organizationId: string | null;
  observedAt: string;
  current: {
    activeStudents: number | null;
    activeStaff: number | null;
    newApplications: number | null;
    enrollmentTrendPct: number | null;
    attendance: number | null;
    tuitionCollected: number | null;
    outstandingBalances: number | null;
  };
  prior: {
    activeStudents: number | null;
    activeStaff: number | null;
    newApplications: number | null;
    tuitionCollected: number | null;
    outstandingBalances: number | null;
    acceptanceRate: number | null;
  };
  operational: {
    openDecisions: number;
    completedDecisions: number;
    automationRuns: number;
    automationFailures: number;
  };
};

export type RunForecastInput = {
  history: ForecastingHistoryBundle;
  scenarioId?: ScenarioId;
  /** When true, compute all scenarios (default). */
  includeAllScenarios?: boolean;
  horizonDays?: number;
};

export type ForecastingResult = {
  generatedAt: string;
  organizationId: string | null;
  activeScenario: ScenarioId;
  horizonDays: number;
  scenarios: ScenarioForecastBundle[];
  /** Forecasts for the active scenario. */
  forecasts: DomainForecast[];
};
