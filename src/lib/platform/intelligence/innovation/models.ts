/**
 * Innovation Intelligence — model helpers (Sprint 044).
 */

import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type {
  BusinessModelResultLight,
  DecisionResultLight,
  DocumentResultLight,
  ImprovementResultLight,
  InnovationBaseline,
  InnovationConfidenceLevel,
  InnovationConfidenceScore,
  InnovationHealthStatus,
  InnovationLens,
  InnovationPriorityBand,
  KnowledgeResultLight,
  MarketResultLight,
  OpportunityResultLight,
  PredictiveResultLight,
} from "@/lib/platform/intelligence/innovation/types";
import {
  buildConfidenceAverageEmptyHalf,
  clamp as sharedClamp,
  defaultCreateId as sharedDefaultCreateId,
  emptyGraphScope,
  levelFromValue as sharedLevelFromValue,
  periodLabelQuarter,
  priorityFromRisk as sharedPriorityFromRisk,
  priorityFromScoreLowUrgent,
  scoreNarrative as sharedScoreNarrative,
  statusFromScore as sharedStatusFromScore,
} from "@/lib/platform/intelligence/common";


export const clamp = sharedClamp;

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function statusFromScore(score: number): InnovationHealthStatus { return sharedStatusFromScore(score); }

export function priorityFromScore(score: number): InnovationPriorityBand { return priorityFromScoreLowUrgent(score); }

export function priorityFromRisk(risk: number): InnovationPriorityBand { return sharedPriorityFromRisk(risk); }

export function levelFromValue(value: number): InnovationConfidenceLevel { return sharedLevelFromValue(value); }

export function scoreNarrative(
  label: string,
  value: number,
  status: InnovationHealthStatus
): string {
  return sharedScoreNarrative(label, value, status);
}

export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): InnovationConfidenceScore {
  return buildConfidenceAverageEmptyHalf(factors) as InnovationConfidenceScore;
}

export function buildLens(lens: InnovationLens): InnovationLens {
  return {
    innovationOpportunityExists: lens.innovationOpportunityExists,
    evidenceSupports: lens.evidenceSupports,
    problemSolved: lens.problemSolved,
    expectedImpact: lens.expectedImpact,
    investmentRequired: lens.investmentRequired,
    experimentsValidate: lens.experimentsValidate,
    risksExist: lens.risksExist,
    capabilitiesRequired: lens.capabilitiesRequired,
  };
}

export const defaultCreateId = sharedDefaultCreateId;

export const defaultPeriodLabel = periodLabelQuarter;

export const emptyInnovationScope = (): GraphScope => emptyGraphScope();

export function defaultInnovationBaseline(): InnovationBaseline {
  return {
    organizationHealthScore: 74,
    executionScore: 68,
    ideaVelocity: 62,
    rdIntensity: 58,
    productInnovationScore: 61,
    processInnovationScore: 59,
    aiOpportunityDensity: 64,
    technologyAdoptionReadiness: 57,
    emergingTechAwareness: 55,
    portfolioBalance: 60,
    experimentThroughput: 58,
    pocConversion: 54,
    ipCoverage: 52,
    continuousImprovementMomentum: 63,
    roadmapClarity: 61,
    marketSignalStrength: 60,
    opportunityDensity: 58,
    knowledgeContributionScore: 60,
    documentInnovationCoverage: 56,
    businessModelFit: 63,
    improvementMomentum: 62,
    decisionTraceability: 59,
    predictiveGrowthSignal: 60,
    ideaCount: 12,
    experimentCount: 6,
    pocCount: 4,
    ipAssetCount: 5,
    radarItemCount: 10,
    h1Share: 0.55,
    h2Share: 0.3,
    h3Share: 0.15,
  };
}

export function deriveInnovationBaseline(
  dna: OrganizationDNA | null | undefined,
  oios: OiosResult | null | undefined,
  analysis: GraphAnalysisResult | null | undefined,
  graphInput: GraphBuildInput | null | undefined,
  prediction: PredictionResult | PredictiveResultLight | null | undefined,
  marketResult?: MarketResultLight | null,
  opportunityResult?: OpportunityResultLight | null,
  knowledgeResult?: KnowledgeResultLight | null,
  documentResult?: DocumentResultLight | null,
  businessModelResult?: BusinessModelResultLight | null,
  improvementResult?: ImprovementResultLight | null,
  decisionResult?: DecisionResultLight | null,
  overrides?: Partial<InnovationBaseline>
): InnovationBaseline {
  const base = defaultInnovationBaseline();
  const health = graphInput?.organizationHealth;
  const organizationHealthScore = clamp(
    oios?.health.score ?? health?.overallScore ?? base.organizationHealthScore
  );
  const executionScore = clamp(oios?.baseline.executionScore ?? base.executionScore);

  const marketSignalStrength = clamp(
    marketResult?.healthScore?.value ??
      marketResult?.expansionOpportunityScore?.value ??
      (marketResult?.baseline?.signalDensity != null
        ? marketResult.baseline.signalDensity * 100
        : base.marketSignalStrength)
  );
  const opportunityDensity = clamp(
    opportunityResult?.baseline?.opportunityDensity ??
      opportunityResult?.healthScore?.value ??
      marketResult?.baseline?.opportunityDensity ??
      base.opportunityDensity
  );
  const knowledgeContributionScore = clamp(
    knowledgeResult?.contributionScore?.value ??
      knowledgeResult?.healthScore?.value ??
      knowledgeResult?.baseline?.coverageScore ??
      base.knowledgeContributionScore
  );
  const documentInnovationCoverage = clamp(
    documentResult?.healthScore?.value ??
      documentResult?.baseline?.complianceCoverage ??
      base.documentInnovationCoverage
  );
  const businessModelFit = clamp(
    businessModelResult?.baseline?.businessModelFit ??
      businessModelResult?.baseline?.valuePropositionStrength ??
      businessModelResult?.healthScore?.value ??
      base.businessModelFit
  );
  const improvementMomentum = clamp(
    improvementResult?.baseline?.improvementMomentum ??
      improvementResult?.baseline?.continuousImprovementScore ??
      improvementResult?.healthScore?.value ??
      base.improvementMomentum
  );
  const decisionTraceability = clamp(
    decisionResult?.baseline?.decisionTraceability ??
      decisionResult?.baseline?.decisionQuality ??
      decisionResult?.healthScore?.value ??
      base.decisionTraceability
  );
  const predictiveGrowthSignal = clamp(
    (prediction as PredictiveResultLight | null | undefined)?.baseline?.growthSignal ??
      (prediction as PredictiveResultLight | null | undefined)?.healthScore?.value ??
      base.predictiveGrowthSignal
  );

  const ideaVelocity = clamp(
    opportunityDensity * 0.35 +
      improvementMomentum * 0.3 +
      executionScore * 0.2 +
      knowledgeContributionScore * 0.15
  );
  const rdIntensity = clamp(
    predictiveGrowthSignal * 0.3 +
      businessModelFit * 0.25 +
      organizationHealthScore * 0.25 +
      documentInnovationCoverage * 0.2
  );
  const productInnovationScore = clamp(
    businessModelFit * 0.35 +
      marketSignalStrength * 0.3 +
      opportunityDensity * 0.2 +
      rdIntensity * 0.15
  );
  const processInnovationScore = clamp(
    improvementMomentum * 0.4 +
      executionScore * 0.3 +
      decisionTraceability * 0.3
  );
  const aiOpportunityDensity = clamp(
    opportunityDensity * 0.35 +
      predictiveGrowthSignal * 0.25 +
      knowledgeContributionScore * 0.2 +
      (marketResult?.baseline?.technologyDisruptionPressure != null
        ? marketResult.baseline.technologyDisruptionPressure * 100 * 0.2
        : 12)
  );
  const technologyAdoptionReadiness = clamp(
    executionScore * 0.35 +
      documentInnovationCoverage * 0.25 +
      improvementMomentum * 0.25 +
      decisionTraceability * 0.15
  );
  const emergingTechAwareness = clamp(
    marketSignalStrength * 0.35 +
      knowledgeContributionScore * 0.3 +
      aiOpportunityDensity * 0.2 +
      predictiveGrowthSignal * 0.15
  );
  const portfolioBalance = clamp(
    productInnovationScore * 0.25 +
      processInnovationScore * 0.25 +
      rdIntensity * 0.25 +
      businessModelFit * 0.25
  );
  const experimentThroughput = clamp(
    ideaVelocity * 0.35 +
      executionScore * 0.3 +
      improvementMomentum * 0.2 +
      decisionTraceability * 0.15
  );
  const pocConversion = clamp(
    experimentThroughput * 0.4 +
      productInnovationScore * 0.3 +
      businessModelFit * 0.3
  );
  const ipCoverage = clamp(
    documentInnovationCoverage * 0.4 +
      rdIntensity * 0.35 +
      knowledgeContributionScore * 0.25
  );
  const continuousImprovementMomentum = clamp(
    improvementMomentum * 0.55 +
      processInnovationScore * 0.25 +
      experimentThroughput * 0.2
  );
  const roadmapClarity = clamp(
    decisionTraceability * 0.35 +
      portfolioBalance * 0.3 +
      organizationHealthScore * 0.2 +
      predictiveGrowthSignal * 0.15
  );

  const ideaCount = Math.round(
    8 + ideaVelocity / 12 + (dna?.profile?.personas?.length ?? 3) * 0.4 + (analysis ? 1 : 0)
  );
  const experimentCount = Math.round(3 + experimentThroughput / 20);
  const pocCount = Math.round(2 + pocConversion / 30);
  const ipAssetCount = Math.round(3 + ipCoverage / 25);
  const radarItemCount = Math.round(6 + emergingTechAwareness / 15 + technologyAdoptionReadiness / 20);

  const h1Share = clamp01(0.4 + portfolioBalance / 400 - emergingTechAwareness / 500);
  const h3Share = clamp01(0.1 + emergingTechAwareness / 400 + aiOpportunityDensity / 500);
  const h2Share = clamp01(1 - h1Share - h3Share);

  void analysis;

  return {
    organizationHealthScore,
    executionScore,
    ideaVelocity,
    rdIntensity,
    productInnovationScore,
    processInnovationScore,
    aiOpportunityDensity,
    technologyAdoptionReadiness,
    emergingTechAwareness,
    portfolioBalance,
    experimentThroughput,
    pocConversion,
    ipCoverage,
    continuousImprovementMomentum,
    roadmapClarity,
    marketSignalStrength,
    opportunityDensity,
    knowledgeContributionScore,
    documentInnovationCoverage,
    businessModelFit,
    improvementMomentum,
    decisionTraceability,
    predictiveGrowthSignal,
    ideaCount,
    experimentCount,
    pocCount,
    ipAssetCount,
    radarItemCount,
    h1Share,
    h2Share,
    h3Share,
    ...overrides,
  };
}

export const innovationModels = {
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
  emptyInnovationScope,
  defaultInnovationBaseline,
  deriveInnovationBaseline,
};

export class InnovationModels {
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
  static emptyScope = emptyInnovationScope;
  static baseline = defaultInnovationBaseline;
  static derive = deriveInnovationBaseline;
}
