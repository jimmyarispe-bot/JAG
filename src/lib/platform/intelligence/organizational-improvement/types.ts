/**
 * Organizational Improvement Engine shared DTOs (Sprint 036).
 * Leaf module: types only; never imports package implementations.
 */
import type { OrganizationDnaResult, OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { GovernanceResult } from "@/lib/platform/intelligence/board-governance/types";
import type {
  OpportunityExchangeRecord,
  OpportunityLensImpact,
  OpportunityResult,
} from "@/lib/platform/intelligence/opportunity/types";

export const IMPROVEMENT_INTELLIGENCE_VERSION = "0.1.0";
export type ImprovementMetadata = Record<string, unknown>;
export type { GraphScope };

export const IMPROVEMENT_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export type ImprovementConfidenceLevel = (typeof IMPROVEMENT_CONFIDENCE_LEVELS)[number];
export const IMPROVEMENT_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export type ImprovementPriorityBand = (typeof IMPROVEMENT_PRIORITY_BANDS)[number];
export const IMPROVEMENT_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export type ImprovementHealthStatus = (typeof IMPROVEMENT_HEALTH_STATUSES)[number];
export const IMPROVEMENT_ARTIFACT_STATUSES = ["draft", "generated", "reviewed", "distributed", "archived", "superseded"] as const;
export type ImprovementArtifactStatus = (typeof IMPROVEMENT_ARTIFACT_STATUSES)[number];

/** Continuous improvement loop stages. */
export const IMPROVEMENT_LOOP_STAGES = [
  "observe",
  "understand",
  "analyze",
  "predict",
  "recommend",
  "simulate",
  "prioritize",
  "plan",
  "execute",
  "measure",
  "learn",
  "repeat",
] as const;
export type ImprovementLoopStage = (typeof IMPROVEMENT_LOOP_STAGES)[number];

export const IMPROVEMENT_HORIZONS = ["weekly", "monthly", "quarterly", "annual"] as const;
export type ImprovementHorizon = (typeof IMPROVEMENT_HORIZONS)[number];

export const IMPROVEMENT_THEMES = [
  "financial",
  "mission",
  "people",
  "revenue",
  "funding",
  "operational",
  "risk",
  "governance",
  "strategic",
  "quick_win",
] as const;
export type ImprovementTheme = (typeof IMPROVEMENT_THEMES)[number];

/** Domains that publish improvements into the engine. */
export const IMPROVEMENT_SOURCE_DOMAINS = [
  "organization-health",
  "executive-graph",
  "executive-decision",
  "predictive",
  "human-capital",
  "revenue",
  "funding",
  "opportunity",
  "board-governance",
  "future-domains",
] as const;
export type ImprovementSourceDomain = (typeof IMPROVEMENT_SOURCE_DOMAINS)[number];

/** Ten-lens recommendation contract — every improvement must answer these. */
export interface ImprovementLensImpact {
  whyNow: string;
  expectedRoi: string;
  missionImpact: string;
  financialImpact: string;
  peopleImpact: string;
  implementationEffort: string;
  risk: string;
  confidence: string;
  dependencies: string;
  timeToValue: string;
}

export interface ImprovementConfidenceScore {
  value: number;
  level: ImprovementConfidenceLevel;
  factors: Array<{ key: string; label: string; contribution: number }>;
}

export interface ImprovementScore {
  key: string;
  label: string;
  value: number;
  status: ImprovementHealthStatus;
  band: ImprovementPriorityBand;
  narrative: string;
}

export interface ImprovementBaseline {
  organizationHealthScore: number;
  financialScore: number;
  revenueHealthProxy: number;
  fundingHealthProxy: number;
  workforceCapacity: number;
  executionReadiness: number;
  missionAlignment: number;
  governanceMaturity: number;
  predictiveSignalStrength: number;
  opportunityPipelineScore: number;
  organizationalCapacity: number;
  annualRevenue: number;
  annualExpenses: number;
  cashRunwayMonths: number;
  openImprovementCount: number;
  realizedImprovementValueYtd: number;
  plannedImprovementValue: number;
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

export type OpportunityResultLight = {
  requestId?: string;
  opportunityScore?: { value?: number };
  healthScore?: { value?: number };
  exchange?: OpportunityExchangeRecord[];
  recommendations?: string[];
} & Record<string, unknown>;

export interface ImprovementDnaAlignment {
  stageFit: number;
  missionFit: number;
  businessModelFit: number;
  readinessFit: number;
  narrative: string;
}

export interface ImprovementResourceRequirement {
  role: string;
  effortHours: number;
  skills: string[];
  budget: number;
}

export interface ImprovementRiskFactor {
  key: string;
  label: string;
  score: number;
  mitigation: string;
}

export interface ImprovementDependency {
  key: string;
  label: string;
  blocking: boolean;
  domain?: ImprovementSourceDomain | string;
}

/** Canonical improvement action published from any OIOS domain. */
export interface ImprovementRecord {
  id: string;
  title: string;
  description: string;
  sourceDomain: ImprovementSourceDomain;
  theme: ImprovementTheme;
  whyNow: string;
  expectedRoi: number;
  estimatedFinancialImpact: number;
  estimatedMissionImpact: number;
  estimatedPeopleImpact: number;
  estimatedRevenueImpact: number;
  estimatedFundingImpact: number;
  estimatedOperationalImpact: number;
  riskReduction: number;
  implementationCost: number;
  implementationEffort: number;
  requiredResources: ImprovementResourceRequirement[];
  expectedTimelineDays: number;
  confidence: number;
  priority: ImprovementPriorityBand;
  dependencies: ImprovementDependency[];
  risks: ImprovementRiskFactor[];
  organizationalDnaAlignment: ImprovementDnaAlignment;
  score: number;
  lenses: ImprovementLensImpact;
  opportunityLenses?: OpportunityLensImpact;
  sourceOpportunityId?: string;
  narrative: string;
  publishedAt: string;
  metadata?: ImprovementMetadata;
}

export interface ImprovementRecommendationRecord {
  id: string;
  title: string;
  priority: ImprovementPriorityBand;
  score: number;
  rationale: string;
  expectedValue: number;
  lenses: ImprovementLensImpact;
  narrative: string;
}

export interface ImprovementAnalysisResult {
  scored: ImprovementRecord[];
  priority: Array<{ improvementId: string; priorityScore: number; band: ImprovementPriorityBand; narrative: string }>;
  impact: Array<{ improvementId: string; financial: number; mission: number; people: number; organizational: number; narrative: string }>;
  missionAlignment: Array<{ improvementId: string; alignment: number; narrative: string }>;
  financialImpact: Array<{ improvementId: string; financialImpact: number; roi: number; narrative: string }>;
  riskReduction: Array<{ improvementId: string; riskReduction: number; factors: ImprovementRiskFactor[]; narrative: string }>;
  timeToValue: Array<{ improvementId: string; days: number; band: ImprovementPriorityBand; narrative: string }>;
  resources: Array<{ improvementId: string; resources: ImprovementResourceRequirement[]; totalBudget: number; narrative: string }>;
  capacity: Array<{ improvementId: string; capacityFit: number; constrained: boolean; narrative: string }>;
  dependencies: Array<{ improvementId: string; dependencies: ImprovementDependency[]; blocked: boolean; narrative: string }>;
  confidence: Array<{ improvementId: string; confidence: ImprovementConfidenceScore; narrative: string }>;
  lenses: ImprovementLensImpact;
  narrative: string;
}

export interface ImprovementPlanItem {
  improvementId: string;
  title: string;
  theme: ImprovementTheme;
  horizon: ImprovementHorizon;
  sequence: number;
  ownerHint: string;
  score: number;
  expectedValue: number;
  timelineDays: number;
  narrative: string;
}

export interface ImprovementPlanResult {
  horizon: ImprovementHorizon | "quick_wins" | "strategic" | "transformation";
  items: ImprovementPlanItem[];
  totalValue: number;
  narrative: string;
}

export interface ImprovementPlanningSuite {
  quickWins: ImprovementPlanResult;
  strategicInitiatives: ImprovementPlanResult;
  longTermTransformation: ImprovementPlanResult;
  weekly: ImprovementPlanResult;
  monthly: ImprovementPlanResult;
  quarterly: ImprovementPlanResult;
  annual: ImprovementPlanResult;
}

export interface ContinuousImprovementLoopResult {
  stages: ImprovementLoopStage[];
  currentStage: ImprovementLoopStage;
  observations: string[];
  recommendations: string[];
  measures: string[];
  learnings: string[];
  cycleId: string;
  narrative: string;
}

export interface ImprovementHeatMapCell {
  sourceDomain: ImprovementSourceDomain;
  theme: ImprovementTheme;
  count: number;
  averageScore: number;
  totalValue: number;
  intensity: number;
}

export interface ImprovementHeatMapResult {
  generatedAt: string;
  cells: ImprovementHeatMapCell[];
  hottestThemes: ImprovementTheme[];
  narrative: string;
}

export interface ImprovementDashboardResult {
  generatedAt: string;
  improvementScore: number;
  plannedValue: number;
  quickWinCount: number;
  strategicCount: number;
  status: ImprovementHealthStatus;
  headline: string;
  narrative: string;
}

export interface MissionImprovementDashboardResult {
  generatedAt: string;
  improvements: ImprovementRecord[];
  averageMissionImpact: number;
  status: ImprovementHealthStatus;
  narrative: string;
}

export interface FinancialImprovementDashboardResult {
  generatedAt: string;
  improvements: ImprovementRecord[];
  totalFinancialImpact: number;
  averageRoi: number;
  status: ImprovementHealthStatus;
  narrative: string;
}

export interface PeopleImprovementDashboardResult {
  generatedAt: string;
  improvements: ImprovementRecord[];
  averagePeopleImpact: number;
  status: ImprovementHealthStatus;
  narrative: string;
}

export interface TodaysPrioritiesResult {
  generatedAt: string;
  priorities: ImprovementRecord[];
  narrative: string;
}

export interface ImprovementHealthResult {
  overallScore: number;
  status: ImprovementHealthStatus;
  dimensions: {
    observation: number;
    prioritization: number;
    planning: number;
    executionReadiness: number;
    learning: number;
  };
  lenses: ImprovementLensImpact;
  narrative: string;
}

export interface DailyExecutiveBrief {
  id: string;
  title: string;
  generatedAt: string;
  periodLabel: string;
  headline: string;
  topFive: ImprovementRecord[];
  highestFinancial: ImprovementRecord | null;
  highestMission: ImprovementRecord | null;
  highestPeople: ImprovementRecord | null;
  highestRevenue: ImprovementRecord | null;
  highestFunding: ImprovementRecord | null;
  highestOperational: ImprovementRecord | null;
  highestRiskReduction: ImprovementRecord | null;
  highestConfidence: ImprovementRecord | null;
  decisionsNeeded: string[];
  watchItems: string[];
  confidence: ImprovementConfidenceScore;
}

export interface ExecutiveImprovementBrief {
  id: string;
  title: string;
  generatedAt: string;
  periodLabel: string;
  headline: string;
  improvementSummary: string;
  financialSummary: string;
  missionSummary: string;
  peopleSummary: string;
  weeklyPlanSummary: string;
  quarterlyRoadmapSummary: string;
  riskSummary: string;
  decisionsNeeded: string[];
  watchItems: string[];
  confidence: ImprovementConfidenceScore;
}

export interface ImprovementProjectionResult {
  generatedAt: string;
  headline: string;
  improvementScore: number;
  healthScore: number;
  todaysPriorities: TodaysPrioritiesResult;
  weeklyPlan: ImprovementPlanResult;
  quarterlyRoadmap: ImprovementPlanResult;
  brief: ExecutiveImprovementBrief;
  dailyBrief: DailyExecutiveBrief;
  dashboard: ImprovementDashboardResult;
  metrics: {
    plannedValue: number;
    realizedValueYtd: number;
    quickWinCount: number;
    strategicCount: number;
    averageRoi: number;
    averageConfidence: number;
  };
  overallConfidence: ImprovementConfidenceScore;
}

export interface ImprovementQueryRequest {
  question: string;
  focus?:
    | "general"
    | "financial"
    | "mission"
    | "people"
    | "revenue"
    | "funding"
    | "operational"
    | "risk"
    | "quick_wins"
    | "strategic"
    | "weekly"
    | "quarterly"
    | "loop";
  maxResults?: number;
}

export interface ImprovementQueryResult {
  question: string;
  focus: NonNullable<ImprovementQueryRequest["focus"]>;
  answer: string;
  references: string[];
  confidence: ImprovementConfidenceScore;
}

export interface ImprovementHistoryRecord {
  id: string;
  requestId: string;
  generatedAt: string;
  status: ImprovementArtifactStatus;
  summary: string;
  scope: GraphScope;
  confidence: ImprovementConfidenceScore;
  scores: { health: number; improvement: number; risk: number };
}

export interface ImprovementRequest {
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
  opportunityResult?: OpportunityResult | OpportunityResultLight;
  publishedImprovements?: ImprovementRecord[];
  publishedOpportunities?: OpportunityExchangeRecord[];
  financialSignal?: FinancialSignal;
  baselineOverrides?: Partial<ImprovementBaseline>;
  metadata?: ImprovementMetadata;
}

export interface ImprovementResult {
  requestId: string;
  version: string;
  generatedAt: string;
  periodLabel: string;
  scope: GraphScope;
  baseline: ImprovementBaseline;
  sources: Record<ImprovementSourceDomain, ImprovementRecord[]>;
  improvements: ImprovementRecord[];
  analysis: ImprovementAnalysisResult;
  planning: ImprovementPlanningSuite;
  loop: ContinuousImprovementLoopResult;
  healthScore: ImprovementScore;
  improvementScore: ImprovementScore;
  riskScore: ImprovementScore;
  improvementHealth: ImprovementHealthResult;
  dashboard: ImprovementDashboardResult;
  missionDashboard: MissionImprovementDashboardResult;
  financialDashboard: FinancialImprovementDashboardResult;
  peopleDashboard: PeopleImprovementDashboardResult;
  todaysPriorities: TodaysPrioritiesResult;
  heatMap: ImprovementHeatMapResult;
  dailyBrief: DailyExecutiveBrief;
  brief: ExecutiveImprovementBrief;
  projection: ImprovementProjectionResult;
  confidence: ImprovementConfidenceScore;
  historyRecord: ImprovementHistoryRecord;
  recommendations: string[];
}
