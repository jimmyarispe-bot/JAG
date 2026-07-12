/**
 * Executive Decision Intelligence — shared types / DecisionModels / DecisionDTOs (Sprint 026).
 *
 * Sits on top of the Executive Graph Analyzer to simulate strategic decisions
 * before they are made. Integrates Financial, Founder, Executive, and
 * Organization Health intelligence via GraphAnalysisResult.
 */

import type {
  CascadePath,
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
  GraphEvidence,
  GraphOpportunity,
  GraphRecommendation,
  GraphScope,
  RiskPropagationResult,
  RootCauseFinding,
} from "@/lib/platform/intelligence/executive-graph/types";

/** Semantic version of the Executive Decision Intelligence pack. */
export const EXECUTIVE_DECISION_INTELLIGENCE_VERSION = "0.1.0";

/** Opaque metadata — never use `any`. */
export type DecisionMetadata = Record<string, unknown>;

/** Confidence bands for decision outputs. */
export const DECISION_CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
  "unknown",
] as const;
export type DecisionConfidenceLevel = (typeof DECISION_CONFIDENCE_LEVELS)[number];

/** Priority bands for executive action. */
export const DECISION_PRIORITY_BANDS = [
  "critical",
  "high",
  "medium",
  "low",
  "monitor",
] as const;
export type DecisionPriorityBand = (typeof DECISION_PRIORITY_BANDS)[number];

/** Lifecycle statuses for recorded decisions. */
export const DECISION_STATUSES = [
  "draft",
  "simulated",
  "recommended",
  "accepted",
  "deferred",
  "rejected",
  "implemented",
] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

/**
 * Built-in what-if scenario kinds.
 *
 * Examples:
 * - enrollment_drop: What happens if enrollment drops 10%?
 * - payroll_increase: What happens if payroll increases 8%?
 * - campus_expansion: Should another campus be opened?
 * - hiring_timing: Should hiring occur now or later?
 * - strategic_initiative: Which strategic initiative creates the highest ROI?
 */
export const DECISION_SCENARIO_KINDS = [
  "enrollment_drop",
  "payroll_increase",
  "campus_expansion",
  "hiring_timing",
  "strategic_initiative",
  "custom",
] as const;
export type DecisionScenarioKind = (typeof DECISION_SCENARIO_KINDS)[number];

/** Impact dimensions scored for every recommendation / forecast. */
export const DECISION_IMPACT_DIMENSIONS = [
  "financial",
  "operational",
  "mission",
  "enrollment",
  "workforce",
  "compliance",
  "reputation",
] as const;
export type DecisionImpactDimension = (typeof DECISION_IMPACT_DIMENSIONS)[number];

/** Strategy initiative categories. */
export const STRATEGY_INITIATIVE_KINDS = [
  "growth",
  "efficiency",
  "risk_mitigation",
  "capacity",
  "talent",
  "mission",
  "campus",
] as const;
export type StrategyInitiativeKind = (typeof STRATEGY_INITIATIVE_KINDS)[number];

/** Timing options for deferred actions (e.g. hire now vs later). */
export const DECISION_TIMING_OPTIONS = [
  "immediate",
  "near_term",
  "deferred",
  "conditional",
] as const;
export type DecisionTimingOption = (typeof DECISION_TIMING_OPTIONS)[number];

/** Calibrated decision confidence. */
export interface DecisionConfidenceScore {
  value: number;
  level: DecisionConfidenceLevel;
  factors: Array<{ key: string; label: string; contribution: number }>;
}

/** Signed impact on a single dimension (−1 … +1). */
export interface DimensionImpact {
  dimension: DecisionImpactDimension;
  delta: number;
  narrative: string;
  confidence: number;
}

/** Financial impact package (currency-agnostic relative units). */
export interface FinancialImpact {
  revenueDelta: number;
  costDelta: number;
  netDelta: number;
  roi: number;
  paybackMonths: number | null;
  narrative: string;
}

/** Operational impact package. */
export interface OperationalImpact {
  capacityDelta: number;
  staffingDelta: number;
  serviceLevelDelta: number;
  narrative: string;
}

/** Mission / community impact package. */
export interface MissionImpact {
  studentOutcomeDelta: number;
  communityDelta: number;
  brandDelta: number;
  narrative: string;
}

/** Risk attached to a decision or scenario. */
export interface DecisionRiskItem {
  id: string;
  title: string;
  category: DecisionImpactDimension | "general";
  probability: number;
  impact: number;
  score: number;
  mitigation?: string;
  relatedNodeIds: string[];
}

/** Dependency required for a decision to succeed. */
export interface DecisionDependencyItem {
  id: string;
  title: string;
  required: boolean;
  status: "met" | "partial" | "unmet" | "unknown";
  relatedNodeIds: string[];
  narrative: string;
}

/** Evidence supporting a recommendation. */
export interface DecisionEvidenceItem {
  id: string;
  label: string;
  detail: string;
  source:
    | "executive_graph"
    | "financial"
    | "founder"
    | "organization_health"
    | "executive"
    | "scenario"
    | "strategy";
  weight: number;
  nodeIds?: string[];
  value?: number | string | null;
}

/**
 * Full executive recommendation — required Sprint 026 shape.
 */
export interface ExecutiveDecisionRecommendation {
  id: string;
  title: string;
  action: string;
  priority: DecisionPriorityBand;
  timing: DecisionTimingOption;
  executiveSummary: string;
  supportingEvidence: DecisionEvidenceItem[];
  financialImpact: FinancialImpact;
  operationalImpact: OperationalImpact;
  missionImpact: MissionImpact;
  risks: DecisionRiskItem[];
  dependencies: DecisionDependencyItem[];
  confidenceScore: DecisionConfidenceScore;
  expectedRoi: number;
  relatedScenarioIds: string[];
  relatedGraphRecommendationIds: string[];
  metadata: DecisionMetadata;
}

/** Shock / lever applied in a what-if scenario. */
export interface ScenarioShock {
  key: string;
  label: string;
  /** Relative change, e.g. -0.1 = −10%. Absolute when unit is "absolute". */
  magnitude: number;
  unit: "relative" | "absolute" | "percent";
  targetDomain?:
    | "admissions"
    | "finance"
    | "hr"
    | "operations"
    | "executive"
    | "founder";
  targetNodeKey?: string;
}

/** Strategy initiative candidate for ROI comparison. */
export interface StrategyInitiative {
  id: string;
  title: string;
  kind: StrategyInitiativeKind;
  description: string;
  investment: number;
  expectedReturn: number;
  timeHorizonMonths: number;
  missionWeight: number;
  riskWeight: number;
  dependencies: string[];
  metadata: DecisionMetadata;
}

/** Baseline organizational snapshot used for simulation. */
export interface DecisionBaseline {
  enrollment: number;
  revenue: number;
  payroll: number;
  outstanding: number;
  staff: number;
  organizationHealthScore: number;
  financialHealthScore: number;
  founderHealthScore: number;
  overallRisk: number;
  overallOpportunity: number;
}

/** Scenario definition (input model). */
export interface DecisionScenarioDefinition {
  id: string;
  kind: DecisionScenarioKind;
  title: string;
  question: string;
  description?: string;
  shocks: ScenarioShock[];
  initiatives?: StrategyInitiative[];
  timing?: DecisionTimingOption;
  compareTiming?: DecisionTimingOption[];
  scope?: Partial<GraphScope>;
  metadata?: DecisionMetadata;
}

/** Forecasted impacts from a scenario simulation. */
export interface ImpactForecastResult {
  id: string;
  scenarioId: string;
  baseline: DecisionBaseline;
  projected: DecisionBaseline;
  dimensions: DimensionImpact[];
  financial: FinancialImpact;
  operational: OperationalImpact;
  mission: MissionImpact;
  cascadeSummaries: string[];
  riskSummaries: string[];
  confidence: DecisionConfidenceScore;
  horizonMonths: number;
  summary: string;
}

/** Pairwise tradeoff between two options. */
export interface TradeoffItem {
  id: string;
  optionA: string;
  optionB: string;
  winner: "a" | "b" | "tie";
  financialAdvantage: number;
  operationalAdvantage: number;
  missionAdvantage: number;
  riskAdvantage: number;
  netScore: number;
  rationale: string;
}

/** Tradeoff analysis package. */
export interface TradeoffAnalysisResult {
  scenarioId: string;
  items: TradeoffItem[];
  preferredOption: string;
  summary: string;
  confidence: DecisionConfidenceScore;
}

/** Strategy ranking for initiatives. */
export interface StrategyRanking {
  initiativeId: string;
  title: string;
  kind: StrategyInitiativeKind;
  roiScore: number;
  riskAdjustedRoi: number;
  missionScore: number;
  compositeScore: number;
  rank: number;
  rationale: string;
}

/** Strategy engine result. */
export interface StrategyAnalysisResult {
  scenarioId: string;
  rankings: StrategyRanking[];
  recommendedInitiativeId: string | null;
  summary: string;
  confidence: DecisionConfidenceScore;
}

/** Full simulation result for one scenario. */
export interface ScenarioSimulationResult {
  scenario: DecisionScenarioDefinition;
  forecast: ImpactForecastResult;
  tradeoffs: TradeoffAnalysisResult | null;
  strategy: StrategyAnalysisResult | null;
  graphDerived: {
    rootCauseIds: string[];
    cascadeIds: string[];
    riskOriginIds: string[];
    opportunityIds: string[];
    graphRecommendationIds: string[];
  };
  recommendations: ExecutiveDecisionRecommendation[];
  confidence: DecisionConfidenceScore;
  simulatedAt: string;
  summary: string;
}

/** Decision request DTO. */
export interface ExecutiveDecisionRequest {
  requestId: string;
  question: string;
  scenarios: DecisionScenarioDefinition[];
  /** Optional pre-built graph + analysis (preferred when available). */
  graph?: Graph;
  analysis?: GraphAnalysisResult;
  /** Optional graph build input when graph/analysis not provided. */
  graphInput?: GraphBuildInput;
  baselineOverrides?: Partial<DecisionBaseline>;
  horizonMonths?: number;
  maxRecommendations?: number;
  scope?: Partial<GraphScope>;
  metadata?: DecisionMetadata;
}

/** Flattened projection for executive UI / briefings. */
export interface DecisionProjectionResult {
  generatedAt: string;
  headline: string;
  question: string;
  topRecommendation: ExecutiveDecisionRecommendation | null;
  recommendations: ExecutiveDecisionRecommendation[];
  scenarios: Array<{
    scenarioId: string;
    title: string;
    kind: DecisionScenarioKind;
    netFinancialDelta: number;
    confidence: DecisionConfidenceLevel;
    summary: string;
  }>;
  overallConfidence: DecisionConfidenceScore;
  keyRisks: DecisionRiskItem[];
  keyDependencies: DecisionDependencyItem[];
  metrics: {
    scenarioCount: number;
    recommendationCount: number;
    averageRoi: number;
    highestRoi: number;
  };
}

/** Query request against decision results. */
export interface DecisionQueryRequest {
  question: string;
  scenarioId?: string;
  focus?: "roi" | "risk" | "timing" | "mission" | "recommendation";
  maxResults?: number;
}

/** Query answer. */
export interface DecisionQueryResult {
  question: string;
  answer: string;
  confidence: DecisionConfidenceScore;
  recommendationIds: string[];
  scenarioIds: string[];
  evidence: DecisionEvidenceItem[];
}

/** Historical decision record. */
export interface DecisionHistoryRecord {
  id: string;
  requestId: string;
  question: string;
  status: DecisionStatus;
  createdAt: string;
  updatedAt: string;
  scope: GraphScope;
  selectedRecommendationId: string | null;
  scenarioIds: string[];
  projectionHeadline: string;
  confidence: DecisionConfidenceScore;
  metadata: DecisionMetadata;
}

/** Complete decision package produced by DecisionEngine / ExecutiveDecisionService. */
export interface ExecutiveDecisionResult {
  requestId: string;
  question: string;
  analyzedAt: string;
  status: DecisionStatus;
  baseline: DecisionBaseline;
  simulations: ScenarioSimulationResult[];
  recommendations: ExecutiveDecisionRecommendation[];
  projection: DecisionProjectionResult;
  historyRecord: DecisionHistoryRecord;
  graphId: string | null;
  confidence: DecisionConfidenceScore;
  summary: string;
  metadata: DecisionMetadata;
}

/** Re-export graph types used by decision DTOs / repositories. */
export type {
  CascadePath,
  GraphEvidence,
  GraphOpportunity,
  GraphRecommendation,
  GraphScope,
  RiskPropagationResult,
  RootCauseFinding,
};
