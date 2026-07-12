/**
 * Organizational DNA & Company Builder — pure helpers / models (Sprint 030).
 */

import type { DecisionBaseline } from "@/lib/platform/intelligence/executive-decision/types";
import type {
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { GovernanceResult } from "@/lib/platform/intelligence/board-governance/types";
import type {
  CompanyBuilderArtifactKind,
  CompanyBuilderSeed,
  DnaConfidenceLevel,
  DnaPriorityBand,
  GraphScope,
  OrganizationDnaBaseline,
  OrganizationStage,
  ReadinessStatus,
} from "@/lib/platform/intelligence/organization-dna/types";
import {
  COMPANY_BUILDER_ARTIFACT_KINDS,
  ORGANIZATION_STAGES,
} from "@/lib/platform/intelligence/organization-dna/types";

/** Default baseline when no upstream signals are supplied. */
export function defaultOrganizationDnaBaseline(): OrganizationDnaBaseline {
  return {
    organizationHealthScore: 70,
    financialHealthScore: 68,
    founderHealthScore: 72,
    enrollment: 0,
    revenue: 0,
    teamSize: 3,
    riskScore: 0.4,
    complianceScore: 70,
    missionClarity: 65,
    marketClarity: 60,
    modelClarity: 58,
    executionReadiness: 55,
    capitalAdequacy: 50,
  };
}

/** Normalize / fill a company builder seed. */
export function normalizeSeed(
  seed?: CompanyBuilderSeed | null
): CompanyBuilderSeed {
  return {
    name: seed?.name?.trim() || "New Organization",
    legalName: seed?.legalName?.trim() || undefined,
    industry: seed?.industry?.trim() || "education",
    sector: seed?.sector?.trim() || "schools",
    geography: seed?.geography?.trim() || "local",
    foundingYear: seed?.foundingYear ?? null,
    ideaSummary:
      seed?.ideaSummary?.trim() ||
      "Build a high-impact organization that delivers measurable outcomes.",
    problemStatement:
      seed?.problemStatement?.trim() ||
      "Target customers lack a coherent operating system for growth and governance.",
    targetCustomer:
      seed?.targetCustomer?.trim() ||
      "Founders, executives, and boards of growing organizations",
    solutionSummary:
      seed?.solutionSummary?.trim() ||
      "An organizational intelligence operating system spanning DNA, execution, and governance.",
    stageHint: seed?.stageHint ?? null,
    missionHint: seed?.missionHint ?? null,
    visionHint: seed?.visionHint ?? null,
    valuesHints: seed?.valuesHints ?? [],
    cultureHints: seed?.cultureHints ?? [],
    goalHints: seed?.goalHints ?? [],
    constraintHints: seed?.constraintHints ?? [],
    capabilityHints: seed?.capabilityHints ?? [],
    revenueHints: seed?.revenueHints ?? [],
    fundingHints: seed?.fundingHints ?? [],
    channelHints: seed?.channelHints ?? [],
    competitorHints: seed?.competitorHints ?? [],
    teamSizeHint: seed?.teamSizeHint ?? null,
    capitalHint: seed?.capitalHint ?? null,
  };
}

/** Derive DNA baseline from graph / decision / prediction / governance / overrides. */
export function deriveOrganizationDnaBaseline(
  analysis: GraphAnalysisResult | null | undefined,
  graphInput: GraphBuildInput | null | undefined,
  decisionBaseline: DecisionBaseline | null | undefined,
  prediction: PredictionResult | null | undefined,
  governance: GovernanceResult | null | undefined,
  seed: CompanyBuilderSeed,
  overrides?: Partial<OrganizationDnaBaseline>
): OrganizationDnaBaseline {
  const base = defaultOrganizationDnaBaseline();
  const executive = graphInput?.executive;
  const health = graphInput?.organizationHealth;
  const founder = graphInput?.founder;

  const organizationHealthScore =
    health?.overallScore ??
    decisionBaseline?.organizationHealthScore ??
    (analysis?.dashboard
      ? clamp(100 - analysis.dashboard.overallRisk * 100, 0, 100)
      : base.organizationHealthScore);

  const financialHealthScore =
    health?.financialScore ?? base.financialHealthScore;
  const founderHealthScore = founder?.healthScore ?? base.founderHealthScore;
  const enrollment =
    decisionBaseline?.enrollment ??
    executive?.enrollment ??
    base.enrollment;
  const revenue =
    decisionBaseline?.revenue ?? executive?.revenue ?? base.revenue;
  const teamSize =
    seed.teamSizeHint ??
    executive?.staff ??
    base.teamSize;

  const riskScore = clamp01(
    founder?.risks && founder.risks.length > 0
      ? Math.max(
          ...founder.risks.map(
            (r) => (r.probability ?? 0.5) * (r.impact ?? 0.5)
          )
        )
      : prediction?.projection.emergingRisks?.[0]?.score != null
        ? clamp01(prediction.projection.emergingRisks[0]!.score / 100)
        : base.riskScore
  );

  const complianceScore =
    health?.complianceScore ??
    governance?.dashboard.overallGovernanceScore ??
    base.complianceScore;

  const missionClarity = clamp(
    Math.round(
      (organizationHealthScore + (seed.missionHint ? 85 : 60)) / 2
    ),
    0,
    100
  );
  const marketClarity = clamp(
    Math.round(
      ((seed.targetCustomer ? 80 : 55) + (seed.channelHints?.length ? 75 : 50)) /
        2
    ),
    0,
    100
  );
  const modelClarity = clamp(
    Math.round(
      ((seed.solutionSummary ? 75 : 50) + (seed.revenueHints?.length ? 78 : 52)) /
        2
    ),
    0,
    100
  );
  const executionReadiness = clamp(
    Math.round(
      (organizationHealthScore + financialHealthScore + founderHealthScore) / 3
    ),
    0,
    100
  );
  const capitalAdequacy = clamp(
    seed.capitalHint != null
      ? seed.capitalHint > 500000
        ? 80
        : seed.capitalHint > 100000
          ? 65
          : 45
      : revenue > 0
        ? 70
        : base.capitalAdequacy,
    0,
    100
  );

  return {
    organizationHealthScore,
    financialHealthScore,
    founderHealthScore,
    enrollment,
    revenue,
    teamSize,
    riskScore,
    complianceScore: clamp(complianceScore, 0, 100),
    missionClarity,
    marketClarity,
    modelClarity,
    executionReadiness,
    capitalAdequacy,
    ...overrides,
  };
}

/** Resolve artifact kinds for a run. */
export function resolveArtifactKinds(
  kinds?: CompanyBuilderArtifactKind[]
): CompanyBuilderArtifactKind[] {
  if (kinds && kinds.length > 0) return [...kinds];
  return [...COMPANY_BUILDER_ARTIFACT_KINDS];
}

/** Map numeric score (0–100) to readiness status. */
export function readinessFromScore(score: number): ReadinessStatus {
  if (score >= 85) return "ready";
  if (score >= 70) return "nearly_ready";
  if (score >= 50) return "developing";
  if (score >= 30) return "nascent";
  return "blocked";
}

/** Map numeric score (0–100) to priority band (higher score = healthier = lower urgency). */
export function priorityFromScore(score: number): DnaPriorityBand {
  if (score >= 85) return "monitor";
  if (score >= 70) return "low";
  if (score >= 55) return "medium";
  if (score >= 40) return "high";
  return "critical";
}

/** Map risk score (0–1) to priority band. */
export function priorityFromRisk(score: number): DnaPriorityBand {
  if (score >= 0.75) return "critical";
  if (score >= 0.55) return "high";
  if (score >= 0.35) return "medium";
  if (score >= 0.2) return "low";
  return "monitor";
}

/** Confidence level from 0–1 value. */
export function levelFromValue(value: number): DnaConfidenceLevel {
  if (value >= 0.8) return "high";
  if (value >= 0.55) return "medium";
  if (value >= 0.25) return "low";
  return "unknown";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

/** Stage index helpers. */
export function stageIndex(stage: OrganizationStage): number {
  return ORGANIZATION_STAGES.indexOf(stage);
}

export function previousStage(
  stage: OrganizationStage
): OrganizationStage | null {
  const idx = stageIndex(stage);
  if (idx <= 0) return null;
  return ORGANIZATION_STAGES[idx - 1] ?? null;
}

export function nextStage(stage: OrganizationStage): OrganizationStage | null {
  const idx = stageIndex(stage);
  if (idx < 0 || idx >= ORGANIZATION_STAGES.length - 1) return null;
  // Turnaround / acquisition / exit are lateral — suggest growth or operating.
  if (stage === "turnaround") return "operating";
  if (stage === "acquisition") return "operating";
  if (stage === "exit") return null;
  return ORGANIZATION_STAGES[idx + 1] ?? null;
}

/** Heuristic stage detection from seed + baseline. */
export function detectStageFromSignals(
  seed: CompanyBuilderSeed,
  baseline: OrganizationDnaBaseline,
  stageOverride?: OrganizationStage | null
): OrganizationStage {
  if (stageOverride) return stageOverride;
  if (seed.stageHint) return seed.stageHint;

  const hasRevenue = baseline.revenue > 0;
  const hasTeam = baseline.teamSize >= 5;
  const health = baseline.organizationHealthScore;
  const capital = baseline.capitalAdequacy;
  const risk = baseline.riskScore;

  if (risk >= 0.7 && hasRevenue) return "turnaround";
  if (!hasRevenue && !seed.solutionSummary) return "idea";
  if (!hasRevenue && baseline.teamSize <= 4) return "startup";
  if (hasRevenue && health >= 75 && capital >= 65 && hasTeam) return "growth";
  if (hasRevenue) return "operating";
  return "startup";
}

export function emptyDnaScope(): GraphScope {
  return { organizationId: null, schoolId: null };
}

/** Aggregated model helpers for consumers. */
export const organizationDnaModels = {
  defaultOrganizationDnaBaseline,
  deriveOrganizationDnaBaseline,
  normalizeSeed,
  resolveArtifactKinds,
  readinessFromScore,
  priorityFromScore,
  priorityFromRisk,
  levelFromValue,
  clamp,
  clamp01,
  stageIndex,
  previousStage,
  nextStage,
  detectStageFromSignals,
  emptyDnaScope,
};
