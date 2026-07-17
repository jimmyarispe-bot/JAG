/**
 * Business Model Intelligence — BusinessModelModels helpers (Sprint 037).
 */

import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  GraphAnalysisResult,
  GraphBuildInput,
  GraphScope,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type {
  BusinessModelBaseline,
  BusinessModelConfidenceLevel,
  BusinessModelConfidenceScore,
  BusinessModelHealthStatus,
  BusinessModelLensImpact,
  BusinessModelPriorityBand,
  FinancialSignal,
  FundingResultLight,
  ImprovementResultLight,
  OpportunityResultLight,
  RevenueResultLight,
} from "@/lib/platform/intelligence/business-model/types";
import {
  buildConfidenceAverageEmptyHalf,
  clamp01 as sharedClamp01,
  clampUnchecked,
  defaultCreateId as sharedDefaultCreateId,
  emptyGraphScope,
  levelFromValue as sharedLevelFromValue,
  periodLabelQuarter,
  priorityFromRisk as sharedPriorityFromRisk,
  priorityFromScoreLowUrgent,
  scoreNarrative as sharedScoreNarrative,
  statusFromScore as sharedStatusFromScore,
} from "@/lib/platform/intelligence/common";


export const clamp = clampUnchecked;

export const clamp01 = sharedClamp01;

export function statusFromScore(score: number): BusinessModelHealthStatus { return sharedStatusFromScore(score); }

export function priorityFromScore(score: number): BusinessModelPriorityBand { return priorityFromScoreLowUrgent(score); }

export function priorityFromRisk(risk: number): BusinessModelPriorityBand { return sharedPriorityFromRisk(risk); }

export function levelFromValue(value: number): BusinessModelConfidenceLevel { return sharedLevelFromValue(value); }

export function scoreNarrative(
  label: string,
  value: number,
  status: BusinessModelHealthStatus
): string {
  return sharedScoreNarrative(label, value, status);
}

export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): BusinessModelConfidenceScore {
  return buildConfidenceAverageEmptyHalf(factors) as BusinessModelConfidenceScore;
}

export function buildLenses(
  partial: Partial<BusinessModelLensImpact> &
    Pick<
      BusinessModelLensImpact,
      | "valueCreated"
      | "valueDelivered"
      | "valueCaptured"
      | "canImprove"
      | "canScale"
      | "canSustain"
    >
): BusinessModelLensImpact {
  return {
    valueCreated: partial.valueCreated,
    valueDelivered: partial.valueDelivered,
    valueCaptured: partial.valueCaptured,
    canImprove: partial.canImprove,
    canScale: partial.canScale,
    canSustain: partial.canSustain,
  };
}

export const defaultCreateId = sharedDefaultCreateId;

export const defaultPeriodLabel = periodLabelQuarter;

export const emptyBusinessModelScope = (): GraphScope => emptyGraphScope();

export function defaultBusinessModelBaseline(): BusinessModelBaseline {
  return {
    clarityScore: 68,
    valueCreationScore: 70,
    valueDeliveryScore: 66,
    valueCaptureScore: 64,
    scalabilityScore: 62,
    sustainabilityScore: 65,
    differentiationScore: 60,
    unitEconomicsScore: 63,
    capitalIntensity: 0.42,
    operationalComplexity: 0.48,
    missionAlignment: 72,
    competitivePosition: 58,
    annualRevenue: 4_200_000,
    grossMargin: 0.58,
    growthRate: 0.1,
    organizationHealthScore: 75,
    financialScore: 72,
    archetype: "mission_driven_hybrid",
  };
}

/** Derive baseline from DNA / OIOS / graph / prediction / upstream soft signals. */
export function deriveBusinessModelBaseline(
  dna: OrganizationDNA | null | undefined,
  oios: OiosResult | null | undefined,
  analysis: GraphAnalysisResult | null | undefined,
  graphInput: GraphBuildInput | null | undefined,
  prediction: PredictionResult | null | undefined,
  financialSignal: FinancialSignal | null | undefined,
  revenueResult?: RevenueResultLight | null,
  fundingResult?: FundingResultLight | null,
  opportunityResult?: OpportunityResultLight | null,
  improvementResult?: ImprovementResultLight | null,
  overrides?: Partial<BusinessModelBaseline>
): BusinessModelBaseline {
  const base = defaultBusinessModelBaseline();

  const organizationHealthScore = clamp(
    oios?.health.score ??
      graphInput?.organizationHealth?.overallScore ??
      base.organizationHealthScore
  );

  const financialScore = clamp(
    graphInput?.organizationHealth?.financialScore ??
      oios?.baseline.financialScore ??
      revenueResult?.healthScore?.value ??
      base.financialScore
  );

  const annualRevenue =
    financialSignal?.revenue && financialSignal.revenue > 0
      ? financialSignal.revenue
      : revenueResult?.baseline?.annualRevenue &&
          revenueResult.baseline.annualRevenue > 0
        ? revenueResult.baseline.annualRevenue
        : graphInput?.executive?.revenue && graphInput.executive.revenue > 0
          ? graphInput.executive.revenue
          : base.annualRevenue;

  const grossMargin = clamp01(
    financialSignal?.marginPct != null && financialSignal.marginPct !== 0
      ? financialSignal.marginPct > 1
        ? financialSignal.marginPct / 100
        : financialSignal.marginPct
      : revenueResult?.baseline?.grossMargin != null
        ? revenueResult.baseline.grossMargin
        : base.grossMargin
  );

  const archetype =
    dna?.businessModel?.archetype ??
    dna?.revenueModel?.primaryKind ??
    base.archetype;

  const dnaClarity = dna?.businessModel
    ? clamp(
        55 +
          (dna.businessModel.customerSegments?.length ?? 0) * 4 +
          (dna.businessModel.channels?.length ?? 0) * 3 +
          (dna.businessModel.keyActivities?.length ?? 0) * 2
      )
    : base.clarityScore;

  const valueCreationScore = clamp(
    (dna?.valueProposition?.statement || dna?.profile?.mission?.statement
      ? 75
      : 60) + (organizationHealthScore - 70) * 0.3
  );

  const valueDeliveryScore = clamp(
    60 +
      (dna?.businessModel?.channels?.length ?? 2) * 5 +
      (graphInput?.executive?.enrollment ?? 100) / 50
  );

  const valueCaptureScore = clamp(
    grossMargin * 70 +
      (revenueResult?.growthScore?.value ?? financialScore) * 0.25 +
      (dna?.revenueModel?.streams?.length ?? 2) * 4
  );

  const scalabilityScore = clamp(
    55 +
      (opportunityResult?.opportunityScore?.value ?? 60) * 0.2 +
      (1 - base.operationalComplexity) * 25 +
      (prediction?.projection?.scenarios?.length ?? 1) * 3
  );

  const sustainabilityScore = clamp(
    missionBlend(
      dna?.profile?.mission?.statement ? 78 : 65,
      fundingResult?.baseline?.cashRunwayMonths ?? 8,
      improvementResult?.improvementScore?.value ?? 60
    )
  );

  const differentiationScore = clamp(
    50 +
      (dna?.swot?.strengths?.length ?? 2) * 5 -
      (dna?.swot?.threats?.length ?? 2) * 3
  );

  const unitEconomicsScore = clamp(grossMargin * 80 + financialScore * 0.2);

  const capitalIntensity = clamp01(
    (fundingResult?.baseline?.annualFundingNeed ?? annualRevenue * 0.25) /
      Math.max(1, annualRevenue)
  );

  const operationalComplexity = clamp01(
    0.35 +
      (analysis?.dashboard ? analysis.dashboard.overallRisk * 0.25 : 0.1) +
      (dna?.businessModel?.keyPartners?.length ?? 2) * 0.03
  );

  const missionAlignment = clamp(
    dna?.profile?.mission?.statement
      ? 70 + (oios?.maturity.score ?? 60) * 0.2
      : base.missionAlignment
  );

  const competitivePosition = clamp(
    differentiationScore * 0.45 +
      valueCaptureScore * 0.25 +
      scalabilityScore * 0.3
  );

  const growthRate = clamp(
    0.04 +
      ((revenueResult?.growthScore?.value ?? financialScore) / 100) * 0.18 -
      operationalComplexity * 0.05,
    -0.15,
    0.45
  );

  const clarityScore = clamp(
    dnaClarity * 0.6 +
      valueCreationScore * 0.15 +
      valueDeliveryScore * 0.15 +
      valueCaptureScore * 0.1
  );

  return {
    clarityScore,
    valueCreationScore,
    valueDeliveryScore,
    valueCaptureScore,
    scalabilityScore,
    sustainabilityScore,
    differentiationScore,
    unitEconomicsScore,
    capitalIntensity,
    operationalComplexity,
    missionAlignment,
    competitivePosition,
    annualRevenue,
    grossMargin,
    growthRate,
    organizationHealthScore,
    financialScore,
    archetype: String(archetype),
    ...overrides,
  };
}

function missionBlend(
  missionBase: number,
  runwayMonths: number,
  improvementScore: number
): number {
  return clamp(
    missionBase * 0.45 +
      clamp(runwayMonths * 4, 20, 40) +
      improvementScore * 0.2
  );
}

/** BusinessModelModels façade used by DI consumers. */
export const businessModelModels = {
  clamp,
  clamp01,
  statusFromScore,
  priorityFromScore,
  priorityFromRisk,
  levelFromValue,
  scoreNarrative,
  buildConfidence,
  buildLenses,
  defaultCreateId,
  defaultPeriodLabel,
  emptyBusinessModelScope,
  defaultBusinessModelBaseline,
  deriveBusinessModelBaseline,
};

export class BusinessModelModels {
  static clamp = clamp;
  static clamp01 = clamp01;
  static statusFromScore = statusFromScore;
  static priorityFromScore = priorityFromScore;
  static priorityFromRisk = priorityFromRisk;
  static levelFromValue = levelFromValue;
  static scoreNarrative = scoreNarrative;
  static buildConfidence = buildConfidence;
  static buildLenses = buildLenses;
  static defaultCreateId = defaultCreateId;
  static defaultPeriodLabel = defaultPeriodLabel;
  static emptyScope = emptyBusinessModelScope;
  static baseline = defaultBusinessModelBaseline;
  static derive = deriveBusinessModelBaseline;
}
