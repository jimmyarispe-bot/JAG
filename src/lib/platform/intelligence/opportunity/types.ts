/**
 * Opportunity Intelligence shared DTOs (Sprint 035).
 * Leaf module: types only; never imports package implementations.
 */
import type { OrganizationDnaResult, OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { GovernanceResult } from "@/lib/platform/intelligence/board-governance/types";

export const OPPORTUNITY_INTELLIGENCE_VERSION = "0.1.0";
export type OpportunityMetadata = Record<string, unknown>;
export type { GraphScope };

export const OPPORTUNITY_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export type OpportunityConfidenceLevel = (typeof OPPORTUNITY_CONFIDENCE_LEVELS)[number];
export const OPPORTUNITY_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export type OpportunityPriorityBand = (typeof OPPORTUNITY_PRIORITY_BANDS)[number];
export const OPPORTUNITY_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export type OpportunityHealthStatus = (typeof OPPORTUNITY_HEALTH_STATUSES)[number];
export const OPPORTUNITY_ARTIFACT_STATUSES = ["draft", "generated", "reviewed", "distributed", "archived", "superseded"] as const;
export type OpportunityArtifactStatus = (typeof OPPORTUNITY_ARTIFACT_STATUSES)[number];
export const OPPORTUNITY_PIPELINE_STAGES = ["discovered", "evaluated", "prioritized", "planned", "in_progress", "realized", "deferred", "declined"] as const;
export type OpportunityPipelineStage = (typeof OPPORTUNITY_PIPELINE_STAGES)[number];

export const OPPORTUNITY_CATEGORIES = [
  "revenue",
  "funding",
  "cost_reduction",
  "pricing",
  "market_expansion",
  "geographic_expansion",
  "customer_growth",
  "retention",
  "partnership",
  "strategic_alliance",
  "acquisition",
  "merger",
  "technology",
  "automation",
  "vendor_optimization",
  "procurement_savings",
  "real_estate",
  "asset_optimization",
  "licensing",
  "intellectual_property",
  "innovation",
  "mission_impact",
] as const;
export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number];

export const OPPORTUNITY_RANKING_LENSES = [
  "highest_roi",
  "quick_wins",
  "strategic_investments",
  "mission_critical",
  "long_term_growth",
  "highest_confidence",
  "lowest_risk",
] as const;
export type OpportunityRankingLens = (typeof OPPORTUNITY_RANKING_LENSES)[number];

export const OPPORTUNITY_ORIGINATING_DOMAINS = [
  "organization-dna",
  "oios-core",
  "organization-health",
  "human-capital",
  "revenue",
  "funding",
  "executive-graph",
  "executive-decision",
  "predictive",
  "board-governance",
  "opportunity",
  "continuous-improvement",
] as const;
export type OpportunityOriginatingDomain = (typeof OPPORTUNITY_ORIGINATING_DOMAINS)[number];

/** Five-lens recommendation contract — every opportunity must answer these. */
export interface OpportunityLensImpact {
  organizationalHealth: string;
  financialSustainability: string;
  missionImpact: string;
  longTermValue: string;
  timeToValue: string;
}

export interface OpportunityConfidenceScore {
  value: number;
  level: OpportunityConfidenceLevel;
  factors: Array<{ key: string; label: string; contribution: number }>;
}

export interface OpportunityScore {
  key: string;
  label: string;
  value: number;
  status: OpportunityHealthStatus;
  band: OpportunityPriorityBand;
  narrative: string;
}

export interface OpportunityBaseline {
  organizationHealthScore: number;
  financialScore: number;
  revenueHealthProxy: number;
  fundingHealthProxy: number;
  workforceCapacity: number;
  executionReadiness: number;
  missionAlignment: number;
  innovationReadiness: number;
  marketPosition: number;
  riskTolerance: number;
  annualRevenue: number;
  annualExpenses: number;
  cashRunwayMonths: number;
  openOpportunityCount: number;
  realizedValueYtd: number;
  pipelineValue: number;
}

export interface FinancialSignal {
  revenue: number;
  expenses: number;
  marginPct: number;
  cash?: number;
}

export type RevenueResultLight = {
  healthScore?: { value?: number };
  opportunityScore?: { value?: number };
  baseline?: { annualRevenue?: number; diversificationIndex?: number };
  recommendations?: string[];
} & Record<string, unknown>;

export type FundingResultLight = {
  healthScore?: { value?: number };
  opportunityScore?: { value?: number };
  baseline?: { annualFundingNeed?: number; pipelineFunding?: number; cashRunwayMonths?: number };
  topOpportunities?: Array<{ id?: string; name?: string; amount?: number; score?: number }>;
  recommendations?: string[];
} & Record<string, unknown>;

export type HumanCapitalResultLight = {
  requestId?: string;
  workforceHealthScore?: { value?: number };
  recommendations?: string[];
} & Record<string, unknown>;

export interface OpportunityDnaAlignment {
  stageFit: number;
  missionFit: number;
  businessModelFit: number;
  readinessFit: number;
  narrative: string;
}

export interface OpportunityResourceRequirement {
  role: string;
  effortHours: number;
  skills: string[];
  budget: number;
}

export interface OpportunityRiskFactor {
  key: string;
  label: string;
  score: number;
  mitigation: string;
}

export interface OpportunityDependency {
  key: string;
  label: string;
  blocking: boolean;
  domain?: OpportunityOriginatingDomain;
}

/** Common exchange contract every OIOS domain can publish into. */
export interface OpportunityExchangeRecord {
  id: string;
  title: string;
  description: string;
  originatingDomain: OpportunityOriginatingDomain;
  category: OpportunityCategory;
  estimatedFinancialImpact: number;
  estimatedMissionImpact: number;
  implementationCost: number;
  requiredResources: OpportunityResourceRequirement[];
  expectedTimelineDays: number;
  confidence: number;
  priority: OpportunityPriorityBand;
  dependencies: OpportunityDependency[];
  risks: OpportunityRiskFactor[];
  organizationalDnaAlignment: OpportunityDnaAlignment;
  stage: OpportunityPipelineStage;
  score: number;
  roi: number;
  lenses: OpportunityLensImpact;
  narrative: string;
  publishedAt: string;
  metadata?: OpportunityMetadata;
}

export interface OpportunityRecommendationRecord {
  id: string;
  title: string;
  priority: OpportunityPriorityBand;
  score: number;
  rationale: string;
  expectedValue: number;
  lenses: OpportunityLensImpact;
  narrative: string;
}

export interface OpportunityRecordBase {
  id: string;
  title: string;
  description: string;
  category: OpportunityCategory;
  estimatedFinancialImpact: number;
  estimatedMissionImpact: number;
  implementationCost: number;
  score: number;
  roi: number;
  confidence: number;
  priority: OpportunityPriorityBand;
  expectedTimelineDays: number;
  stage: OpportunityPipelineStage;
  originatingDomain: OpportunityOriginatingDomain;
  lenses: OpportunityLensImpact;
  narrative: string;
}

export interface CategoryOpportunityRecord extends OpportunityRecordBase {
  categoryLabel: string;
}

export interface OpportunityAnalysisResult {
  scored: OpportunityExchangeRecord[];
  roi: Array<{ opportunityId: string; roi: number; paybackDays: number; narrative: string }>;
  impact: Array<{ opportunityId: string; financial: number; mission: number; organizational: number; narrative: string }>;
  risk: Array<{ opportunityId: string; riskScore: number; factors: OpportunityRiskFactor[]; narrative: string }>;
  confidence: Array<{ opportunityId: string; confidence: OpportunityConfidenceScore; narrative: string }>;
  dependencies: Array<{ opportunityId: string; dependencies: OpportunityDependency[]; blocked: boolean; narrative: string }>;
  resources: Array<{ opportunityId: string; resources: OpportunityResourceRequirement[]; totalBudget: number; narrative: string }>;
  timeToValue: Array<{ opportunityId: string; days: number; band: OpportunityPriorityBand; narrative: string }>;
  strategicAlignment: Array<{ opportunityId: string; alignment: OpportunityDnaAlignment; narrative: string }>;
  lenses: OpportunityLensImpact;
  narrative: string;
}

export interface OpportunityRankingResult {
  lens: OpportunityRankingLens;
  opportunities: OpportunityExchangeRecord[];
  narrative: string;
}

export interface OpportunityPipelineResult {
  stages: Array<{ stage: OpportunityPipelineStage; count: number; value: number }>;
  records: OpportunityExchangeRecord[];
  totalValue: number;
  weightedValue: number;
  narrative: string;
}

export interface OpportunityHeatMapCell {
  category: OpportunityCategory;
  rankingLens: OpportunityRankingLens;
  count: number;
  averageScore: number;
  totalValue: number;
  intensity: number;
}

export interface OpportunityHeatMapResult {
  generatedAt: string;
  cells: OpportunityHeatMapCell[];
  hottestCategories: OpportunityCategory[];
  narrative: string;
}

export interface OpportunityDashboardResult {
  generatedAt: string;
  opportunityScore: number;
  pipelineValue: number;
  quickWinCount: number;
  strategicCount: number;
  missionCount: number;
  status: OpportunityHealthStatus;
  headline: string;
  narrative: string;
}

export interface TopOpportunitiesDashboardResult {
  generatedAt: string;
  opportunities: OpportunityExchangeRecord[];
  totalValue: number;
  status: OpportunityHealthStatus;
  narrative: string;
}

export interface QuickWinsDashboardResult {
  generatedAt: string;
  opportunities: OpportunityExchangeRecord[];
  averageDaysToValue: number;
  status: OpportunityHealthStatus;
  narrative: string;
}

export interface StrategicInvestmentDashboardResult {
  generatedAt: string;
  opportunities: OpportunityExchangeRecord[];
  totalInvestment: number;
  expectedReturn: number;
  status: OpportunityHealthStatus;
  narrative: string;
}

export interface MissionOpportunityDashboardResult {
  generatedAt: string;
  opportunities: OpportunityExchangeRecord[];
  averageMissionImpact: number;
  status: OpportunityHealthStatus;
  narrative: string;
}

export interface OpportunityHealthResult {
  overallScore: number;
  status: OpportunityHealthStatus;
  dimensions: {
    discovery: number;
    evaluation: number;
    prioritization: number;
    executionReadiness: number;
    realization: number;
  };
  lenses: OpportunityLensImpact;
  narrative: string;
}

export interface ExecutiveOpportunityBrief {
  id: string;
  title: string;
  generatedAt: string;
  periodLabel: string;
  headline: string;
  opportunitySummary: string;
  financialSummary: string;
  missionSummary: string;
  quickWinSummary: string;
  strategicSummary: string;
  riskSummary: string;
  decisionsNeeded: string[];
  watchItems: string[];
  confidence: OpportunityConfidenceScore;
}

export interface OpportunityProjectionResult {
  generatedAt: string;
  headline: string;
  opportunityScore: number;
  healthScore: number;
  pipeline: OpportunityPipelineResult;
  topOpportunities: OpportunityExchangeRecord[];
  brief: ExecutiveOpportunityBrief;
  dashboard: OpportunityDashboardResult;
  metrics: {
    pipelineValue: number;
    realizedValueYtd: number;
    quickWinCount: number;
    strategicCount: number;
    averageRoi: number;
    averageConfidence: number;
  };
  overallConfidence: OpportunityConfidenceScore;
}

export interface OpportunityQueryRequest {
  question: string;
  focus?:
    | "general"
    | "revenue"
    | "funding"
    | "cost"
    | "growth"
    | "partnership"
    | "technology"
    | "mission"
    | "quick_wins"
    | "strategic"
    | "pipeline"
    | "risk";
  maxResults?: number;
}

export interface OpportunityQueryResult {
  question: string;
  focus: NonNullable<OpportunityQueryRequest["focus"]>;
  answer: string;
  references: string[];
  confidence: OpportunityConfidenceScore;
}

export interface OpportunityHistoryRecord {
  id: string;
  requestId: string;
  generatedAt: string;
  status: OpportunityArtifactStatus;
  summary: string;
  scope: GraphScope;
  confidence: OpportunityConfidenceScore;
  scores: { health: number; opportunity: number; risk: number };
}

export interface OpportunityRequest {
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
  financialSignal?: FinancialSignal;
  publishedOpportunities?: OpportunityExchangeRecord[];
  baselineOverrides?: Partial<OpportunityBaseline>;
  metadata?: OpportunityMetadata;
}

export interface OpportunityResult {
  requestId: string;
  version: string;
  generatedAt: string;
  periodLabel: string;
  scope: GraphScope;
  baseline: OpportunityBaseline;
  categories: Record<OpportunityCategory, CategoryOpportunityRecord[]>;
  exchange: OpportunityExchangeRecord[];
  analysis: OpportunityAnalysisResult;
  rankings: OpportunityRankingResult[];
  pipeline: OpportunityPipelineResult;
  healthScore: OpportunityScore;
  opportunityScore: OpportunityScore;
  riskScore: OpportunityScore;
  opportunityHealth: OpportunityHealthResult;
  dashboard: OpportunityDashboardResult;
  topOpportunitiesDashboard: TopOpportunitiesDashboardResult;
  quickWinsDashboard: QuickWinsDashboardResult;
  strategicInvestmentDashboard: StrategicInvestmentDashboardResult;
  missionOpportunityDashboard: MissionOpportunityDashboardResult;
  heatMap: OpportunityHeatMapResult;
  brief: ExecutiveOpportunityBrief;
  projection: OpportunityProjectionResult;
  confidence: OpportunityConfidenceScore;
  historyRecord: OpportunityHistoryRecord;
  recommendations: string[];
}
