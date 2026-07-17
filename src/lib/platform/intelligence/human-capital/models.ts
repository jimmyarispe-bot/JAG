/**
 * Human Capital Intelligence — WorkforceModels helpers (Sprint 032).
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
  HumanCapitalBaseline,
  HumanCapitalConfidenceLevel,
  HumanCapitalConfidenceScore,
  HumanCapitalPriorityBand,
  TalentMatrixBox,
  WorkforceHealthSignal,
  WorkforceHealthStatus,
} from "@/lib/platform/intelligence/human-capital/types";
import {
  buildConfidenceAverageFunding,
  clamp01 as sharedClamp01,
  clampUnchecked,
  emptyGraphScope,
  levelFromValueFunding,
  periodLabelLocaleMonthYear,
  priorityFromRisk as sharedPriorityFromRisk,
  priorityFromScoreHighHealthy,
  scoreNarrative as sharedScoreNarrative,
  statusFromScore as sharedStatusFromScore,
} from "@/lib/platform/intelligence/common";


/** Default baseline when no upstream signals are supplied. */
export function defaultHumanCapitalBaseline(): HumanCapitalBaseline {
  return {
    headcount: 42,
    openRoles: 5,
    hiringVelocity: 2.2,
    attritionRate: 0.14,
    engagementScore: 72,
    performanceScore: 74,
    leadershipCoverage: 68,
    successionReadiness: 55,
    skillsCoverage: 66,
    learningParticipation: 58,
    compensationCompetitiveness: 70,
    payEquityIndex: 88,
    burnoutRisk: 0.32,
    retentionRisk: 0.28,
    timeToFillDays: 42,
    offerAcceptanceRate: 0.78,
    organizationHealthScore: 75,
    capabilityScore: 60,
    teamSize: 42,
  };
}

/** Derive baseline from DNA / OIOS / graph / prediction / overrides. */
export function deriveHumanCapitalBaseline(
  dna: OrganizationDNA | null | undefined,
  oios: OiosResult | null | undefined,
  analysis: GraphAnalysisResult | null | undefined,
  graphInput: GraphBuildInput | null | undefined,
  prediction: PredictionResult | null | undefined,
  workforceHealth: WorkforceHealthSignal | null | undefined,
  overrides?: Partial<HumanCapitalBaseline>
): HumanCapitalBaseline {
  const base = defaultHumanCapitalBaseline();
  const teamSize =
    dna?.score != null
      ? Math.max(8, Math.round((dna.score.overall / 100) * 60))
      : graphInput?.executive?.staff ?? base.teamSize;

  const organizationHealthScore =
    workforceHealth?.score && workforceHealth.score > 0
      ? workforceHealth.score
      : oios?.health.score ??
        graphInput?.organizationHealth?.overallScore ??
        base.organizationHealthScore;

  const capabilityScore =
    oios?.baseline.capabilityScore ??
    dna?.score.readiness ??
    base.capabilityScore;

  const workforceFromHealth =
    graphInput?.organizationHealth?.workforceScore ?? null;

  const engagementScore = clamp(
    workforceFromHealth ??
      Math.round(
        (organizationHealthScore * 0.55 + capabilityScore * 0.45)
      ),
    0,
    100
  );

  const predictionAttrition =
    prediction?.projection.emergingRisks?.find((r) =>
      /talent|workforce|retention|attrition/i.test(r.title ?? r.id ?? "")
    )?.score != null
      ? clamp01((prediction.projection.emergingRisks[0]!.score ?? 30) / 100)
      : null;

  const retentionRisk = clamp01(
    predictionAttrition ??
      (analysis?.dashboard
        ? analysis.dashboard.overallRisk * 0.7
        : base.retentionRisk)
  );

  const openRoles = Math.max(
    1,
    Math.round(teamSize * 0.12 + (100 - engagementScore) / 25)
  );

  return {
    headcount: teamSize,
    openRoles,
    hiringVelocity: clamp(2 + (100 - openRoles * 4) / 40, 0.5, 6),
    attritionRate: clamp01(0.08 + retentionRisk * 0.2),
    engagementScore,
    performanceScore: clamp(
      Math.round(engagementScore * 0.9 + capabilityScore * 0.1),
      0,
      100
    ),
    leadershipCoverage: clamp(
      Math.round(capabilityScore * 0.85 + engagementScore * 0.15),
      0,
      100
    ),
    successionReadiness: clamp(
      Math.round(capabilityScore * 0.7 + (100 - retentionRisk * 100) * 0.3),
      0,
      100
    ),
    skillsCoverage: clamp(Math.round(capabilityScore * 0.95), 0, 100),
    learningParticipation: clamp(
      Math.round(engagementScore * 0.7 + capabilityScore * 0.2),
      0,
      100
    ),
    compensationCompetitiveness: clamp(
      Math.round(
        (graphInput?.organizationHealth?.financialScore ?? 75) * 0.85 + 10
      ),
      0,
      100
    ),
    payEquityIndex: clamp(
      Math.round(88 - retentionRisk * 20),
      0,
      100
    ),
    burnoutRisk: clamp01(0.15 + retentionRisk * 0.55 + (100 - engagementScore) / 400),
    retentionRisk,
    timeToFillDays: Math.round(28 + openRoles * 2.5 + retentionRisk * 20),
    offerAcceptanceRate: clamp01(0.9 - retentionRisk * 0.35),
    organizationHealthScore: clamp(organizationHealthScore, 0, 100),
    capabilityScore: clamp(capabilityScore, 0, 100),
    teamSize,
    ...overrides,
  };
}

export const emptyHumanCapitalScope = (): GraphScope => emptyGraphScope();

export function defaultPeriodLabel(now: Date): string {
  return periodLabelLocaleMonthYear(now);
}

export const clamp = clampUnchecked;

export const clamp01 = sharedClamp01;

export function statusFromScore(score: number): WorkforceHealthStatus { return sharedStatusFromScore(score); }

export function priorityFromScore(score: number): HumanCapitalPriorityBand { return priorityFromScoreHighHealthy(score); }

export function priorityFromRisk(risk: number): HumanCapitalPriorityBand { return sharedPriorityFromRisk(risk); }

export function levelFromValue(value: number): HumanCapitalConfidenceLevel { return levelFromValueFunding(value); }

export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): HumanCapitalConfidenceScore {
  return buildConfidenceAverageFunding(factors) as HumanCapitalConfidenceScore;
}

export function talentBox(performance: number, potential: number): TalentMatrixBox {
  if (performance >= 80 && potential >= 80) return "star";
  if (performance >= 70 && potential >= 80) return "high_potential";
  if (performance >= 80 && potential >= 60) return "expert";
  if (performance >= 65 && potential >= 65) return "solid_contributor";
  if (performance >= 55 && potential >= 50) return "core_performer";
  if (performance < 45 && potential < 45) return "underperformer";
  if (performance < 55 && potential >= 70) return "inconsistent";
  if (performance < 50) return "risk";
  return "new_role";
}

export function scoreNarrative(
  label: string,
  value: number,
  status: WorkforceHealthStatus
): string {
  return sharedScoreNarrative(label, value, status);
}

export const workforceModels = {
  clamp,
  clamp01,
  defaultHumanCapitalBaseline,
  deriveHumanCapitalBaseline,
  emptyHumanCapitalScope,
  defaultPeriodLabel,
  statusFromScore,
  priorityFromScore,
  priorityFromRisk,
  levelFromValue,
  buildConfidence,
  talentBox,
  scoreNarrative,
};
