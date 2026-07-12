/**
 * Market Intelligence — shared DTOs and constants (Sprint 043).
 *
 * Organizational market awareness (NOT marketing analytics): continuously
 * understand the external environment so leadership can anticipate change.
 * Composes onto Legal Compliance & Risk (Sprint 042) and the wider OIOS.
 */

import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
  GraphScope,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";

export const MARKET_INTELLIGENCE_VERSION = "0.1.0";

export type MarketMetadata = Record<string, unknown>;
export type { GraphScope };

export const MARKET_CAPABILITIES = [
  "industry_intelligence",
  "competitive_intelligence",
  "market_size_intelligence",
  "pricing_intelligence",
  "customer_demand_intelligence",
  "demographic_intelligence",
  "geographic_expansion_intelligence",
  "economic_trend_intelligence",
  "technology_trend_intelligence",
  "partnership_intelligence",
  "mergers_acquisitions_intelligence",
  "white_space_opportunity_intelligence",
  "recommendation_generation",
  "knowledge_contribution",
] as const;
export type MarketCapability = (typeof MARKET_CAPABILITIES)[number];

export const MARKET_SIGNAL_KINDS = [
  "competitor_launches",
  "competitor_pricing",
  "industry_reports",
  "customer_demand_shifts",
  "population_changes",
  "employment_trends",
  "economic_indicators",
  "regulatory_changes",
  "technology_disruption",
  "emerging_markets",
  "industry_consolidation",
] as const;
export type MarketSignalKind = (typeof MARKET_SIGNAL_KINDS)[number];

export const MARKET_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export type MarketConfidenceLevel = (typeof MARKET_CONFIDENCE_LEVELS)[number];

export const MARKET_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export type MarketPriorityBand = (typeof MARKET_PRIORITY_BANDS)[number];

export const MARKET_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export type MarketHealthStatus = (typeof MARKET_HEALTH_STATUSES)[number];

export const MARKET_ARTIFACT_STATUSES = [
  "draft",
  "assessed",
  "monitored",
  "at_risk",
  "advancing",
  "captured",
  "deferred",
] as const;
export type MarketArtifactStatus = (typeof MARKET_ARTIFACT_STATUSES)[number];

/**
 * The market recommendation lens (8 required fields).
 * Every recommendation and market record surfaces this lens.
 */
export interface MarketLens {
  marketOpportunityExists: string;
  evidenceSupports: string;
  competitorsInvolved: string;
  estimatedMarketSize: string;
  risksExist: string;
  investmentRequired: string;
  expectedReturn: string;
  organizationalCapabilitiesRequired: string;
}

export interface MarketConfidenceScore {
  value: number;
  level: MarketConfidenceLevel;
  factors: Array<{ key: string; label: string; contribution: number }>;
}

export interface MarketScore {
  key: string;
  label: string;
  value: number;
  status: MarketHealthStatus;
  band: MarketPriorityBand;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Soft integration light types (baseline derivation only).
 * ------------------------------------------------------------------ */

export interface KnowledgeResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  coverageScore?: { value?: number };
  contributionScore?: { value?: number };
  baseline?: { coverageScore?: number; validatedRatio?: number; gapPressure?: number };
  recommendations?: string[];
}

export interface DocumentResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  complianceScore?: { value?: number };
  riskScore?: { value?: number };
  baseline?: {
    complianceCoverage?: number;
    riskPressure?: number;
    contractDensity?: number;
    documentCount?: number;
  };
  recommendations?: string[];
}

export interface LegalComplianceRiskResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  riskScore?: { value?: number };
  complianceHealthScore?: { value?: number };
  baseline?: { riskPressure?: number; complianceCoverage?: number; regulatoryCoverage?: number };
  recommendations?: string[];
}

export interface RevenueResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { revenueDiversification?: number; pricingPower?: number; pipelineCoverage?: number };
  recommendations?: string[];
}

export interface FundingResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { grantReadiness?: number; pipelineCoverage?: number; fundingCapacity?: number };
  recommendations?: string[];
}

export interface CustomerResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: {
    familyExperienceScore?: number;
    demandMomentum?: number;
    communicationCoverage?: number;
    complaintBurden?: number;
  };
  recommendations?: string[];
}

export interface BusinessModelResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { businessModelFit?: number; valuePropositionStrength?: number; monetizationClarity?: number };
  recommendations?: string[];
}

export interface OperationsResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  workflowScore?: { value?: number };
  baseline?: { operationsScore?: number; processCoverage?: number; capacityScore?: number };
  recommendations?: string[];
}

export interface PredictiveResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { growthSignal?: number; scenarioCoverage?: number };
  recommendations?: string[];
}

export interface OpportunityResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { opportunityDensity?: number; captureReadiness?: number };
  recommendations?: string[];
}

/* ------------------------------------------------------------------ *
 * Baseline
 * ------------------------------------------------------------------ */

export interface MarketBaseline {
  organizationHealthScore: number;
  executionScore: number;
  industryAttractiveness: number;
  competitivePressure: number;
  competitivePosition: number;
  marketSizeIndex: number;
  pricingPower: number;
  demandMomentum: number;
  demographicFit: number;
  geographicExpansionReadiness: number;
  economicTailwind: number;
  technologyDisruptionPressure: number;
  partnershipDensity: number;
  maActivity: number;
  whiteSpaceScore: number;
  knowledgeContributionScore: number;
  documentMarketCoverage: number;
  legalRegulatoryPressure: number;
  revenueDiversification: number;
  fundingCapacity: number;
  customerDemandProxy: number;
  businessModelFit: number;
  operationsCapacity: number;
  predictiveGrowthSignal: number;
  opportunityDensity: number;
  competitorCount: number;
  expansionCandidateCount: number;
  signalDensity: number;
  marketShareEstimate: number;
}

/* ------------------------------------------------------------------ *
 * Industry Intelligence
 * ------------------------------------------------------------------ */

export interface IndustrySegmentRecord {
  id: string;
  name: string;
  attractiveness: number;
  growthRate: number;
  maturity: string;
  regulatoryPressure: number;
  narrative: string;
}

export interface IndustrySuite {
  segments: IndustrySegmentRecord[];
  attractivenessScore: number;
  growthOutlook: number;
  consolidationPressure: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Competitive Intelligence
 * ------------------------------------------------------------------ */

export interface CompetitorRecord {
  id: string;
  name: string;
  segment: string;
  marketShare: number;
  pricingPosition: string;
  launchSignals: string[];
  pricingSignals: string[];
  threatScore: number;
  narrative: string;
}

export interface CompetitiveSuite {
  competitors: CompetitorRecord[];
  competitivePressure: number;
  positionScore: number;
  launchSignalCount: number;
  pricingSignalCount: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Market Size Intelligence (TAM / SAM / SOM)
 * ------------------------------------------------------------------ */

export interface MarketSizeEstimate {
  tam: number;
  sam: number;
  som: number;
  samToTamRatio: number;
  somToSamRatio: number;
  currency: string;
  narrative: string;
}

export interface MarketSizeSuite {
  estimates: MarketSizeEstimate;
  sizeIndex: number;
  addressableShare: number;
  capturePotential: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Pricing Intelligence
 * ------------------------------------------------------------------ */

export interface PricingBandRecord {
  id: string;
  segment: string;
  low: number;
  mid: number;
  high: number;
  ourPosition: number;
  powerScore: number;
  narrative: string;
}

export interface PricingSuite {
  bands: PricingBandRecord[];
  pricingPower: number;
  elasticityPressure: number;
  premiumHeadroom: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Customer Demand Intelligence
 * ------------------------------------------------------------------ */

export interface DemandSignalRecord {
  id: string;
  theme: string;
  momentum: number;
  intensity: number;
  segment: string;
  narrative: string;
}

export interface CustomerDemandSuite {
  signals: DemandSignalRecord[];
  demandScore: number;
  shiftPressure: number;
  unmetNeedCount: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Demographic Intelligence
 * ------------------------------------------------------------------ */

export interface DemographicCohortRecord {
  id: string;
  cohort: string;
  fitScore: number;
  growthRate: number;
  sizeIndex: number;
  narrative: string;
}

export interface DemographicSuite {
  cohorts: DemographicCohortRecord[];
  fitScore: number;
  populationMomentum: number;
  employmentAlignment: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Geographic Expansion Intelligence
 * ------------------------------------------------------------------ */

export interface ExpansionCandidateRecord {
  id: string;
  region: string;
  readiness: number;
  marketAttractiveness: number;
  competitiveIntensity: number;
  investmentEstimate: number;
  expectedReturn: number;
  narrative: string;
  lenses: MarketLens;
}

export interface GeographicExpansionSuite {
  candidates: ExpansionCandidateRecord[];
  readinessScore: number;
  topCandidate: string | null;
  expansionPressure: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Economic Trend Intelligence
 * ------------------------------------------------------------------ */

export interface EconomicIndicatorRecord {
  id: string;
  indicator: string;
  value: number;
  direction: "improving" | "stable" | "worsening";
  impactScore: number;
  narrative: string;
}

export interface EconomicTrendSuite {
  indicators: EconomicIndicatorRecord[];
  tailwindScore: number;
  volatilityPressure: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Technology Trend Intelligence
 * ------------------------------------------------------------------ */

export interface TechnologyTrendRecord {
  id: string;
  trend: string;
  disruptionPressure: number;
  adoptionStage: string;
  opportunityScore: number;
  narrative: string;
}

export interface TechnologyTrendSuite {
  trends: TechnologyTrendRecord[];
  disruptionScore: number;
  opportunityScore: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Partnership Intelligence
 * ------------------------------------------------------------------ */

export interface PartnershipRecord {
  id: string;
  partner: string;
  type: string;
  strategicFit: number;
  densityContribution: number;
  status: MarketArtifactStatus;
  narrative: string;
  lenses: MarketLens;
}

export interface PartnershipSuite {
  partnerships: PartnershipRecord[];
  densityScore: number;
  pipelineCount: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Mergers & Acquisitions Intelligence
 * ------------------------------------------------------------------ */

export interface MaTargetRecord {
  id: string;
  name: string;
  rationale: string;
  strategicFit: number;
  valuationIndex: number;
  riskScore: number;
  status: MarketArtifactStatus;
  narrative: string;
  lenses: MarketLens;
}

export interface MergersAcquisitionsSuite {
  targets: MaTargetRecord[];
  activityScore: number;
  consolidationPressure: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * White Space Intelligence
 * ------------------------------------------------------------------ */

export interface WhiteSpaceOpportunityRecord {
  id: string;
  unmetNeed: string;
  segment: string;
  sizeEstimate: number;
  competitiveGap: number;
  captureScore: number;
  narrative: string;
  lenses: MarketLens;
}

export interface WhiteSpaceSuite {
  opportunities: WhiteSpaceOpportunityRecord[];
  whiteSpaceScore: number;
  unmetNeedCount: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Market Signals
 * ------------------------------------------------------------------ */

export interface MarketSignalRecord {
  id: string;
  kind: MarketSignalKind;
  title: string;
  intensity: number;
  sourceRef: string;
  narrative: string;
}

export interface MarketSignalsSuite {
  signals: MarketSignalRecord[];
  byKind: Record<MarketSignalKind, number>;
  densityScore: number;
  hottestKind: MarketSignalKind;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Reasoning
 * ------------------------------------------------------------------ */

export interface MarketReasoningResult {
  answer: string;
  connectedOpportunities: string[];
  competitors: string[];
  missingTopics: string[];
  confidence: MarketConfidenceScore;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Knowledge contribution
 * ------------------------------------------------------------------ */

export interface MarketKnowledgeDraft {
  id: string;
  type: string;
  title: string;
  confidence: number;
  sourceRef: string;
  validated: boolean;
  metadata: MarketMetadata;
}

export interface MarketKnowledgeContribution {
  artifacts: MarketKnowledgeDraft[];
  contributionScore: number;
  validatedCount: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Health, dashboards, briefs
 * ------------------------------------------------------------------ */

export interface MarketHealthResult {
  overallScore: number;
  status: MarketHealthStatus;
  dimensions: Record<string, number>;
  lenses: MarketLens;
  narrative: string;
}

export interface MarketDashboardResult {
  generatedAt: string;
  headline: string;
  overall: number;
  competitivePositionScore: number;
  expansionOpportunityScore: number;
  marketRiskScore: number;
  industryScore: number;
  marketSizeScore: number;
  topRisks: string[];
  topOpportunities: string[];
  narrative: string;
}

export interface CompetitiveDashboardResult {
  generatedAt: string;
  headline: string;
  positionScore: number;
  competitivePressure: number;
  competitorCount: number;
  topCompetitors: string[];
  launchSignals: number;
  narrative: string;
}

export interface ExpansionDashboardResult {
  generatedAt: string;
  headline: string;
  readinessScore: number;
  candidateCount: number;
  topCandidate: string | null;
  whiteSpaceScore: number;
  narrative: string;
}

export interface TrendDashboardResult {
  generatedAt: string;
  headline: string;
  economicTailwind: number;
  technologyDisruption: number;
  demandMomentum: number;
  hottestSignal: MarketSignalKind;
  narrative: string;
}

export interface MarketRiskRecord {
  id: string;
  title: string;
  category: string;
  severity: MarketPriorityBand;
  score: number;
  mitigation: string;
  lenses: MarketLens;
  narrative: string;
}

export interface MarketOpportunityRecord {
  id: string;
  title: string;
  priority: MarketPriorityBand;
  score: number;
  expectedValue: number;
  marketSizeEstimate: number;
  lenses: MarketLens;
  narrative: string;
}

/**
 * A market recommendation. Carries the 8-field lens plus evidence,
 * confidence, risk, size/investment/return estimates, competitors,
 * capabilities, owner, due date, and priority.
 */
export interface MarketRecommendationRecord {
  id: string;
  title: string;
  priority: MarketPriorityBand;
  evidenceRefs: string[];
  confidenceScore: number;
  riskScore: number;
  marketSizeEstimate: number;
  investmentEstimate: number;
  expectedReturnEstimate: number;
  competitors: string[];
  capabilitiesRequired: string[];
  owner: string;
  dueDate: string;
  rationale: string;
  action: string;
  lenses: MarketLens;
  narrative: string;
}

export interface ExecutiveMarketBrief {
  generatedAt: string;
  headline: string;
  summary: string;
  healthScore: number;
  competitivePositionScore: number;
  expansionOpportunityScore: number;
  marketRiskScore: number;
  topRecommendations: string[];
  topRisks: string[];
  topOpportunities: string[];
  hottestSignal: MarketSignalKind;
  lenses: MarketLens;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Projection / history / query
 * ------------------------------------------------------------------ */

export interface MarketProjectionResult {
  generatedAt: string;
  headline: string;
  healthScore: number;
  competitivePositionScore: number;
  expansionOpportunityScore: number;
  marketRiskScore: number;
  industryScore: number;
  marketSizeScore: number;
  pricingScore: number;
  demandScore: number;
  demographicScore: number;
  geographicScore: number;
  economicScore: number;
  technologyScore: number;
  partnershipScore: number;
  maScore: number;
  whiteSpaceScore: number;
  dashboard: MarketDashboardResult;
  competitiveDashboard: CompetitiveDashboardResult;
  expansionDashboard: ExpansionDashboardResult;
  trendDashboard: TrendDashboardResult;
  brief: ExecutiveMarketBrief;
  metrics: {
    competitorCount: number;
    expansionCandidateCount: number;
    signalDensity: number;
    marketShareEstimate: number;
    tam: number;
    sam: number;
    som: number;
  };
  overallConfidence: MarketConfidenceScore;
}

export interface MarketHistoryRecord {
  id: string;
  requestId: string;
  scope: GraphScope;
  status: MarketArtifactStatus;
  healthScore: number;
  competitivePositionScore: number;
  marketRiskScore: number;
  generatedAt: string;
  summary: string;
  metadata: MarketMetadata;
}

export interface MarketQueryRequest {
  question: string;
  focus?:
    | "general"
    | "industry"
    | "competitive"
    | "market_size"
    | "pricing"
    | "demand"
    | "demographic"
    | "geographic"
    | "economic"
    | "technology"
    | "partnership"
    | "ma"
    | "white_space"
    | "signals"
    | "recommendations"
    | "reasoning";
  maxResults?: number;
}

export interface MarketQueryResult {
  question: string;
  focus: string;
  answer: string;
  references: string[];
  confidence: MarketConfidenceScore;
}

export interface MarketPublisher {
  domain: string;
  capability: string;
}

/* ------------------------------------------------------------------ *
 * Request / Result
 * ------------------------------------------------------------------ */

export interface MarketRequest {
  requestId: string;
  question?: string;
  periodLabel?: string;
  scope?: GraphScope;
  dna?: OrganizationDNA;
  dnaResult?: OrganizationDnaResult;
  oiosResult?: OiosResult;
  graph?: Graph;
  analysis?: GraphAnalysisResult;
  graphInput?: GraphBuildInput;
  predictionResult?: PredictionResult | PredictiveResultLight;
  knowledgeResult?: KnowledgeResultLight;
  documentResult?: DocumentResultLight;
  legalComplianceRiskResult?: LegalComplianceRiskResultLight;
  revenueResult?: RevenueResultLight;
  fundingResult?: FundingResultLight;
  customerResult?: CustomerResultLight;
  businessModelResult?: BusinessModelResultLight;
  operationsResult?: OperationsResultLight;
  opportunityResult?: OpportunityResultLight;
  baselineOverrides?: Partial<MarketBaseline>;
  metadata?: MarketMetadata;
}

export interface MarketResult {
  requestId: string;
  version: string;
  generatedAt: string;
  periodLabel: string;
  scope: GraphScope;
  baseline: MarketBaseline;
  healthScore: MarketScore;
  competitivePositionScore: MarketScore;
  expansionOpportunityScore: MarketScore;
  marketRiskScore: MarketScore;
  industryScore: MarketScore;
  marketSizeScore: MarketScore;
  pricingScore: MarketScore;
  demandScore: MarketScore;
  demographicScore: MarketScore;
  geographicScore: MarketScore;
  economicScore: MarketScore;
  technologyScore: MarketScore;
  partnershipScore: MarketScore;
  maScore: MarketScore;
  whiteSpaceScore: MarketScore;
  knowledgeScore: MarketScore;
  health: MarketHealthResult;
  brief: ExecutiveMarketBrief;
  projection: MarketProjectionResult;
  confidence: MarketConfidenceScore;
  dashboard: MarketDashboardResult;
  competitiveDashboard: CompetitiveDashboardResult;
  expansionDashboard: ExpansionDashboardResult;
  trendDashboard: TrendDashboardResult;
  recommendations: MarketRecommendationRecord[];
  risks: MarketRiskRecord[];
  opportunities: MarketOpportunityRecord[];
  historyRecord: MarketHistoryRecord;
  industry: IndustrySuite;
  competitive: CompetitiveSuite;
  marketSize: MarketSizeSuite;
  pricing: PricingSuite;
  customerDemand: CustomerDemandSuite;
  demographic: DemographicSuite;
  geographicExpansion: GeographicExpansionSuite;
  economicTrend: EconomicTrendSuite;
  technologyTrend: TechnologyTrendSuite;
  partnership: PartnershipSuite;
  mergersAcquisitions: MergersAcquisitionsSuite;
  whiteSpace: WhiteSpaceSuite;
  signals: MarketSignalsSuite;
  knowledgeContribution: MarketKnowledgeContribution;
  reasoning: MarketReasoningResult;
  requestMetadata: MarketMetadata;
}
