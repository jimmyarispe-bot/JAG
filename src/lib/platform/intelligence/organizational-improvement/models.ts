/** Organizational Improvement model helpers (Sprint 036). */
import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { GovernanceResult } from "@/lib/platform/intelligence/board-governance/types";
import type {
  FinancialSignal,
  FundingResultLight,
  HumanCapitalResultLight,
  ImprovementBaseline,
  ImprovementConfidenceLevel,
  ImprovementConfidenceScore,
  ImprovementDnaAlignment,
  ImprovementHealthStatus,
  ImprovementLensImpact,
  ImprovementPriorityBand,
  OpportunityResultLight,
  RevenueResultLight,
} from "@/lib/platform/intelligence/organizational-improvement/types";
import {
  buildConfidenceAverageFunding,
  clamp01 as sharedClamp01,
  clampUnchecked,
  emptyGraphScope,
  levelFromValueFunding,
  periodLabelLocaleMonthYear,
  priorityFromRisk as sharedPriorityFromRisk,
  priorityFromScoreHighUrgent,
  scoreNarrative as sharedScoreNarrative,
  statusFromScore as sharedStatusFromScore,
} from "@/lib/platform/intelligence/common";


export function defaultImprovementBaseline(): ImprovementBaseline {
  return {
    organizationHealthScore: 75,
    financialScore: 72,
    revenueHealthProxy: 70,
    fundingHealthProxy: 68,
    workforceCapacity: 70,
    executionReadiness: 65,
    missionAlignment: 78,
    governanceMaturity: 70,
    predictiveSignalStrength: 62,
    opportunityPipelineScore: 68,
    organizationalCapacity: 66,
    annualRevenue: 5_400_000,
    annualExpenses: 5_800_000,
    cashRunwayMonths: 12,
    openImprovementCount: 0,
    realizedImprovementValueYtd: 0,
    plannedImprovementValue: 0,
  };
}

export function deriveImprovementBaseline(
  dna: OrganizationDNA | null | undefined,
  oios: OiosResult | null | undefined,
  analysis: GraphAnalysisResult | null | undefined,
  graphInput: GraphBuildInput | null | undefined,
  prediction: PredictionResult | null | undefined,
  governance: GovernanceResult | null | undefined,
  financialSignal: FinancialSignal | null | undefined,
  revenueResult: RevenueResultLight | null | undefined,
  fundingResult: FundingResultLight | null | undefined,
  humanCapitalResult: HumanCapitalResultLight | null | undefined,
  opportunityResult: OpportunityResultLight | null | undefined,
  overrides?: Partial<ImprovementBaseline>
): ImprovementBaseline {
  const base = defaultImprovementBaseline();
  const organizationHealthScore = clamp(
    oios?.health.score ?? graphInput?.organizationHealth?.overallScore ?? base.organizationHealthScore
  );
  const financialScore = clamp(
    graphInput?.organizationHealth?.financialScore ?? oios?.baseline.financialScore ?? base.financialScore
  );
  const annualRevenue =
    financialSignal?.revenue ??
    graphInput?.executive?.revenue ??
    revenueResult?.baseline?.annualRevenue ??
    base.annualRevenue;
  const annualExpenses = financialSignal?.expenses ?? Math.round(annualRevenue * 1.08);
  const revenueHealthProxy = clamp(
    revenueResult?.healthScore?.value ?? (financialScore + organizationHealthScore) / 2
  );
  const fundingHealthProxy = clamp(
    fundingResult?.healthScore?.value ?? fundingResult?.opportunityScore?.value ?? financialScore * 0.9
  );
  const workforceCapacity = clamp(
    humanCapitalResult?.workforceHealthScore?.value ??
      graphInput?.organizationHealth?.workforceScore ??
      base.workforceCapacity
  );
  const graphRisk = analysis?.dashboard ? clamp01(analysis.dashboard.overallRisk) : 0.35;
  const predictiveSignalStrength = clamp(
    prediction?.projection?.emergingRisks
      ? 55 + Math.min(30, (prediction.projection.emergingRisks.length ?? 0) * 5)
      : base.predictiveSignalStrength
  );
  const governanceMaturity = clamp(
    governance?.dashboard?.overallGovernanceScore ??
      oios?.baseline.complianceScore ??
      base.governanceMaturity
  );
  const opportunityPipelineScore = clamp(
    opportunityResult?.opportunityScore?.value ??
      opportunityResult?.healthScore?.value ??
      base.opportunityPipelineScore
  );
  const executionReadiness = clamp(
    dna?.score?.execution ??
      45 + organizationHealthScore * 0.25 + workforceCapacity * 0.2 - graphRisk * 20
  );
  const missionAlignment = clamp(dna?.score?.identity ?? oios?.baseline.capabilityScore ?? base.missionAlignment);
  const organizationalCapacity = clamp(
    (workforceCapacity * 0.4 + executionReadiness * 0.35 + financialScore * 0.25)
  );
  const runway =
    fundingResult?.baseline?.cashRunwayMonths ??
    dna?.fundingModel?.runwayMonths ??
    clamp(
      Math.round(
        (financialSignal?.cash ?? annualRevenue * 0.2) /
          Math.max(1, (annualExpenses - annualRevenue) / 12)
      ),
      2,
      36
    );
  const plannedImprovementValue = Math.round(
    (fundingResult?.baseline?.pipelineFunding ?? 0) * 0.25 +
      opportunityPipelineScore * 10_000 +
      organizationHealthScore * 8_000
  );
  return {
    organizationHealthScore,
    financialScore,
    revenueHealthProxy,
    fundingHealthProxy,
    workforceCapacity,
    executionReadiness,
    missionAlignment,
    governanceMaturity,
    predictiveSignalStrength,
    opportunityPipelineScore,
    organizationalCapacity,
    annualRevenue,
    annualExpenses,
    cashRunwayMonths: runway,
    openImprovementCount:
      opportunityResult?.exchange?.length ??
      fundingResult?.topOpportunities?.length ??
      graphInput?.founder?.opportunities?.length ??
      0,
    realizedImprovementValueYtd: Math.round(annualRevenue * 0.03),
    plannedImprovementValue,
    ...overrides,
  };
}

export function deriveDnaAlignment(
  dna: OrganizationDNA | null | undefined,
  baseline: ImprovementBaseline
): ImprovementDnaAlignment {
  const stageFit = clamp(dna ? 70 + (dna.score?.overall ?? 60) * 0.2 : baseline.organizationHealthScore * 0.85);
  const missionFit = clamp(dna?.score?.identity ?? baseline.missionAlignment);
  const businessModelFit = clamp(dna?.score?.model ?? baseline.financialScore);
  const readinessFit = clamp(dna?.readiness?.overallScore ?? dna?.score?.readiness ?? baseline.executionReadiness);
  return {
    stageFit,
    missionFit,
    businessModelFit,
    readinessFit,
    narrative: `DNA alignment averages ${Math.round((stageFit + missionFit + businessModelFit + readinessFit) / 4)} across stage, mission, model, and readiness.`,
  };
}

export const emptyImprovementScope = (): GraphScope => emptyGraphScope();

export function defaultPeriodLabel(now: Date): string {
  return periodLabelLocaleMonthYear(now);
}

export const clamp = clampUnchecked;

export const clamp01 = sharedClamp01;

export function statusFromScore(score: number): ImprovementHealthStatus { return sharedStatusFromScore(score); }

export function priorityFromScore(score: number): ImprovementPriorityBand { return priorityFromScoreHighUrgent(score); }

export function priorityFromRisk(risk: number): ImprovementPriorityBand { return sharedPriorityFromRisk(risk); }

export function levelFromValue(value: number): ImprovementConfidenceLevel { return levelFromValueFunding(value); }

export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): ImprovementConfidenceScore {
  return buildConfidenceAverageFunding(factors) as ImprovementConfidenceScore;
}

export function scoreNarrative(
  label: string,
  value: number,
  status: ImprovementHealthStatus
): string {
  return sharedScoreNarrative(label, value, status);
}

export function buildLenses(input: ImprovementLensImpact): ImprovementLensImpact {
  return { ...input };
}

export function defaultImprovementLenses(title: string): ImprovementLensImpact {
  return buildLenses({
    whyNow: `${title} addresses a current organizational gap that compounds if deferred.`,
    expectedRoi: `${title} is expected to return measurable value relative to implementation cost.`,
    missionImpact: `${title} advances measurable mission outcomes for populations served.`,
    financialImpact: `${title} improves durable cash generation, cost discipline, or funding posture.`,
    peopleImpact: `${title} strengthens workforce capacity, engagement, or leadership bandwidth.`,
    implementationEffort: `${title} requires sequenced delivery with clear owners and capacity.`,
    risk: `${title} carries manageable delivery risk when gated behind milestones.`,
    confidence: `${title} confidence is grounded in current intelligence signals.`,
    dependencies: `${title} depends on capacity, ownership, and upstream domain readiness.`,
    timeToValue: `${title} is sequenced for the fastest credible path to realized benefit.`,
  });
}

export function defaultCreateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const improvementModels = {
  defaultImprovementBaseline,
  deriveImprovementBaseline,
  deriveDnaAlignment,
  emptyImprovementScope,
  defaultPeriodLabel,
  clamp,
  clamp01,
  statusFromScore,
  priorityFromScore,
  priorityFromRisk,
  levelFromValue,
  buildConfidence,
  scoreNarrative,
  buildLenses,
  defaultImprovementLenses,
  defaultCreateId,
};

/** ImprovementModels façade used by DI consumers. */
export class ImprovementModels {
  static baseline = defaultImprovementBaseline;
  static derive = deriveImprovementBaseline;
  static dnaAlignment = deriveDnaAlignment;
  static helpers = improvementModels;
}
