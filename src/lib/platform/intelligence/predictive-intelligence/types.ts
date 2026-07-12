/**
 * Predictive Intelligence — shared types / PredictionModels / ForecastDTOs (Sprint 028).
 *
 * Forecasting layer that predicts future organizational outcomes using historical
 * intelligence, Executive Graph relationships, and Executive Decision simulations.
 */

import type {
  DecisionBaseline,
  ExecutiveDecisionResult,
  ScenarioSimulationResult,
} from "@/lib/platform/intelligence/executive-decision/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
  GraphScope,
} from "@/lib/platform/intelligence/executive-graph/types";

/** Semantic version of the Predictive Intelligence pack. */
export const PREDICTIVE_INTELLIGENCE_VERSION = "0.1.0";

/** Opaque metadata — never use `any`. */
export type ForecastMetadata = Record<string, unknown>;

/** Re-export graph scope for forecast records. */
export type { GraphScope };

/** Forecast domains covered by Sprint 028. */
export const FORECAST_DOMAINS = [
  "enrollment",
  "revenue",
  "cash_flow",
  "expense",
  "payroll",
  "staffing",
  "capacity",
  "admissions",
  "mission",
  "risk",
  "executive_kpi",
] as const;
export type ForecastDomain = (typeof FORECAST_DOMAINS)[number];

/** Supported forecast horizons in days. */
export const FORECAST_HORIZONS = [30, 90, 180, 365] as const;
export type ForecastHorizonDays = (typeof FORECAST_HORIZONS)[number];

/** Confidence bands for prediction outputs. */
export const PREDICTION_CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
  "unknown",
] as const;
export type PredictionConfidenceLevel =
  (typeof PREDICTION_CONFIDENCE_LEVELS)[number];

/** Trend directions detected by TrendAnalyzer. */
export const TREND_DIRECTIONS = [
  "accelerating",
  "declining",
  "stable",
  "volatile",
] as const;
export type TrendDirection = (typeof TREND_DIRECTIONS)[number];

/** Forecast scenario kinds for multi-scenario projection. */
export const FORECAST_SCENARIO_KINDS = [
  "baseline",
  "optimistic",
  "pessimistic",
  "stress",
  "decision_linked",
  "custom",
] as const;
export type ForecastScenarioKind = (typeof FORECAST_SCENARIO_KINDS)[number];

/** Priority bands for preventive executive actions. */
export const FORECAST_PRIORITY_BANDS = [
  "critical",
  "high",
  "medium",
  "low",
  "monitor",
] as const;
export type ForecastPriorityBand = (typeof FORECAST_PRIORITY_BANDS)[number];

/** Lifecycle statuses for forecast history records. */
export const FORECAST_STATUSES = [
  "draft",
  "generated",
  "reviewed",
  "acted_on",
  "expired",
  "superseded",
] as const;
export type ForecastStatus = (typeof FORECAST_STATUSES)[number];

/** Threshold crossing severity. */
export const THRESHOLD_SEVERITIES = [
  "critical",
  "warning",
  "info",
] as const;
export type ThresholdSeverity = (typeof THRESHOLD_SEVERITIES)[number];

/** Calibrated prediction confidence. */
export interface PredictionConfidenceScore {
  value: number;
  level: PredictionConfidenceLevel;
  factors: Array<{ key: string; label: string; contribution: number }>;
}

/** Point estimate with confidence interval. */
export interface ForecastPoint {
  horizonDays: ForecastHorizonDays;
  value: number;
  low: number;
  high: number;
  confidence: number;
  asOf: string;
}

/** Trend analysis for a single domain series. */
export interface TrendAnalysisResult {
  domain: ForecastDomain;
  direction: TrendDirection;
  slope: number;
  acceleration: number;
  volatility: number;
  momentum: number;
  narrative: string;
  confidence: number;
}

/** Predicted threshold crossing. */
export interface ThresholdCrossing {
  id: string;
  domain: ForecastDomain;
  threshold: number;
  predictedValue: number;
  horizonDays: ForecastHorizonDays;
  estimatedCrossingAt: string | null;
  severity: ThresholdSeverity;
  direction: "above" | "below";
  narrative: string;
}

/** Emerging risk flagged by predictive analysis. */
export interface EmergingRisk {
  id: string;
  title: string;
  domain: ForecastDomain;
  probability: number;
  impact: number;
  score: number;
  horizonDays: ForecastHorizonDays;
  relatedThresholdIds: string[];
  preventiveActionIds: string[];
  narrative: string;
}

/** Preventive executive action recommended from forecasts. */
export interface PreventiveAction {
  id: string;
  title: string;
  action: string;
  domain: ForecastDomain;
  priority: ForecastPriorityBand;
  horizonDays: ForecastHorizonDays;
  expectedImpact: number;
  confidence: PredictionConfidenceScore;
  relatedRiskIds: string[];
  relatedScenarioIds: string[];
  executiveSummary: string;
}

/** Historical / synthetic series point used for trend fitting. */
export interface HistoricalSignal {
  domain: ForecastDomain;
  observedAt: string;
  value: number;
  source:
    | "executive"
    | "financial"
    | "organization_health"
    | "founder"
    | "executive_graph"
    | "executive_decision"
    | "synthetic"
    | "override";
}

/** Baseline snapshot for forecasting (extends decision baseline with cash/capacity). */
export interface ForecastBaseline {
  enrollment: number;
  revenue: number;
  cashFlow: number;
  expense: number;
  payroll: number;
  staffing: number;
  capacity: number;
  admissions: number;
  missionScore: number;
  riskScore: number;
  executiveKpi: number;
  organizationHealthScore: number;
  financialHealthScore: number;
  founderHealthScore: number;
}

/** Named forecast scenario with optional shocks / decision links. */
export interface ForecastScenarioDefinition {
  id: string;
  title: string;
  kind: ForecastScenarioKind;
  description: string;
  /** Multipliers applied per domain (1.0 = unchanged). */
  domainMultipliers?: Partial<Record<ForecastDomain, number>>;
  /** Absolute offsets applied after multipliers. */
  domainOffsets?: Partial<Record<ForecastDomain, number>>;
  linkedDecisionScenarioIds?: string[];
  scope?: Partial<GraphScope>;
  metadata?: ForecastMetadata;
}

/** Per-domain forecast package. */
export interface DomainForecast {
  domain: ForecastDomain;
  baselineValue: number;
  points: ForecastPoint[];
  trend: TrendAnalysisResult;
  thresholdCrossings: ThresholdCrossing[];
  confidence: PredictionConfidenceScore;
  summary: string;
}

/** Full multi-horizon forecast for one scenario. */
export interface ScenarioForecast {
  scenario: ForecastScenarioDefinition;
  domains: DomainForecast[];
  emergingRisks: EmergingRisk[];
  preventiveActions: PreventiveAction[];
  confidence: PredictionConfidenceScore;
  score: number;
  generatedAt: string;
  summary: string;
}

/** Flattened projection for dashboards / founder briefings. */
export interface ForecastProjectionResult {
  generatedAt: string;
  headline: string;
  horizons: ForecastHorizonDays[];
  scenarios: Array<{
    scenarioId: string;
    title: string;
    kind: ForecastScenarioKind;
    score: number;
    confidence: PredictionConfidenceLevel;
    summary: string;
  }>;
  domainHighlights: Array<{
    domain: ForecastDomain;
    horizonDays: ForecastHorizonDays;
    value: number;
    direction: TrendDirection;
    narrative: string;
  }>;
  emergingRisks: EmergingRisk[];
  preventiveActions: PreventiveAction[];
  thresholdCrossings: ThresholdCrossing[];
  overallConfidence: PredictionConfidenceScore;
  metrics: {
    scenarioCount: number;
    domainCount: number;
    riskCount: number;
    actionCount: number;
    crossingCount: number;
  };
}

/** History audit record. */
export interface ForecastHistoryRecord {
  id: string;
  requestId: string;
  status: ForecastStatus;
  createdAt: string;
  updatedAt: string;
  scope: GraphScope;
  scenarioIds: string[];
  projectionHeadline: string;
  confidence: PredictionConfidenceScore;
  metadata: ForecastMetadata;
}

/** Query request over a prediction result. */
export interface ForecastQueryRequest {
  question: string;
  focus?:
    | "trend"
    | "risk"
    | "threshold"
    | "action"
    | "horizon"
    | "domain"
    | "general";
  domain?: ForecastDomain;
  horizonDays?: ForecastHorizonDays;
  scenarioId?: string;
  maxResults?: number;
}

/** Query answer package. */
export interface ForecastQueryResult {
  question: string;
  answer: string;
  confidence: PredictionConfidenceScore;
  domainIds: ForecastDomain[];
  scenarioIds: string[];
  riskIds: string[];
  actionIds: string[];
}

/**
 * Full predictive intelligence request.
 */
export interface PredictionRequest {
  requestId: string;
  question?: string;
  horizons?: ForecastHorizonDays[];
  domains?: ForecastDomain[];
  scenarios?: ForecastScenarioDefinition[];
  historicalSignals?: HistoricalSignal[];
  baselineOverrides?: Partial<ForecastBaseline>;
  thresholds?: Partial<Record<ForecastDomain, number>>;
  /** Optional pre-built graph / analysis (from Executive Graph). */
  graph?: Graph;
  analysis?: GraphAnalysisResult;
  graphInput?: GraphBuildInput;
  /** Optional decision result to bias forecasts. */
  decisionResult?: ExecutiveDecisionResult;
  decisionSimulations?: ScenarioSimulationResult[];
  decisionBaseline?: DecisionBaseline;
  scope?: Partial<GraphScope>;
  maxActions?: number;
  maxRisks?: number;
  metadata?: ForecastMetadata;
}

/**
 * Full predictive intelligence result.
 */
export interface PredictionResult {
  requestId: string;
  question: string;
  generatedAt: string;
  status: ForecastStatus;
  baseline: ForecastBaseline;
  horizons: ForecastHorizonDays[];
  domains: ForecastDomain[];
  scenarioForecasts: ScenarioForecast[];
  projection: ForecastProjectionResult;
  historyRecord: ForecastHistoryRecord;
  graphId: string | null;
  confidence: PredictionConfidenceScore;
  summary: string;
  metadata: ForecastMetadata;
}
