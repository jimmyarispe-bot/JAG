/**
 * Market Intelligence — model helpers (Sprint 043).
 */

import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type {
  BusinessModelResultLight,
  CustomerResultLight,
  DocumentResultLight,
  FundingResultLight,
  KnowledgeResultLight,
  LegalComplianceRiskResultLight,
  MarketBaseline,
  MarketConfidenceLevel,
  MarketConfidenceScore,
  MarketHealthStatus,
  MarketLens,
  MarketPriorityBand,
  OperationsResultLight,
  OpportunityResultLight,
  PredictiveResultLight,
  RevenueResultLight,
} from "@/lib/platform/intelligence/market/types";

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function statusFromScore(score: number): MarketHealthStatus {
  if (score >= 85) return "excellent";
  if (score >= 70) return "healthy";
  if (score >= 50) return "warning";
  return "critical";
}

export function priorityFromScore(score: number): MarketPriorityBand {
  if (score < 35) return "critical";
  if (score < 50) return "high";
  if (score < 65) return "medium";
  if (score < 80) return "low";
  return "monitor";
}

export function priorityFromRisk(risk: number): MarketPriorityBand {
  if (risk >= 0.75) return "critical";
  if (risk >= 0.55) return "high";
  if (risk >= 0.35) return "medium";
  if (risk >= 0.2) return "low";
  return "monitor";
}

export function levelFromValue(value: number): MarketConfidenceLevel {
  if (value >= 0.8) return "high";
  if (value >= 0.55) return "medium";
  if (value >= 0.3) return "low";
  return "unknown";
}

export function scoreNarrative(label: string, value: number, status: MarketHealthStatus): string {
  return `${label} is ${status} at ${Math.round(value)}.`;
}

export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): MarketConfidenceScore {
  const value =
    factors.length === 0
      ? 0.5
      : clamp01(factors.reduce((sum, f) => sum + f.contribution, 0) / factors.length);
  return { value, level: levelFromValue(value), factors };
}

export function buildLens(lens: MarketLens): MarketLens {
  return {
    marketOpportunityExists: lens.marketOpportunityExists,
    evidenceSupports: lens.evidenceSupports,
    competitorsInvolved: lens.competitorsInvolved,
    estimatedMarketSize: lens.estimatedMarketSize,
    risksExist: lens.risksExist,
    investmentRequired: lens.investmentRequired,
    expectedReturn: lens.expectedReturn,
    organizationalCapabilitiesRequired: lens.organizationalCapabilitiesRequired,
  };
}

export function defaultCreateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultPeriodLabel(now = new Date()): string {
  return `${now.getUTCFullYear()}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
}

export function emptyMarketScope(): GraphScope {
  return { organizationId: null, schoolId: null };
}

export function defaultMarketBaseline(): MarketBaseline {
  return {
    organizationHealthScore: 74,
    executionScore: 68,
    industryAttractiveness: 66,
    competitivePressure: 0.38,
    competitivePosition: 62,
    marketSizeIndex: 64,
    pricingPower: 61,
    demandMomentum: 63,
    demographicFit: 65,
    geographicExpansionReadiness: 58,
    economicTailwind: 60,
    technologyDisruptionPressure: 0.34,
    partnershipDensity: 57,
    maActivity: 42,
    whiteSpaceScore: 59,
    knowledgeContributionScore: 60,
    documentMarketCoverage: 58,
    legalRegulatoryPressure: 0.28,
    revenueDiversification: 61,
    fundingCapacity: 59,
    customerDemandProxy: 64,
    businessModelFit: 63,
    operationsCapacity: 62,
    predictiveGrowthSignal: 60,
    opportunityDensity: 58,
    competitorCount: 8,
    expansionCandidateCount: 4,
    signalDensity: 0.45,
    marketShareEstimate: 0.12,
  };
}

export function deriveMarketBaseline(
  dna: OrganizationDNA | null | undefined,
  oios: OiosResult | null | undefined,
  analysis: GraphAnalysisResult | null | undefined,
  graphInput: GraphBuildInput | null | undefined,
  prediction: PredictionResult | PredictiveResultLight | null | undefined,
  knowledgeResult?: KnowledgeResultLight | null,
  documentResult?: DocumentResultLight | null,
  legalComplianceRiskResult?: LegalComplianceRiskResultLight | null,
  revenueResult?: RevenueResultLight | null,
  fundingResult?: FundingResultLight | null,
  customerResult?: CustomerResultLight | null,
  businessModelResult?: BusinessModelResultLight | null,
  operationsResult?: OperationsResultLight | null,
  opportunityResult?: OpportunityResultLight | null,
  overrides?: Partial<MarketBaseline>
): MarketBaseline {
  const base = defaultMarketBaseline();
  const health = graphInput?.organizationHealth;
  const organizationHealthScore = clamp(
    oios?.health.score ?? health?.overallScore ?? base.organizationHealthScore
  );
  const executionScore = clamp(oios?.baseline.executionScore ?? base.executionScore);

  const knowledgeContributionScore = clamp(
    knowledgeResult?.contributionScore?.value ??
      knowledgeResult?.healthScore?.value ??
      knowledgeResult?.baseline?.coverageScore ??
      base.knowledgeContributionScore
  );
  const documentMarketCoverage = clamp(
    documentResult?.healthScore?.value ??
      documentResult?.baseline?.complianceCoverage ??
      base.documentMarketCoverage
  );
  const legalRegulatoryPressure = clamp01(
    legalComplianceRiskResult?.baseline?.riskPressure ??
      (legalComplianceRiskResult?.riskScore?.value != null
        ? legalComplianceRiskResult.riskScore.value / 100
        : base.legalRegulatoryPressure)
  );
  const revenueDiversification = clamp(
    revenueResult?.baseline?.revenueDiversification ??
      revenueResult?.healthScore?.value ??
      base.revenueDiversification
  );
  const fundingCapacity = clamp(
    fundingResult?.baseline?.fundingCapacity ??
      fundingResult?.baseline?.pipelineCoverage ??
      fundingResult?.healthScore?.value ??
      base.fundingCapacity
  );
  const customerDemandProxy = clamp(
    customerResult?.baseline?.demandMomentum ??
      customerResult?.baseline?.familyExperienceScore ??
      customerResult?.healthScore?.value ??
      base.customerDemandProxy
  );
  const businessModelFit = clamp(
    businessModelResult?.baseline?.businessModelFit ??
      businessModelResult?.baseline?.valuePropositionStrength ??
      businessModelResult?.healthScore?.value ??
      base.businessModelFit
  );
  const operationsCapacity = clamp(
    operationsResult?.baseline?.capacityScore ??
      operationsResult?.baseline?.operationsScore ??
      operationsResult?.workflowScore?.value ??
      operationsResult?.healthScore?.value ??
      base.operationsCapacity
  );
  const predictiveGrowthSignal = clamp(
    (prediction as PredictiveResultLight | null | undefined)?.baseline?.growthSignal ??
      (prediction as PredictiveResultLight | null | undefined)?.healthScore?.value ??
      base.predictiveGrowthSignal
  );
  const opportunityDensity = clamp(
    opportunityResult?.baseline?.opportunityDensity ??
      opportunityResult?.healthScore?.value ??
      base.opportunityDensity
  );

  const industryAttractiveness = clamp(
    organizationHealthScore * 0.25 +
      predictiveGrowthSignal * 0.25 +
      revenueDiversification * 0.25 +
      businessModelFit * 0.25
  );
  const competitivePressure = clamp01(
    0.15 +
      (1 - revenueDiversification / 100) * 0.25 +
      legalRegulatoryPressure * 0.2 +
      (analysis?.dashboard ? analysis.dashboard.overallRisk * 0.25 : 0.2)
  );
  const competitivePosition = clamp(
    executionScore * 0.3 +
      businessModelFit * 0.25 +
      operationsCapacity * 0.2 +
      revenueDiversification * 0.25
  );
  const marketSizeIndex = clamp(
    industryAttractiveness * 0.35 +
      customerDemandProxy * 0.3 +
      opportunityDensity * 0.2 +
      predictiveGrowthSignal * 0.15
  );
  const pricingPower = clamp(
    revenueResult?.baseline?.pricingPower ??
      competitivePosition * 0.4 + businessModelFit * 0.35 + customerDemandProxy * 0.25
  );
  const demandMomentum = clamp(customerDemandProxy * 0.55 + predictiveGrowthSignal * 0.25 + opportunityDensity * 0.2);
  const demographicFit = clamp(customerDemandProxy * 0.45 + organizationHealthScore * 0.3 + documentMarketCoverage * 0.25);
  const geographicExpansionReadiness = clamp(
    operationsCapacity * 0.3 + fundingCapacity * 0.3 + executionScore * 0.25 + opportunityDensity * 0.15
  );
  const economicTailwind = clamp(
    predictiveGrowthSignal * 0.4 + fundingCapacity * 0.3 + organizationHealthScore * 0.3
  );
  const technologyDisruptionPressure = clamp01(
    0.18 + (1 - operationsCapacity / 100) * 0.25 + (1 - businessModelFit / 100) * 0.2 + competitivePressure * 0.2
  );
  const partnershipDensity = clamp(
    opportunityDensity * 0.35 + businessModelFit * 0.3 + executionScore * 0.2 + knowledgeContributionScore * 0.15
  );
  const maActivity = clamp(
    competitivePressure * 40 + industryAttractiveness * 0.35 + fundingCapacity * 0.25
  );
  const whiteSpaceScore = clamp(
    opportunityDensity * 0.4 + demandMomentum * 0.3 + (100 - competitivePosition) * 0.15 + marketSizeIndex * 0.15
  );

  const competitorCount = Math.round(
    5 + competitivePressure * 10 + (dna?.profile?.personas?.length ?? 3) * 0.5
  );
  const expansionCandidateCount = Math.round(
    2 + geographicExpansionReadiness / 25 + (prediction ? 1 : 0)
  );
  const signalDensity = clamp01(
    0.25 + competitivePressure * 0.25 + demandMomentum / 200 + technologyDisruptionPressure * 0.2
  );
  const marketShareEstimate = clamp01(
    0.05 + competitivePosition / 500 + revenueDiversification / 800
  );

  return {
    organizationHealthScore,
    executionScore,
    industryAttractiveness,
    competitivePressure,
    competitivePosition,
    marketSizeIndex,
    pricingPower,
    demandMomentum,
    demographicFit,
    geographicExpansionReadiness,
    economicTailwind,
    technologyDisruptionPressure,
    partnershipDensity,
    maActivity,
    whiteSpaceScore,
    knowledgeContributionScore,
    documentMarketCoverage,
    legalRegulatoryPressure,
    revenueDiversification,
    fundingCapacity,
    customerDemandProxy,
    businessModelFit,
    operationsCapacity,
    predictiveGrowthSignal,
    opportunityDensity,
    competitorCount,
    expansionCandidateCount,
    signalDensity,
    marketShareEstimate,
    ...overrides,
  };
}

export const marketModels = {
  clamp,
  clamp01,
  statusFromScore,
  priorityFromScore,
  priorityFromRisk,
  levelFromValue,
  scoreNarrative,
  buildConfidence,
  buildLens,
  defaultCreateId,
  defaultPeriodLabel,
  emptyMarketScope,
  defaultMarketBaseline,
  deriveMarketBaseline,
};

export class MarketModels {
  static clamp = clamp;
  static clamp01 = clamp01;
  static statusFromScore = statusFromScore;
  static priorityFromScore = priorityFromScore;
  static priorityFromRisk = priorityFromRisk;
  static levelFromValue = levelFromValue;
  static scoreNarrative = scoreNarrative;
  static buildConfidence = buildConfidence;
  static buildLens = buildLens;
  static defaultCreateId = defaultCreateId;
  static defaultPeriodLabel = defaultPeriodLabel;
  static emptyScope = emptyMarketScope;
  static baseline = defaultMarketBaseline;
  static derive = deriveMarketBaseline;
}
