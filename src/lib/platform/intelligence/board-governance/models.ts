/**
 * Board & Governance Intelligence — GovernanceModels helpers (Sprint 029).
 */

import type { DecisionBaseline } from "@/lib/platform/intelligence/executive-decision/types";
import type {
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type {
  BoardKpi,
  BoardPacketKind,
  GovernanceBaseline,
  GovernanceConfidenceLevel,
  GovernancePriorityBand,
} from "@/lib/platform/intelligence/board-governance/types";
import {
  BOARD_PACKET_KINDS,
} from "@/lib/platform/intelligence/board-governance/types";

/** Default baseline when no upstream signals are supplied. */
export function defaultGovernanceBaseline(): GovernanceBaseline {
  return {
    enrollment: 100,
    revenue: 50000,
    cashFlow: 12000,
    expense: 38000,
    organizationHealthScore: 75,
    financialHealthScore: 75,
    founderHealthScore: 75,
    missionScore: 78,
    complianceScore: 88,
    riskScore: 0.35,
    executiveKpi: 78,
    initiativeProgress: 62,
    openResolutions: 3,
  };
}

/** Derive a governance baseline from graph / decision / prediction / overrides. */
export function deriveGovernanceBaseline(
  analysis: GraphAnalysisResult | null | undefined,
  graphInput: GraphBuildInput | null | undefined,
  decisionBaseline: DecisionBaseline | null | undefined,
  prediction: PredictionResult | null | undefined,
  overrides?: Partial<GovernanceBaseline>
): GovernanceBaseline {
  const base = defaultGovernanceBaseline();
  const executive = graphInput?.executive;
  const health = graphInput?.organizationHealth;
  const founder = graphInput?.founder;

  const enrollment =
    decisionBaseline?.enrollment ?? executive?.enrollment ?? base.enrollment;
  const revenue =
    decisionBaseline?.revenue ?? executive?.revenue ?? base.revenue;
  const cashFlow = Math.round(
    revenue * 0.22 - (decisionBaseline?.outstanding ?? executive?.outstanding ?? 0) * 0.05
  );
  const expense = Math.round(
    ((decisionBaseline?.payroll ?? (executive?.staff ?? 40) * 700) * 1.25) +
      revenue * 0.15
  );

  const organizationHealthScore =
    health?.overallScore ??
    decisionBaseline?.organizationHealthScore ??
    (analysis?.dashboard
      ? clamp(100 - analysis.dashboard.overallRisk * 100, 0, 100)
      : base.organizationHealthScore);
  const financialHealthScore =
    health?.financialScore ?? base.financialHealthScore;
  const founderHealthScore =
    founder?.healthScore ?? base.founderHealthScore;
  const missionScore =
    health?.academicScore ?? base.missionScore;
  const complianceScore =
    health?.complianceScore ?? base.complianceScore;
  const riskScore = clamp01(
    founder?.risks && founder.risks.length > 0
      ? Math.max(
          ...founder.risks.map(
            (r) => (r.probability ?? 0.5) * (r.impact ?? 0.5)
          )
        )
      : base.riskScore
  );
  const executiveKpi = clamp(
    Math.round(
      (organizationHealthScore + financialHealthScore + founderHealthScore) / 3
    ),
    0,
    100
  );

  const predictionRiskBoost =
    prediction?.projection.emergingRisks?.[0]?.score != null
      ? clamp01(prediction.projection.emergingRisks[0]!.score / 100)
      : 0;

  return {
    enrollment,
    revenue,
    cashFlow,
    expense,
    organizationHealthScore,
    financialHealthScore,
    founderHealthScore,
    missionScore,
    complianceScore,
    riskScore: clamp01(Math.max(riskScore, predictionRiskBoost)),
    executiveKpi,
    initiativeProgress: base.initiativeProgress,
    openResolutions: base.openResolutions,
    ...overrides,
  };
}

/** Resolve packet kinds for a run. */
export function resolvePacketKinds(
  kinds?: BoardPacketKind[]
): BoardPacketKind[] {
  if (kinds && kinds.length > 0) return [...kinds];
  return [...BOARD_PACKET_KINDS];
}

/** Map numeric score (0–100) to priority band. */
export function priorityFromScore(score: number): GovernancePriorityBand {
  if (score >= 85) return "monitor";
  if (score >= 70) return "low";
  if (score >= 55) return "medium";
  if (score >= 40) return "high";
  return "critical";
}

/** Map risk score (0–1) to priority band. */
export function priorityFromRisk(score: number): GovernancePriorityBand {
  if (score >= 0.75) return "critical";
  if (score >= 0.55) return "high";
  if (score >= 0.35) return "medium";
  if (score >= 0.2) return "low";
  return "monitor";
}

/** Confidence level from 0–1 value. */
export function levelFromValue(value: number): GovernanceConfidenceLevel {
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

/** Build default board KPIs from a governance baseline. */
export function buildBoardKpis(
  baseline: GovernanceBaseline,
  createId: (prefix: string) => string
): BoardKpi[] {
  const defs: Array<{
    key: string;
    label: string;
    domain: string;
    value: number;
    target: number | null;
    prior: number | null;
    unit: string | null;
    higherIsBetter: boolean;
  }> = [
    {
      key: "enrollment",
      label: "Enrollment",
      domain: "enrollment",
      value: baseline.enrollment,
      target: Math.round(baseline.enrollment * 1.05),
      prior: Math.round(baseline.enrollment * 0.97),
      unit: "students",
      higherIsBetter: true,
    },
    {
      key: "revenue",
      label: "Revenue",
      domain: "financial",
      value: baseline.revenue,
      target: Math.round(baseline.revenue * 1.08),
      prior: Math.round(baseline.revenue * 0.95),
      unit: "USD",
      higherIsBetter: true,
    },
    {
      key: "cash_flow",
      label: "Cash Flow",
      domain: "financial",
      value: baseline.cashFlow,
      target: Math.round(baseline.cashFlow * 1.1),
      prior: Math.round(baseline.cashFlow * 0.9),
      unit: "USD",
      higherIsBetter: true,
    },
    {
      key: "organization_health",
      label: "Organization Health",
      domain: "operations",
      value: baseline.organizationHealthScore,
      target: 85,
      prior: baseline.organizationHealthScore - 2,
      unit: "score",
      higherIsBetter: true,
    },
    {
      key: "mission",
      label: "Mission Score",
      domain: "mission",
      value: baseline.missionScore,
      target: 85,
      prior: baseline.missionScore - 1,
      unit: "score",
      higherIsBetter: true,
    },
    {
      key: "compliance",
      label: "Compliance",
      domain: "compliance",
      value: baseline.complianceScore,
      target: 95,
      prior: baseline.complianceScore - 1,
      unit: "score",
      higherIsBetter: true,
    },
    {
      key: "risk",
      label: "Residual Risk",
      domain: "risk",
      value: Math.round(baseline.riskScore * 100),
      target: 25,
      prior: Math.round(baseline.riskScore * 100) + 5,
      unit: "index",
      higherIsBetter: false,
    },
    {
      key: "executive_kpi",
      label: "Executive KPI Index",
      domain: "executive",
      value: baseline.executiveKpi,
      target: 85,
      prior: baseline.executiveKpi - 3,
      unit: "score",
      higherIsBetter: true,
    },
    {
      key: "initiative_progress",
      label: "Strategic Initiative Progress",
      domain: "strategy",
      value: baseline.initiativeProgress,
      target: 80,
      prior: baseline.initiativeProgress - 4,
      unit: "pct",
      higherIsBetter: true,
    },
  ];

  return defs.map((d) => {
    const delta =
      d.prior == null ? 0 : d.value - d.prior;
    const trend: BoardKpi["trend"] =
      Math.abs(delta) < 0.5 ? "flat" : delta > 0 ? "up" : "down";
    const performance = d.target
      ? d.higherIsBetter
        ? (d.value / d.target) * 100
        : (d.target / Math.max(d.value, 1)) * 100
      : d.value;
    const status = priorityFromScore(
      d.higherIsBetter ? performance : clamp(performance, 0, 100)
    );
    return {
      id: createId(`kpi-${d.key}`),
      key: d.key,
      label: d.label,
      domain: d.domain,
      value: d.value,
      target: d.target,
      priorValue: d.prior,
      unit: d.unit,
      trend,
      status,
      narrative: `${d.label} is ${d.value}${d.unit ? ` ${d.unit}` : ""}${
        d.target != null ? ` (target ${d.target})` : ""
      }; trend ${trend}.`,
    };
  });
}

/** Period label helper. */
export function defaultPeriodLabel(now: Date): string {
  const month = now.toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
  return `${month} ${now.getUTCFullYear()}`;
}

/** Empty graph scope for governance artifacts. */
export function emptyGovernanceScope(): import("@/lib/platform/intelligence/board-governance/types").GraphScope {
  return { organizationId: null, schoolId: null };
}

/** Governance models façade. */
export const governanceModels = {
  defaultGovernanceBaseline,
  deriveGovernanceBaseline,
  resolvePacketKinds,
  priorityFromScore,
  priorityFromRisk,
  levelFromValue,
  buildBoardKpis,
  defaultPeriodLabel,
  emptyGovernanceScope,
  clamp,
  clamp01,
};
