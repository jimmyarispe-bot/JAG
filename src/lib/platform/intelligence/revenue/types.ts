/**
 * Revenue Intelligence — shared types / RevenueModels DTOs (Sprint 033).
 *
 * Sustainable revenue, profitability, mission impact, revenue risk, and
 * long-term financial health — composed on Organizational DNA + OIOS Core.
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

/** Semantic version of the Revenue Intelligence pack. */
export const REVENUE_INTELLIGENCE_VERSION = "0.1.0";

/** Opaque metadata — never use `any`. */
export type RevenueMetadata = Record<string, unknown>;

/** Re-export graph scope for revenue records. */
export type { GraphScope };

/** Confidence bands. */
export const REVENUE_CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
  "unknown",
] as const;
export type RevenueConfidenceLevel = (typeof REVENUE_CONFIDENCE_LEVELS)[number];

/** Priority / severity bands. */
export const REVENUE_PRIORITY_BANDS = [
  "critical",
  "high",
  "medium",
  "low",
  "monitor",
] as const;
export type RevenuePriorityBand = (typeof REVENUE_PRIORITY_BANDS)[number];

/** Health status bands for revenue scores. */
export const REVENUE_HEALTH_STATUSES = [
  "excellent",
  "healthy",
  "warning",
  "critical",
] as const;
export type RevenueHealthStatus = (typeof REVENUE_HEALTH_STATUSES)[number];

/** Artifact lifecycle. */
export const REVENUE_ARTIFACT_STATUSES = [
  "draft",
  "generated",
  "reviewed",
  "distributed",
  "archived",
  "superseded",
] as const;
export type RevenueArtifactStatus = (typeof REVENUE_ARTIFACT_STATUSES)[number];

/** Pricing model kinds. */
export const PRICING_MODEL_KINDS = [
  "subscription",
  "tiered",
  "usage",
  "one_time",
  "contract",
  "scholarship",
  "hybrid",
] as const;
export type PricingModelKind = (typeof PRICING_MODEL_KINDS)[number];

/** Offering lifecycle stages. */
export const OFFERING_LIFECYCLE_STAGES = [
  "introduce",
  "grow",
  "mature",
  "harvest",
  "retire",
] as const;
export type OfferingLifecycleStage =
  (typeof OFFERING_LIFECYCLE_STAGES)[number];

/** Sales pipeline stages. */
export const SALES_PIPELINE_STAGES = [
  "prospect",
  "qualify",
  "propose",
  "negotiate",
  "closed_won",
  "closed_lost",
] as const;
export type SalesPipelineStage = (typeof SALES_PIPELINE_STAGES)[number];

/**
 * Five-lens impact narrative — every recommendation must address these where relevant.
 */
export interface RevenueLensImpact {
  sustainableRevenue: string;
  profitability: string;
  missionImpact: string;
  revenueRisk: string;
  longTermHealth: string;
}

/** Calibrated confidence. */
export interface RevenueConfidenceScore {
  value: number;
  level: RevenueConfidenceLevel;
  factors: Array<{ key: string; label: string; contribution: number }>;
}

/** Shared score card for revenue outputs. */
export interface RevenueScore {
  key: string;
  label: string;
  value: number;
  status: RevenueHealthStatus;
  band: RevenuePriorityBand;
  narrative: string;
}

/** Baseline signals when upstream modules are sparse. */
export interface RevenueBaseline {
  annualRevenue: number;
  recurringRevenue: number;
  oneTimeRevenue: number;
  growthRate: number;
  churnRate: number;
  nrr: number;
  grr: number;
  averageDealSize: number;
  pipelineCoverage: number;
  winRate: number;
  grossMargin: number;
  netMargin: number;
  contributionMargin: number;
  priceCompetitiveness: number;
  diversificationIndex: number;
  cashConversion: number;
  customerCount: number;
  arpu: number;
  ltv: number;
  cac: number;
  organizationHealthScore: number;
  financialScore: number;
}

/** Optional financial signal from organization-health / finance context. */
export interface FinancialSignal {
  revenue: number;
  expenses: number;
  marginPct: number;
}

/** Shared recommendation shape used across suites. */
export interface RevenueRecommendationRecord {
  id: string;
  title: string;
  priority: RevenuePriorityBand;
  score: number;
  rationale: string;
  expectedRevenueLift: number;
  profitabilityImpact: string;
  missionImpact: string;
  riskReduction: string;
  longTermHealth: string;
  lenses: RevenueLensImpact;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Strategy suite DTOs                                                         */
/* -------------------------------------------------------------------------- */

export interface RevenueMixRecord {
  id: string;
  stream: string;
  sharePct: number;
  growthRate: number;
  marginPct: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface DiversificationAnalysisResult {
  index: number;
  status: RevenueHealthStatus;
  streams: RevenueMixRecord[];
  concentrationRisk: number;
  recommendations: string[];
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface RecurringRevenueAnalysisResult {
  arr: number;
  mrr: number;
  nrr: number;
  grr: number;
  churnRate: number;
  status: RevenueHealthStatus;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface RevenueRiskRecord {
  id: string;
  title: string;
  score: number;
  band: RevenuePriorityBand;
  drivers: string[];
  mitigations: string[];
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface RevenueOptimizationRecord {
  id: string;
  lever: string;
  expectedLift: number;
  effort: RevenuePriorityBand;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface RevenueGrowthPlan {
  id: string;
  horizon: string;
  targetGrowthPct: number;
  initiatives: string[];
  investmentRequired: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface RevenueForecastPoint {
  period: string;
  revenue: number;
  recurring: number;
  oneTime: number;
  growthPct: number;
}

export interface RevenueScenarioPlan {
  id: string;
  name: string;
  description: string;
  revenueDelta: number;
  marginDelta: number;
  risk: RevenuePriorityBand;
  outcomes: string[];
  lenses: RevenueLensImpact;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Pricing suite DTOs                                                          */
/* -------------------------------------------------------------------------- */

export interface PricingRecommendation {
  id: string;
  offering: string;
  currentPrice: number;
  recommendedPrice: number;
  model: PricingModelKind;
  elasticity: number;
  expectedLift: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface PriceElasticityRecord {
  id: string;
  offering: string;
  elasticity: number;
  optimalPrice: number;
  demandSensitivity: number;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface CompetitivePricingRecord {
  id: string;
  offering: string;
  ourPrice: number;
  marketMedian: number;
  percentile: number;
  gap: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface DiscountOptimizationRecord {
  id: string;
  segment: string;
  currentDiscountPct: number;
  recommendedDiscountPct: number;
  marginImpact: number;
  volumeLift: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface ScholarshipPricingRecord {
  id: string;
  program: string;
  aidPct: number;
  missionScore: number;
  netRevenueImpact: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface ContractPricingRecord {
  id: string;
  contractType: string;
  termMonths: number;
  recommendedRate: number;
  riskBand: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface SubscriptionPricingRecord {
  id: string;
  plan: string;
  monthlyPrice: number;
  annualPrice: number;
  expectedChurn: number;
  ltvEstimate: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface DynamicPricingRecord {
  id: string;
  offering: string;
  basePrice: number;
  adjustedPrice: number;
  demandIndex: number;
  lenses: RevenueLensImpact;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Offering suite DTOs                                                         */
/* -------------------------------------------------------------------------- */

export interface OfferingRecord {
  id: string;
  name: string;
  category: string;
  revenue: number;
  marginPct: number;
  lifecycle: OfferingLifecycleStage;
  growthRate: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface ProductProfitabilityRecord {
  id: string;
  product: string;
  revenue: number;
  cogs: number;
  grossMarginPct: number;
  contributionMarginPct: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface ServiceProfitabilityRecord {
  id: string;
  service: string;
  revenue: number;
  deliveryCost: number;
  marginPct: number;
  utilization: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface MarginAnalysisResult {
  overallGrossMargin: number;
  overallContributionMargin: number;
  status: RevenueHealthStatus;
  byOffering: Array<{ offering: string; marginPct: number }>;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface LifecycleAnalysisResult {
  offerings: OfferingRecord[];
  introduceCount: number;
  growCount: number;
  matureCount: number;
  harvestCount: number;
  retireCount: number;
  status: RevenueHealthStatus;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface ExpansionRecommendation {
  id: string;
  opportunity: string;
  expectedRevenue: number;
  investment: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface RetirementRecommendation {
  id: string;
  offering: string;
  currentRevenue: number;
  marginPct: number;
  rationale: string;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Customer suite DTOs                                                         */
/* -------------------------------------------------------------------------- */

export interface CustomerLtvRecord {
  id: string;
  segment: string;
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  paybackMonths: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface RetentionRevenueRecord {
  id: string;
  segment: string;
  retentionRate: number;
  retainedRevenue: number;
  atRiskRevenue: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface ExpansionRevenueRecord {
  id: string;
  segment: string;
  expansionRate: number;
  expansionRevenue: number;
  opportunities: string[];
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface CrossSellRecord {
  id: string;
  fromOffering: string;
  toOffering: string;
  attachRate: number;
  expectedRevenue: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface UpsellRecord {
  id: string;
  segment: string;
  fromPlan: string;
  toPlan: string;
  conversionRate: number;
  expectedRevenue: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface CustomerProfitabilityRecord {
  id: string;
  segment: string;
  revenue: number;
  costToServe: number;
  marginPct: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface SegmentProfitabilityResult {
  segments: CustomerProfitabilityRecord[];
  topSegment: string;
  weakestSegment: string;
  status: RevenueHealthStatus;
  lenses: RevenueLensImpact;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Sales suite DTOs                                                            */
/* -------------------------------------------------------------------------- */

export interface PipelineForecastResult {
  totalPipeline: number;
  weightedPipeline: number;
  coverage: number;
  expectedClosed: number;
  stages: Array<{ stage: SalesPipelineStage; amount: number; count: number }>;
  status: RevenueHealthStatus;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface WinRateAnalysisResult {
  overallWinRate: number;
  byStage: Array<{ stage: SalesPipelineStage; winRate: number }>;
  trend: "up" | "stable" | "down";
  status: RevenueHealthStatus;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface SalesPerformanceRecord {
  id: string;
  repOrTeam: string;
  quotaAttainment: number;
  closedRevenue: number;
  winRate: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface SalesCapacityResult {
  capacityFte: number;
  requiredFte: number;
  gapFte: number;
  productivityPerRep: number;
  status: RevenueHealthStatus;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface TerritoryOptimizationRecord {
  id: string;
  territory: string;
  currentCoverage: number;
  recommendedCoverage: number;
  revenuePotential: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface ConversionAnalysisResult {
  overallConversion: number;
  funnel: Array<{ stage: SalesPipelineStage; conversionPct: number }>;
  leakPoints: string[];
  status: RevenueHealthStatus;
  lenses: RevenueLensImpact;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Market suite DTOs                                                           */
/* -------------------------------------------------------------------------- */

export interface MarketExpansionRecord {
  id: string;
  market: string;
  opportunityScore: number;
  expectedRevenue: number;
  investment: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface CompetitorRevenueRecord {
  id: string;
  competitor: string;
  estimatedShare: number;
  pricePosition: number;
  threat: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface DemandForecastPoint {
  period: string;
  demandIndex: number;
  expectedRevenue: number;
}

export interface DemandForecastResult {
  points: DemandForecastPoint[];
  trend: "up" | "stable" | "down";
  status: RevenueHealthStatus;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface OpportunityScoreRecord {
  id: string;
  opportunity: string;
  score: number;
  expectedRevenue: number;
  effort: RevenuePriorityBand;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface GeographicExpansionRecord {
  id: string;
  region: string;
  readiness: number;
  expectedRevenue: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface IndustryBenchmarkRecord {
  id: string;
  metric: string;
  ourValue: number;
  industryMedian: number;
  percentile: number;
  gap: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Financial / margin suite DTOs                                               */
/* -------------------------------------------------------------------------- */

export interface GrossMarginAnalysisResult {
  grossMarginPct: number;
  status: RevenueHealthStatus;
  drivers: string[];
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface NetMarginAnalysisResult {
  netMarginPct: number;
  status: RevenueHealthStatus;
  drivers: string[];
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface ContributionMarginResult {
  contributionMarginPct: number;
  status: RevenueHealthStatus;
  byOffering: Array<{ offering: string; cmPct: number }>;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface BreakEvenAnalysisResult {
  breakEvenRevenue: number;
  currentRevenue: number;
  cushionPct: number;
  status: RevenueHealthStatus;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface UnitEconomicsResult {
  arpu: number;
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  paybackMonths: number;
  status: RevenueHealthStatus;
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface CashGenerationAnalysisResult {
  cashConversion: number;
  operatingCashProxy: number;
  status: RevenueHealthStatus;
  drivers: string[];
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface RevenueSensitivityRecord {
  id: string;
  variable: string;
  deltaPct: number;
  revenueImpact: number;
  marginImpact: number;
  priority: RevenuePriorityBand;
  lenses: RevenueLensImpact;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Dashboards / outputs                                                        */
/* -------------------------------------------------------------------------- */

export interface RevenueDashboardResult {
  generatedAt: string;
  healthScore: number;
  growthScore: number;
  riskScore: number;
  annualRevenue: number;
  recurringShare: number;
  status: RevenueHealthStatus;
  headline: string;
  narrative: string;
}

export interface PricingDashboardResult {
  generatedAt: string;
  competitiveness: number;
  recommendationCount: number;
  expectedLift: number;
  recommendations: PricingRecommendation[];
  status: RevenueHealthStatus;
  narrative: string;
}

export interface MarginDashboardResult {
  generatedAt: string;
  grossMargin: number;
  netMargin: number;
  contributionMargin: number;
  status: RevenueHealthStatus;
  narrative: string;
}

export interface CustomerValueDashboardResult {
  generatedAt: string;
  averageLtv: number;
  averageCac: number;
  ltvCacRatio: number;
  nrr: number;
  status: RevenueHealthStatus;
  narrative: string;
}

export interface RevenueHealthResult {
  overallScore: number;
  status: RevenueHealthStatus;
  dimensions: {
    growth: number;
    recurring: number;
    margin: number;
    diversification: number;
    cash: number;
  };
  lenses: RevenueLensImpact;
  narrative: string;
}

export interface ExecutiveRevenueBrief {
  id: string;
  title: string;
  generatedAt: string;
  periodLabel: string;
  headline: string;
  revenueSummary: string;
  profitabilitySummary: string;
  growthSummary: string;
  riskSummary: string;
  missionSummary: string;
  decisionsNeeded: string[];
  watchItems: string[];
  confidence: RevenueConfidenceScore;
}

export interface RevenueProjectionResult {
  generatedAt: string;
  headline: string;
  healthScore: number;
  growthScore: number;
  riskScore: number;
  forecast: RevenueForecastPoint[];
  expansionOpportunities: ExpansionRecommendation[];
  pricingRecommendations: PricingRecommendation[];
  brief: ExecutiveRevenueBrief;
  dashboard: RevenueDashboardResult;
  pricingDashboard: PricingDashboardResult;
  marginDashboard: MarginDashboardResult;
  customerValueDashboard: CustomerValueDashboardResult;
  metrics: {
    annualRevenue: number;
    customerCount: number;
    pipelineCoverage: number;
    winRate: number;
    grossMargin: number;
    nrr: number;
  };
  overallConfidence: RevenueConfidenceScore;
}

/** Query request. */
export interface RevenueQueryRequest {
  question: string;
  focus?:
    | "general"
    | "strategy"
    | "pricing"
    | "offerings"
    | "customers"
    | "sales"
    | "market"
    | "margins"
    | "forecast"
    | "risk";
  maxResults?: number;
}

/** Query answer. */
export interface RevenueQueryResult {
  question: string;
  focus: NonNullable<RevenueQueryRequest["focus"]>;
  answer: string;
  references: string[];
  confidence: RevenueConfidenceScore;
}

/** History / audit record. */
export interface RevenueHistoryRecord {
  id: string;
  requestId: string;
  generatedAt: string;
  status: RevenueArtifactStatus;
  summary: string;
  scope: GraphScope;
  confidence: RevenueConfidenceScore;
  scores: {
    health: number;
    growth: number;
    risk: number;
  };
}

/**
 * Optional light human-capital result attachment (avoid hard coupling).
 * Unknown-safe: callers may pass a partial HC result or opaque payload.
 */
export type HumanCapitalResultLight = {
  requestId?: string;
  workforceHealthScore?: { value?: number };
  recommendations?: string[];
} & Record<string, unknown>;

/** Primary generation request. */
export interface RevenueRequest {
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
  financialSignal?: FinancialSignal;
  baselineOverrides?: Partial<RevenueBaseline>;
  metadata?: RevenueMetadata;
}

/** Full revenue generation result. */
export interface RevenueResult {
  requestId: string;
  version: string;
  generatedAt: string;
  periodLabel: string;
  scope: GraphScope;
  baseline: RevenueBaseline;
  /** Core scores */
  healthScore: RevenueScore;
  growthScore: RevenueScore;
  riskScore: RevenueScore;
  revenueHealth: RevenueHealthResult;
  /** Dashboards */
  dashboard: RevenueDashboardResult;
  pricingDashboard: PricingDashboardResult;
  marginDashboard: MarginDashboardResult;
  customerValueDashboard: CustomerValueDashboardResult;
  /** Strategy */
  mix: RevenueMixRecord[];
  diversification: DiversificationAnalysisResult;
  recurring: RecurringRevenueAnalysisResult;
  risks: RevenueRiskRecord[];
  optimizations: RevenueOptimizationRecord[];
  growthPlans: RevenueGrowthPlan[];
  forecast: RevenueForecastPoint[];
  scenarios: RevenueScenarioPlan[];
  /** Pricing */
  pricingRecommendations: PricingRecommendation[];
  dynamicPricing: DynamicPricingRecord[];
  elasticity: PriceElasticityRecord[];
  competitivePricing: CompetitivePricingRecord[];
  discounts: DiscountOptimizationRecord[];
  scholarships: ScholarshipPricingRecord[];
  contracts: ContractPricingRecord[];
  subscriptions: SubscriptionPricingRecord[];
  /** Offerings */
  offerings: OfferingRecord[];
  productProfitability: ProductProfitabilityRecord[];
  serviceProfitability: ServiceProfitabilityRecord[];
  marginAnalysis: MarginAnalysisResult;
  lifecycle: LifecycleAnalysisResult;
  expansionOpportunities: ExpansionRecommendation[];
  retirements: RetirementRecommendation[];
  /** Customers */
  customerLtv: CustomerLtvRecord[];
  retentionRevenue: RetentionRevenueRecord[];
  expansionRevenue: ExpansionRevenueRecord[];
  crossSell: CrossSellRecord[];
  upsell: UpsellRecord[];
  customerProfitability: CustomerProfitabilityRecord[];
  segmentProfitability: SegmentProfitabilityResult;
  /** Sales */
  pipeline: PipelineForecastResult;
  winRate: WinRateAnalysisResult;
  salesPerformance: SalesPerformanceRecord[];
  salesCapacity: SalesCapacityResult;
  territories: TerritoryOptimizationRecord[];
  conversion: ConversionAnalysisResult;
  /** Market */
  marketExpansion: MarketExpansionRecord[];
  competitors: CompetitorRevenueRecord[];
  demandForecast: DemandForecastResult;
  opportunities: OpportunityScoreRecord[];
  geographicExpansion: GeographicExpansionRecord[];
  industryBenchmarks: IndustryBenchmarkRecord[];
  /** Financial margins */
  grossMargin: GrossMarginAnalysisResult;
  netMargin: NetMarginAnalysisResult;
  contributionMargin: ContributionMarginResult;
  breakEven: BreakEvenAnalysisResult;
  unitEconomics: UnitEconomicsResult;
  cashGeneration: CashGenerationAnalysisResult;
  sensitivity: RevenueSensitivityRecord[];
  /** Outputs */
  brief: ExecutiveRevenueBrief;
  projection: RevenueProjectionResult;
  confidence: RevenueConfidenceScore;
  historyRecord: RevenueHistoryRecord;
  recommendations: string[];
}
