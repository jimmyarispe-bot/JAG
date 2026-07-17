/**
 * Economic Intelligence — shared types / DTOs.
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 */

import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { Graph, GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type { ResultLightBase } from "@/lib/platform/intelligence/common/result-lights";

export const ECONOMIC_INTELLIGENCE_VERSION = "0.1.0";
export const ECONOMIC_CAPABILITIES = [
  "inflation", "interest_rates", "gdp", "employment", "labor_market", "wage_trends",
  "housing", "healthcare", "energy", "supply_chains", "commodity_prices", "currency",
  "government_spending", "tax_environment", "consumer_spending", "industry_conditions",
  "regional_economics", "international_economics", "economic_trends", "economic_forecasts",
  "scenario_planning", "cost_pressure_analysis", "labor_availability", "funding_environment",
  "purchasing_power", "pricing_pressure", "economic_risk", "economic_opportunity",
  "economic_sensitivity", "recommendation_generation", "knowledge_contribution",
  "closed_learning_loop",
] as const;
export const ECONOMIC_AREAS = [
  "inflation", "interest_rates", "gdp", "employment", "labor_market", "wage_trends",
  "housing", "healthcare", "energy", "supply_chains", "commodity_prices", "currency",
  "government_spending", "tax_environment", "consumer_spending", "industry_conditions",
  "regional_economics", "international_economics",
] as const;
export const ECONOMIC_SCENARIOS = [
  "expansion", "recession", "high_inflation", "low_inflation", "rapid_growth",
  "labor_shortage", "supply_chain_disruption", "interest_rate_shock",
  "government_policy_change", "regional_economic_shift",
] as const;
export const ECONOMIC_ANALYSIS_KINDS = [
  "trends", "forecasts", "scenario_planning", "cost_pressure", "labor_availability",
  "funding_environment", "purchasing_power", "pricing_pressure", "economic_risk",
  "economic_opportunity", "economic_sensitivity",
] as const;
export const ECONOMIC_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export const ECONOMIC_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export const ECONOMIC_ARTIFACT_STATUSES = ["draft", "assessed", "monitored", "at_risk", "improving", "favorable", "deferred"] as const;
export const ECONOMIC_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export const ECONOMIC_OUTLOOKS = ["expansionary", "stable", "contractionary", "volatile", "uncertain"] as const;

export type EconomicCapability = typeof ECONOMIC_CAPABILITIES[number];
export type EconomicArea = typeof ECONOMIC_AREAS[number];
export type EconomicScenarioKind = typeof ECONOMIC_SCENARIOS[number];
export type EconomicAnalysisKind = typeof ECONOMIC_ANALYSIS_KINDS[number];
export type EconomicHealthStatus = typeof ECONOMIC_HEALTH_STATUSES[number];
export type EconomicPriorityBand = typeof ECONOMIC_PRIORITY_BANDS[number];
export type EconomicArtifactStatus = typeof ECONOMIC_ARTIFACT_STATUSES[number];
export type EconomicConfidenceLevel = typeof ECONOMIC_CONFIDENCE_LEVELS[number];
export type EconomicOutlook = typeof ECONOMIC_OUTLOOKS[number];
export type EconomicMetadata = Record<string, unknown>;
export type { GraphScope };

/** Every economic recommendation answers these eight leadership questions. */
export interface EconomicLens {
  economicForces: string;
  evidenceSupports: string;
  confidenceLevel: string;
  organizationalAreas: string;
  financialImplications: string;
  operationalImplications: string;
  strategicOptions: string;
  scenariosToMonitor: string;
}

export interface EconomicScore { key: string; label: string; value: number; status: EconomicHealthStatus; band: EconomicPriorityBand; narrative: string; }
export interface EconomicConfidenceScore { value: number; level: EconomicConfidenceLevel; factors: Array<{ key: string; label: string; contribution: number }>; }

export interface MarketResultLight extends ResultLightBase { marketScore?: { value?: number }; economicTrendScore?: { value?: number }; }
export interface RevenueResultLight extends ResultLightBase { revenueScore?: { value?: number }; pricingPressure?: { value?: number }; }
export interface FundingResultLight extends ResultLightBase { fundingScore?: { value?: number }; capitalAvailability?: { value?: number }; }
export interface BusinessModelResultLight extends ResultLightBase { businessModelScore?: { value?: number }; }
export interface OperationsResultLight extends ResultLightBase { operationsScore?: { value?: number }; costPressure?: { value?: number }; }
export interface OpportunityResultLight extends ResultLightBase { opportunityScore?: { value?: number }; }
export interface InnovationResultLight extends ResultLightBase { innovationScore?: { value?: number }; }
export interface ImpactResultLight extends ResultLightBase { impactScore?: { value?: number }; financialScore?: { value?: number }; }
export interface DecisionResultLight extends ResultLightBase { confidence?: { value?: number }; }
export interface PredictiveResultLight extends ResultLightBase { predictiveScore?: { value?: number }; }

export interface EconomicBaseline {
  organizationHealthScore: number;
  executionScore: number;
  areaScores: Record<EconomicArea, number>;
  inflationPressure: number;
  laborAvailability: number;
  fundingEnvironment: number;
  costPressure: number;
  purchasingPower: number;
  pricingPressure: number;
  forecastMaturity: number;
  scenarioMaturity: number;
  evidenceCoverage: number;
}

export interface EconomicAreaRecord {
  id: string; area: EconomicArea; title: string; score: number; status: EconomicArtifactStatus;
  signal: string; evidence: string[]; lenses: EconomicLens; narrative: string;
}
export interface EconomicAreaSuite {
  area: EconomicArea; records: EconomicAreaRecord[]; score: number;
  favorableCount: number; atRiskCount: number; narrative: string;
}

export interface EconomicTrendRecord {
  id: string; area: EconomicArea; title: string; direction: "improving" | "stable" | "worsening";
  magnitude: number; confidence: EconomicConfidenceLevel; lenses: EconomicLens; narrative: string;
}
export interface EconomicTrendSuite { trends: EconomicTrendRecord[]; improvingCount: number; worseningCount: number; narrative: string; }

export interface EconomicForecastRecord {
  id: string; area: EconomicArea; horizon: "near" | "medium" | "long";
  baseline: number; forecast: number; low: number; high: number;
  confidence: EconomicConfidenceLevel; lenses: EconomicLens; narrative: string;
}
export interface EconomicForecastSuite {
  forecasts: EconomicForecastRecord[]; outlook: EconomicOutlook;
  maturityScore: number; narrative: string;
}

export interface EconomicScenarioRecord {
  id: string; kind: EconomicScenarioKind; title: string; probability: number;
  severity: EconomicPriorityBand; organizationalImpact: number;
  financialImpact: number; operationalImpact: number; monitors: string[];
  lenses: EconomicLens; narrative: string;
}
export interface EconomicScenarioSuite {
  scenarios: EconomicScenarioRecord[]; primaryScenario: EconomicScenarioKind;
  monitoredCount: number; narrative: string;
}

export interface EconomicAnalysisRecord {
  id: string; kind: EconomicAnalysisKind; title: string; score: number;
  status: EconomicArtifactStatus; lenses: EconomicLens; narrative: string;
}
export interface EconomicAnalysisSuite {
  analyses: EconomicAnalysisRecord[]; kindsCovered: EconomicAnalysisKind[];
  maturityScore: number; narrative: string;
}

export interface EconomicKnowledgeDraft {
  id: string; type: string; title: string; confidence: number;
  sourceRef: string; validated: boolean; metadata: EconomicMetadata;
}
export interface EconomicKnowledgeContribution {
  artifacts: EconomicKnowledgeDraft[]; contributionScore: number;
  validatedCount: number; narrative: string;
}
export interface ClosedLearningLoopContribution {
  id: string;
  destinations: Array<"market" | "revenue" | "funding" | "operations" | "opportunity" | "executive-decision" | "predictive">;
  lessons: string[]; improvementActions: string[]; decisionSignals: string[];
  forecastSignals: string[]; contributedAt: string; narrative: string;
}

export interface EconomicRecommendationRecord {
  id: string; title: string; priority: EconomicPriorityBand; evidenceRefs: string[];
  confidenceScore: number; owner: string; dueDate: string; rationale: string;
  action: string; lenses: EconomicLens; narrative: string;
}
export interface EconomicRiskRecord {
  id: string; title: string; area: EconomicArea; severity: EconomicPriorityBand;
  score: number; mitigation: string; lenses: EconomicLens; narrative: string;
}
export interface EconomicOpportunityRecord {
  id: string; title: string; area: EconomicArea; priority: EconomicPriorityBand;
  score: number; lenses: EconomicLens; narrative: string;
}

export interface EconomicDashboard {
  generatedAt: string; headline: string; overall: number;
  areaScores: Record<EconomicArea, number>; outlook: EconomicOutlook;
  costPressure: number; laborAvailability: number; fundingEnvironment: number;
  topRisks: string[]; topOpportunities: string[]; narrative: string;
}
export interface EconomicOutlookDashboard {
  generatedAt: string; headline: string; outlook: EconomicOutlook;
  overall: number; primaryScenario: EconomicScenarioKind; narrative: string;
}
export interface InflationDashboard {
  generatedAt: string; headline: string; score: number;
  pressure: number; signals: string[]; narrative: string;
}
export interface LaborMarketDashboard {
  generatedAt: string; headline: string; score: number;
  availability: number; wagePressure: number; signals: string[]; narrative: string;
}
export interface CostPressureDashboard {
  generatedAt: string; headline: string; score: number;
  costPressure: number; pricingPressure: number; signals: string[]; narrative: string;
}
export interface EconomicForecastDashboard {
  generatedAt: string; headline: string; outlook: EconomicOutlook;
  maturityScore: number; forecasts: string[]; narrative: string;
}
export interface ExecutiveEconomicBrief {
  generatedAt: string; headline: string; summary: string; healthScore: number;
  outlook: EconomicOutlook; topRecommendations: string[]; topRisks: string[];
  lenses: EconomicLens; narrative: string;
}
export interface BoardEconomicReport {
  generatedAt: string; headline: string; assuranceSummary: string;
  healthScore: number; outlook: EconomicOutlook; inflationScore: number;
  laborScore: number; fundingEnvironment: number; recommendations: string[];
  lenses: EconomicLens; narrative: string;
}
export interface EconomicHealthScore {
  overallScore: number; status: EconomicHealthStatus; outlook: EconomicOutlook;
  areaScores: Record<EconomicArea, number>; inflationScore: number;
  laborScore: number; costPressureScore: number; fundingScore: number;
  forecastScore: number; scenarioScore: number; lenses: EconomicLens; narrative: string;
}
export interface EconomicReasoningResult {
  answer: string; connectedForces: string[]; evidenceGaps: string[];
  confidence: EconomicConfidenceScore; narrative: string;
}
export interface EconomicProjectionResult {
  generatedAt: string; headline: string; healthScore: number;
  areaScores: Record<EconomicArea, number>; outlook: EconomicOutlook;
  forecast: number; dashboard: EconomicDashboard; brief: ExecutiveEconomicBrief;
  overallConfidence: EconomicConfidenceScore;
}
export interface EconomicHistoryRecord {
  id: string; requestId: string; scope: GraphScope; status: EconomicArtifactStatus;
  healthScore: number; generatedAt: string; summary: string; metadata: EconomicMetadata;
}
export interface EconomicPublisher { domain: string; capability: string; }
export interface EconomicQueryRequest {
  question: string;
  focus?: "general" | EconomicArea | "trends" | "forecasts" | "scenarios" | "analysis" | "recommendations" | "reasoning" | "learning";
  maxResults?: number;
}
export interface EconomicQueryResult {
  question: string; focus: string; answer: string; references: string[];
  confidence: EconomicConfidenceScore;
}

export interface EconomicRequest {
  requestId: string; question?: string; periodLabel?: string; scope?: GraphScope;
  dna?: OrganizationDNA; dnaResult?: OrganizationDnaResult; oiosResult?: OiosResult;
  graph?: Graph; analysis?: GraphAnalysisResult; graphInput?: GraphBuildInput;
  marketResult?: MarketResultLight; revenueResult?: RevenueResultLight;
  fundingResult?: FundingResultLight; businessModelResult?: BusinessModelResultLight;
  operationsResult?: OperationsResultLight; opportunityResult?: OpportunityResultLight;
  innovationResult?: InnovationResultLight; impactResult?: ImpactResultLight;
  decisionResult?: DecisionResultLight; predictiveResult?: PredictiveResultLight;
  baselineOverrides?: Partial<EconomicBaseline>; metadata?: EconomicMetadata;
}

export interface EconomicResult {
  requestId: string; version: string; generatedAt: string; periodLabel: string;
  scope: GraphScope; baseline: EconomicBaseline;
  healthScore: EconomicScore; inflationScore: EconomicScore; interestRatesScore: EconomicScore;
  gdpScore: EconomicScore; employmentScore: EconomicScore; laborMarketScore: EconomicScore;
  wageTrendsScore: EconomicScore; housingScore: EconomicScore; healthcareScore: EconomicScore;
  energyScore: EconomicScore; supplyChainsScore: EconomicScore; commodityPricesScore: EconomicScore;
  currencyScore: EconomicScore; governmentSpendingScore: EconomicScore; taxEnvironmentScore: EconomicScore;
  consumerSpendingScore: EconomicScore; industryConditionsScore: EconomicScore;
  regionalEconomicsScore: EconomicScore; internationalEconomicsScore: EconomicScore;
  forecastScore: EconomicScore; scenarioScore: EconomicScore; analysisScore: EconomicScore;
  health: EconomicHealthScore; dashboard: EconomicDashboard;
  outlookDashboard: EconomicOutlookDashboard; inflationDashboard: InflationDashboard;
  laborMarketDashboard: LaborMarketDashboard; costPressureDashboard: CostPressureDashboard;
  forecastDashboard: EconomicForecastDashboard;
  brief: ExecutiveEconomicBrief; boardReport: BoardEconomicReport;
  recommendations: EconomicRecommendationRecord[]; risks: EconomicRiskRecord[];
  opportunities: EconomicOpportunityRecord[];
  areaSuites: Record<EconomicArea, EconomicAreaSuite>;
  trendSuite: EconomicTrendSuite; forecastSuite: EconomicForecastSuite;
  scenarioSuite: EconomicScenarioSuite; analysisSuite: EconomicAnalysisSuite;
  knowledgeContribution: EconomicKnowledgeContribution;
  closedLearningLoop: ClosedLearningLoopContribution;
  reasoning: EconomicReasoningResult; projection: EconomicProjectionResult;
  historyRecord: EconomicHistoryRecord; confidence: EconomicConfidenceScore;
  requestMetadata: EconomicMetadata;
}
