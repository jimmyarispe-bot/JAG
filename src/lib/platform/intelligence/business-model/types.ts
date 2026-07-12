/**
 * Business Model Intelligence — shared types / BusinessModelModels DTOs (Sprint 037).
 *
 * Continuously understand, evaluate, simulate, compare, redesign, and optimize
 * how organizations create, deliver, and capture value.
 *
 * Composed on Organizational DNA + OIOS Core; soft-reads Revenue, Funding,
 * Opportunity, Organizational Improvement, Executive Decision, and Predictive.
 *
 * Does NOT regenerate organization-dna's BusinessModelEngine artifact builder.
 */

import type { OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
  GraphScope,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { GovernanceResult } from "@/lib/platform/intelligence/board-governance/types";

/** Semantic version of the Business Model Intelligence pack. */
export const BUSINESS_MODEL_INTELLIGENCE_VERSION = "0.1.0";

/** Opaque metadata — never use `any`. */
export type BusinessModelMetadata = Record<string, unknown>;

/** Re-export graph scope for business-model records. */
export type { GraphScope };

/** Confidence bands. */
export const BUSINESS_MODEL_CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
  "unknown",
] as const;
export type BusinessModelConfidenceLevel =
  (typeof BUSINESS_MODEL_CONFIDENCE_LEVELS)[number];

/** Priority / severity bands. */
export const BUSINESS_MODEL_PRIORITY_BANDS = [
  "critical",
  "high",
  "medium",
  "low",
  "monitor",
] as const;
export type BusinessModelPriorityBand =
  (typeof BUSINESS_MODEL_PRIORITY_BANDS)[number];

/** Health status bands. */
export const BUSINESS_MODEL_HEALTH_STATUSES = [
  "excellent",
  "healthy",
  "warning",
  "critical",
] as const;
export type BusinessModelHealthStatus =
  (typeof BUSINESS_MODEL_HEALTH_STATUSES)[number];

/** Artifact lifecycle. */
export const BUSINESS_MODEL_ARTIFACT_STATUSES = [
  "draft",
  "generated",
  "reviewed",
  "distributed",
  "archived",
  "superseded",
] as const;
export type BusinessModelArtifactStatus =
  (typeof BUSINESS_MODEL_ARTIFACT_STATUSES)[number];

/** Business Model Canvas building blocks. */
export const BMC_BLOCKS = [
  "customer_segments",
  "value_propositions",
  "channels",
  "customer_relationships",
  "revenue_streams",
  "key_resources",
  "key_activities",
  "key_partnerships",
  "cost_structure",
] as const;
export type BmcBlock = (typeof BMC_BLOCKS)[number];

/** Lean Canvas building blocks. */
export const LEAN_CANVAS_BLOCKS = [
  "problem",
  "solution",
  "unique_value_proposition",
  "unfair_advantage",
  "early_adopters",
  "key_metrics",
  "channels",
  "revenue",
  "costs",
] as const;
export type LeanCanvasBlock = (typeof LEAN_CANVAS_BLOCKS)[number];

/** Organization design / operating model kinds. */
export const ORGANIZATION_DESIGN_KINDS = [
  "business_unit",
  "operating_model",
  "franchise",
  "licensing",
  "platform",
  "marketplace",
  "subscription",
  "hybrid",
  "multi_entity",
  "holding_company",
  "shared_services",
] as const;
export type OrganizationDesignKind =
  (typeof ORGANIZATION_DESIGN_KINDS)[number];

/** Scenario plan kinds. */
export const BUSINESS_MODEL_SCENARIO_KINDS = [
  "current",
  "alternative",
  "best_practice",
  "competitor",
  "future",
  "mission_first",
  "high_growth",
  "high_margin",
] as const;
export type BusinessModelScenarioKind =
  (typeof BUSINESS_MODEL_SCENARIO_KINDS)[number];

/** Simulation forecast dimensions. */
export const SIMULATION_FORECAST_DIMENSIONS = [
  "revenue",
  "profitability",
  "mission_impact",
  "growth",
  "scalability",
  "capital_requirements",
  "risk",
  "operational_complexity",
] as const;
export type SimulationForecastDimension =
  (typeof SIMULATION_FORECAST_DIMENSIONS)[number];

/**
 * Six-lens impact narrative — every recommendation must address:
 * How is value created / delivered / captured?
 * Can the model be improved / scale / become more sustainable?
 */
export interface BusinessModelLensImpact {
  valueCreated: string;
  valueDelivered: string;
  valueCaptured: string;
  canImprove: string;
  canScale: string;
  canSustain: string;
}

/** Calibrated confidence. */
export interface BusinessModelConfidenceScore {
  value: number;
  level: BusinessModelConfidenceLevel;
  factors: Array<{ key: string; label: string; contribution: number }>;
}

/** Shared score card. */
export interface BusinessModelScore {
  key: string;
  label: string;
  value: number;
  status: BusinessModelHealthStatus;
  band: BusinessModelPriorityBand;
  narrative: string;
}

/** Baseline signals when upstream modules are sparse. */
export interface BusinessModelBaseline {
  clarityScore: number;
  valueCreationScore: number;
  valueDeliveryScore: number;
  valueCaptureScore: number;
  scalabilityScore: number;
  sustainabilityScore: number;
  differentiationScore: number;
  unitEconomicsScore: number;
  capitalIntensity: number;
  operationalComplexity: number;
  missionAlignment: number;
  competitivePosition: number;
  annualRevenue: number;
  grossMargin: number;
  growthRate: number;
  organizationHealthScore: number;
  financialScore: number;
  archetype: string;
}

/** Optional financial signal from organization-health / finance context. */
export interface FinancialSignal {
  revenue: number;
  expenses: number;
  marginPct: number;
  cash?: number;
}

/** Light upstream result attachments (avoid circular imports). */
export interface RevenueResultLight {
  healthScore?: { value?: number };
  growthScore?: { value?: number };
  baseline?: {
    annualRevenue?: number;
    grossMargin?: number;
    diversificationIndex?: number;
  };
  recommendations?: string[];
}

export interface FundingResultLight {
  healthScore?: { value?: number };
  opportunityScore?: { value?: number };
  baseline?: {
    annualFundingNeed?: number;
    cashRunwayMonths?: number;
  };
  recommendations?: string[];
}

export interface OpportunityResultLight {
  opportunityScore?: { value?: number };
  healthScore?: { value?: number };
  recommendations?: string[];
}

export interface ImprovementResultLight {
  improvementScore?: { value?: number };
  healthScore?: { value?: number };
  recommendations?: string[];
}

export interface HumanCapitalResultLight {
  requestId?: string;
  workforceHealthScore?: { value?: number };
  recommendations?: string[];
}

/** Shared recommendation shape. */
export interface BusinessModelRecommendationRecord {
  id: string;
  title: string;
  priority: BusinessModelPriorityBand;
  score: number;
  rationale: string;
  lenses: BusinessModelLensImpact;
  narrative: string;
  expectedLift: string;
  riskReduction: string;
}

/* -------------------------------------------------------------------------- */
/* Canvas DTOs                                                                 */
/* -------------------------------------------------------------------------- */

export interface BmcBlockRecord {
  block: BmcBlock;
  label: string;
  items: string[];
  strength: number;
  gaps: string[];
  narrative: string;
}

export interface BusinessModelCanvasResult {
  blocks: BmcBlockRecord[];
  completeness: number;
  status: BusinessModelHealthStatus;
  narrative: string;
}

export interface LeanCanvasBlockRecord {
  block: LeanCanvasBlock;
  label: string;
  items: string[];
  strength: number;
  gaps: string[];
  narrative: string;
}

export interface LeanCanvasResult {
  blocks: LeanCanvasBlockRecord[];
  completeness: number;
  status: BusinessModelHealthStatus;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Organization design                                                         */
/* -------------------------------------------------------------------------- */

export interface OrganizationDesignRecord {
  id: string;
  kind: OrganizationDesignKind;
  label: string;
  fitScore: number;
  priority: BusinessModelPriorityBand;
  pros: string[];
  cons: string[];
  capitalIntensity: number;
  operationalComplexity: number;
  scalability: number;
  missionFit: number;
  lenses: BusinessModelLensImpact;
  narrative: string;
}

export interface OrganizationDesignSuite {
  current: OrganizationDesignRecord;
  alternatives: OrganizationDesignRecord[];
  recommended: OrganizationDesignRecord;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Simulation                                                                  */
/* -------------------------------------------------------------------------- */

export interface SimulationForecastPoint {
  dimension: SimulationForecastDimension;
  label: string;
  current: number;
  projected: number;
  delta: number;
  narrative: string;
}

export interface BusinessModelSimulationRecord {
  id: string;
  modelId: string;
  label: string;
  archetype: string;
  forecasts: SimulationForecastPoint[];
  overallScore: number;
  riskScore: number;
  lenses: BusinessModelLensImpact;
  narrative: string;
}

export interface BusinessModelComparisonResult {
  models: BusinessModelSimulationRecord[];
  winnerId: string;
  winnerLabel: string;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Scenario planning                                                           */
/* -------------------------------------------------------------------------- */

export interface BusinessModelScenarioRecord {
  id: string;
  kind: BusinessModelScenarioKind;
  label: string;
  description: string;
  score: number;
  priority: BusinessModelPriorityBand;
  revenueOutlook: number;
  marginOutlook: number;
  missionOutlook: number;
  growthOutlook: number;
  riskOutlook: number;
  lenses: BusinessModelLensImpact;
  narrative: string;
}

export interface BusinessModelScenarioSuite {
  scenarios: BusinessModelScenarioRecord[];
  preferredId: string;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Outputs                                                                     */
/* -------------------------------------------------------------------------- */

export interface BusinessModelHealthResult {
  overallScore: number;
  status: BusinessModelHealthStatus;
  dimensions: Record<string, number>;
  lenses: BusinessModelLensImpact;
  narrative: string;
}

export interface BusinessModelDashboardResult {
  generatedAt: string;
  headline: string;
  healthScore: number;
  clarityScore: number;
  scalabilityScore: number;
  sustainabilityScore: number;
  competitivePosition: number;
  topRisks: string[];
  topOpportunities: string[];
  narrative: string;
}

export interface CompetitivePositionResult {
  score: number;
  status: BusinessModelHealthStatus;
  strengths: string[];
  weaknesses: string[];
  competitorGaps: string[];
  narrative: string;
}

export interface BusinessModelRiskRecord {
  id: string;
  title: string;
  severity: BusinessModelPriorityBand;
  score: number;
  dimension: SimulationForecastDimension | "model_clarity" | "differentiation";
  mitigation: string;
  lenses: BusinessModelLensImpact;
  narrative: string;
}

export interface BusinessModelOpportunityRecord {
  id: string;
  title: string;
  priority: BusinessModelPriorityBand;
  score: number;
  expectedValue: number;
  lenses: BusinessModelLensImpact;
  narrative: string;
}

export interface BusinessModelEvolutionStep {
  id: string;
  horizon: "now" | "near" | "mid" | "long";
  title: string;
  priority: BusinessModelPriorityBand;
  score: number;
  dependencies: string[];
  lenses: BusinessModelLensImpact;
  narrative: string;
}

export interface BusinessModelEvolutionRoadmap {
  steps: BusinessModelEvolutionStep[];
  narrative: string;
}

export interface ExecutiveBusinessBrief {
  generatedAt: string;
  headline: string;
  summary: string;
  healthScore: number;
  clarityScore: number;
  scalabilityScore: number;
  sustainabilityScore: number;
  topRecommendations: string[];
  topRisks: string[];
  topOpportunities: string[];
  preferredScenario: string;
  lenses: BusinessModelLensImpact;
  narrative: string;
}

export interface BusinessModelProjectionResult {
  generatedAt: string;
  headline: string;
  healthScore: number;
  clarityScore: number;
  scalabilityScore: number;
  sustainabilityScore: number;
  canvas: BusinessModelCanvasResult;
  leanCanvas: LeanCanvasResult;
  brief: ExecutiveBusinessBrief;
  dashboard: BusinessModelDashboardResult;
  metrics: {
    annualRevenue: number;
    grossMargin: number;
    growthRate: number;
    competitivePosition: number;
    capitalIntensity: number;
    operationalComplexity: number;
  };
  overallConfidence: BusinessModelConfidenceScore;
}

export interface BusinessModelHistoryRecord {
  id: string;
  requestId: string;
  scope: GraphScope;
  status: BusinessModelArtifactStatus;
  healthScore: number;
  generatedAt: string;
  summary: string;
  metadata: BusinessModelMetadata;
}

export interface BusinessModelQueryRequest {
  question: string;
  focus?:
    | "general"
    | "canvas"
    | "lean"
    | "design"
    | "simulation"
    | "scenarios"
    | "risk"
    | "opportunity"
    | "roadmap"
    | "competitive";
  maxResults?: number;
}

export interface BusinessModelQueryResult {
  question: string;
  focus: string;
  answer: string;
  references: string[];
  confidence: BusinessModelConfidenceScore;
}

/** Registry publisher descriptor. */
export interface BusinessModelPublisher {
  domain: string;
  capability: string;
}

/* -------------------------------------------------------------------------- */
/* Request / Result                                                            */
/* -------------------------------------------------------------------------- */

export interface BusinessModelRequest {
  requestId: string;
  question?: string;
  periodLabel?: string;
  scope?: GraphScope;
  dnaResult?: OrganizationDnaResult;
  dna?: OrganizationDNA;
  oiosResult?: OiosResult;
  graph?: Graph;
  analysis?: GraphAnalysisResult;
  graphInput?: GraphBuildInput;
  decisionResult?: ExecutiveDecisionResult;
  predictionResult?: PredictionResult;
  governanceResult?: GovernanceResult;
  humanCapitalResult?: HumanCapitalResultLight;
  revenueResult?: RevenueResultLight;
  fundingResult?: FundingResultLight;
  opportunityResult?: OpportunityResultLight;
  improvementResult?: ImprovementResultLight;
  financialSignal?: FinancialSignal;
  baselineOverrides?: Partial<BusinessModelBaseline>;
  metadata?: BusinessModelMetadata;
}

/** Full business model generation result. */
export interface BusinessModelResult {
  requestId: string;
  version: string;
  generatedAt: string;
  periodLabel: string;
  scope: GraphScope;
  baseline: BusinessModelBaseline;
  /** Core scores */
  healthScore: BusinessModelScore;
  clarityScore: BusinessModelScore;
  scalabilityScore: BusinessModelScore;
  sustainabilityScore: BusinessModelScore;
  riskScore: BusinessModelScore;
  businessModelHealth: BusinessModelHealthResult;
  /** Canvases */
  canvas: BusinessModelCanvasResult;
  leanCanvas: LeanCanvasResult;
  /** Design + simulation + scenarios */
  organizationDesign: OrganizationDesignSuite;
  simulations: BusinessModelSimulationRecord[];
  comparison: BusinessModelComparisonResult;
  scenarios: BusinessModelScenarioSuite;
  /** Outputs */
  dashboard: BusinessModelDashboardResult;
  competitivePosition: CompetitivePositionResult;
  risks: BusinessModelRiskRecord[];
  opportunities: BusinessModelOpportunityRecord[];
  evolutionRoadmap: BusinessModelEvolutionRoadmap;
  alternatives: OrganizationDesignRecord[];
  brief: ExecutiveBusinessBrief;
  projection: BusinessModelProjectionResult;
  confidence: BusinessModelConfidenceScore;
  recommendations: BusinessModelRecommendationRecord[];
  historyRecord: BusinessModelHistoryRecord;
  metadata: BusinessModelMetadata;
}
