/** Opportunity Intelligence model helpers (Sprint 035). */
import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type {
  FinancialSignal,
  FundingResultLight,
  HumanCapitalResultLight,
  OpportunityBaseline,
  OpportunityConfidenceLevel,
  OpportunityConfidenceScore,
  OpportunityDnaAlignment,
  OpportunityHealthStatus,
  OpportunityLensImpact,
  OpportunityPriorityBand,
  RevenueResultLight,
} from "@/lib/platform/intelligence/opportunity/types";
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


export function defaultOpportunityBaseline(): OpportunityBaseline {
  return {
    organizationHealthScore: 75,
    financialScore: 72,
    revenueHealthProxy: 70,
    fundingHealthProxy: 68,
    workforceCapacity: 70,
    executionReadiness: 65,
    missionAlignment: 78,
    innovationReadiness: 62,
    marketPosition: 66,
    riskTolerance: 0.45,
    annualRevenue: 5_400_000,
    annualExpenses: 5_800_000,
    cashRunwayMonths: 12,
    openOpportunityCount: 0,
    realizedValueYtd: 0,
    pipelineValue: 0,
  };
}

export function deriveOpportunityBaseline(
  dna: OrganizationDNA | null | undefined,
  oios: OiosResult | null | undefined,
  analysis: GraphAnalysisResult | null | undefined,
  graphInput: GraphBuildInput | null | undefined,
  prediction: PredictionResult | null | undefined,
  financialSignal: FinancialSignal | null | undefined,
  revenueResult: RevenueResultLight | null | undefined,
  fundingResult: FundingResultLight | null | undefined,
  humanCapitalResult: HumanCapitalResultLight | null | undefined,
  overrides?: Partial<OpportunityBaseline>
): OpportunityBaseline {
  const base = defaultOpportunityBaseline();
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
  const revenueHealthProxy = clamp(revenueResult?.healthScore?.value ?? (financialScore + organizationHealthScore) / 2);
  const fundingHealthProxy = clamp(
    fundingResult?.healthScore?.value ?? fundingResult?.opportunityScore?.value ?? financialScore * 0.9
  );
  const workforceCapacity = clamp(
    humanCapitalResult?.workforceHealthScore?.value ?? graphInput?.organizationHealth?.workforceScore ?? base.workforceCapacity
  );
  const graphRisk = analysis?.dashboard ? clamp01(analysis.dashboard.overallRisk) : 0.35;
  const predictionLift =
    prediction?.projection.emergingRisks?.filter((r) => /opportunit|growth|market|partner|innovat/i.test(`${r.title ?? ""} ${r.id ?? ""}`)).length ?? 0;
  const executionReadiness = clamp(
    dna?.score?.execution ?? 45 + organizationHealthScore * 0.25 + workforceCapacity * 0.2 - graphRisk * 20
  );
  const missionAlignment = clamp(
    dna?.score?.identity ?? oios?.baseline.capabilityScore ?? base.missionAlignment
  );
  const innovationReadiness = clamp(50 + (dna?.score?.readiness ?? 60) * 0.3 + predictionLift * 4);
  const marketPosition = clamp(
    dna?.score?.market ?? 55 + revenueHealthProxy * 0.25 + (revenueResult?.baseline?.diversificationIndex ?? 0.5) * 20
  );
  const runway =
    fundingResult?.baseline?.cashRunwayMonths ??
    dna?.fundingModel?.runwayMonths ??
    clamp(Math.round((financialSignal?.cash ?? annualRevenue * 0.2) / Math.max(1, (annualExpenses - annualRevenue) / 12)), 2, 36);
  const pipelineValue = Math.round(
    (fundingResult?.baseline?.pipelineFunding ?? 0) +
      (revenueResult?.opportunityScore?.value ?? 50) * 8_000 +
      organizationHealthScore * 12_000
  );
  return {
    organizationHealthScore,
    financialScore,
    revenueHealthProxy,
    fundingHealthProxy,
    workforceCapacity,
    executionReadiness,
    missionAlignment,
    innovationReadiness,
    marketPosition,
    riskTolerance: clamp01(0.35 + (1 - graphRisk) * 0.3),
    annualRevenue,
    annualExpenses,
    cashRunwayMonths: runway,
    openOpportunityCount: fundingResult?.topOpportunities?.length ?? graphInput?.founder?.opportunities?.length ?? 0,
    realizedValueYtd: Math.round(annualRevenue * 0.04),
    pipelineValue,
    ...overrides,
  };
}

export function deriveDnaAlignment(dna: OrganizationDNA | null | undefined, baseline: OpportunityBaseline): OpportunityDnaAlignment {
  const stageFit = clamp(dna ? 70 + (dna.score?.overall ?? 60) * 0.2 : baseline.organizationHealthScore * 0.85);
  const missionFit = clamp(dna?.score?.identity ?? baseline.missionAlignment);
  const businessModelFit = clamp(dna?.score?.model ?? baseline.marketPosition);
  const readinessFit = clamp(dna?.readiness?.overallScore ?? dna?.score?.readiness ?? baseline.executionReadiness);
  return {
    stageFit,
    missionFit,
    businessModelFit,
    readinessFit,
    narrative: `DNA alignment averages ${Math.round((stageFit + missionFit + businessModelFit + readinessFit) / 4)} across stage, mission, model, and readiness.`,
  };
}

export const emptyOpportunityScope = (): GraphScope => emptyGraphScope();

export function defaultPeriodLabel(now: Date): string {
  return periodLabelLocaleMonthYear(now);
}

export const clamp = clampUnchecked;

export const clamp01 = sharedClamp01;

export function statusFromScore(score: number): OpportunityHealthStatus { return sharedStatusFromScore(score); }

export function priorityFromScore(score: number): OpportunityPriorityBand { return priorityFromScoreHighUrgent(score); }

export function priorityFromRisk(risk: number): OpportunityPriorityBand { return sharedPriorityFromRisk(risk); }

export function levelFromValue(value: number): OpportunityConfidenceLevel { return levelFromValueFunding(value); }

export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): OpportunityConfidenceScore {
  return buildConfidenceAverageFunding(factors) as OpportunityConfidenceScore;
}

export function scoreNarrative(
  label: string,
  value: number,
  status: OpportunityHealthStatus
): string {
  return sharedScoreNarrative(label, value, status);
}

export function buildLenses(input: OpportunityLensImpact): OpportunityLensImpact {
  return { ...input };
}

export function defaultOpportunityLenses(categoryLabel: string): OpportunityLensImpact {
  return buildLenses({
    organizationalHealth: `${categoryLabel} strengthens organizational capability and operating posture.`,
    financialSustainability: `${categoryLabel} improves durable cash generation or cost discipline.`,
    missionImpact: `${categoryLabel} advances measurable mission outcomes for the populations served.`,
    longTermValue: `${categoryLabel} compounds strategic position and enterprise value over time.`,
    timeToValue: `${categoryLabel} is sequenced for the fastest credible path to realized benefit.`,
  });
}

export function defaultCreateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const opportunityModels = {
  defaultOpportunityBaseline,
  deriveOpportunityBaseline,
  deriveDnaAlignment,
  emptyOpportunityScope,
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
  defaultOpportunityLenses,
  defaultCreateId,
};

/** OpportunityModels façade used by DI consumers. */
export class OpportunityModels {
  static baseline = defaultOpportunityBaseline;
  static derive = deriveOpportunityBaseline;
  static dnaAlignment = deriveDnaAlignment;
  static helpers = opportunityModels;
}
