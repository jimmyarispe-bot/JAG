/**
 * Executive Decision Intelligence — ImpactForecast (Sprint 026).
 */

import type {
  DecisionConfidence as DecisionConfidenceContract,
  ImpactForecast as ImpactForecastContract,
} from "@/lib/platform/intelligence/executive-decision/contracts";
import { DecisionConfidenceEngine } from "@/lib/platform/intelligence/executive-decision/confidence";
import { applyShocksToBaseline } from "@/lib/platform/intelligence/executive-decision/models";
import type {
  DecisionBaseline,
  DecisionScenarioDefinition,
  DimensionImpact,
  FinancialImpact,
  ImpactForecastResult,
  MissionImpact,
  OperationalImpact,
} from "@/lib/platform/intelligence/executive-decision/types";
import type { GraphAnalysisResult } from "@/lib/platform/intelligence/executive-graph/types";

export interface ImpactForecastDependencies {
  confidence?: DecisionConfidenceContract;
  createId?: (prefix: string) => string;
}

/**
 * ImpactForecast — projects financial, operational, and mission impacts.
 */
export class ImpactForecastEngine implements ImpactForecastContract {
  private readonly confidence: DecisionConfidenceContract;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: ImpactForecastDependencies = {}) {
    this.confidence = dependencies.confidence ?? new DecisionConfidenceEngine();
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  forecast(input: {
    scenario: DecisionScenarioDefinition;
    baseline: DecisionBaseline;
    analysis: GraphAnalysisResult | null;
    horizonMonths: number;
  }): ImpactForecastResult {
    const { scenario, baseline, analysis, horizonMonths } = input;
    const projected = applyShocksToBaseline(baseline, scenario.shocks);

    const revenueDelta = projected.revenue - baseline.revenue;
    const costDelta = projected.payroll - baseline.payroll;
    const netDelta = revenueDelta - costDelta;
    const investmentProxy = Math.max(Math.abs(costDelta), 1);
    const roi = netDelta / investmentProxy;
    const paybackMonths =
      netDelta <= 0
        ? null
        : Math.min(
            horizonMonths * 2,
            Math.ceil(Math.abs(costDelta) / Math.max(netDelta / Math.max(horizonMonths, 1), 1))
          );

    const financial: FinancialImpact = {
      revenueDelta,
      costDelta,
      netDelta,
      roi,
      paybackMonths,
      narrative: buildFinancialNarrative(scenario, revenueDelta, costDelta, netDelta),
    };

    const enrollmentDelta = projected.enrollment - baseline.enrollment;
    const staffingDelta = projected.staff - baseline.staff;
    const capacityDelta = enrollmentDelta / Math.max(baseline.enrollment, 1);
    const serviceLevelDelta =
      (projected.organizationHealthScore - baseline.organizationHealthScore) / 100;

    const operational: OperationalImpact = {
      capacityDelta,
      staffingDelta,
      serviceLevelDelta,
      narrative: buildOperationalNarrative(enrollmentDelta, staffingDelta, serviceLevelDelta),
    };

    const mission: MissionImpact = {
      studentOutcomeDelta: enrollmentDelta / Math.max(baseline.enrollment, 1) * 0.6 + serviceLevelDelta * 0.4,
      communityDelta: capacityDelta * 0.5,
      brandDelta:
        (projected.founderHealthScore - baseline.founderHealthScore) / 100 +
        (projected.overallOpportunity - baseline.overallOpportunity) * 0.3,
      narrative: buildMissionNarrative(projected, baseline),
    };

    const dimensions: DimensionImpact[] = [
      {
        dimension: "financial",
        delta: clampSigned(netDelta / Math.max(baseline.revenue, 1)),
        narrative: financial.narrative,
        confidence: 0.75,
      },
      {
        dimension: "operational",
        delta: clampSigned(serviceLevelDelta),
        narrative: operational.narrative,
        confidence: 0.7,
      },
      {
        dimension: "mission",
        delta: clampSigned(mission.studentOutcomeDelta),
        narrative: mission.narrative,
        confidence: 0.65,
      },
      {
        dimension: "enrollment",
        delta: clampSigned(enrollmentDelta / Math.max(baseline.enrollment, 1)),
        narrative: `Enrollment moves from ${fmt(baseline.enrollment)} to ${fmt(projected.enrollment)}.`,
        confidence: 0.8,
      },
      {
        dimension: "workforce",
        delta: clampSigned(staffingDelta / Math.max(baseline.staff, 1)),
        narrative: `Staffing moves from ${fmt(baseline.staff)} to ${fmt(projected.staff)}.`,
        confidence: 0.7,
      },
    ];

    const cascadeSummaries =
      analysis?.cascades.slice(0, 5).map((c) => c.summary) ?? [];
    const riskSummaries =
      analysis?.risks.slice(0, 5).map((r) => r.summary) ?? [];

    const confidence = this.confidence.score([
      {
        key: "baseline_quality",
        label: "Baseline quality",
        contribution: analysis ? 0.35 : 0.2,
      },
      {
        key: "shock_clarity",
        label: "Shock clarity",
        contribution: scenario.shocks.length > 0 ? 0.3 : 0.15,
      },
      {
        key: "graph_risk_alignment",
        label: "Graph risk alignment",
        contribution: analysis ? Math.min(0.25, analysis.dashboard.overallRisk * 0.3 + 0.1) : 0.1,
      },
      {
        key: "horizon",
        label: "Forecast horizon stability",
        contribution: horizonMonths <= 12 ? 0.15 : 0.08,
      },
    ]);

    return {
      id: this.createId("forecast"),
      scenarioId: scenario.id,
      baseline,
      projected,
      dimensions,
      financial,
      operational,
      mission,
      cascadeSummaries,
      riskSummaries,
      confidence,
      horizonMonths,
      summary: `${scenario.title}: net financial delta ${fmt(netDelta)}, enrollment ${fmt(enrollmentDelta)}, risk ${projected.overallRisk.toFixed(2)}.`,
    };
  }
}

function clampSigned(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(-1, value));
}

function fmt(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function buildFinancialNarrative(
  scenario: DecisionScenarioDefinition,
  revenueDelta: number,
  costDelta: number,
  netDelta: number
): string {
  return `${scenario.title} projects revenue Δ ${fmt(revenueDelta)}, cost Δ ${fmt(costDelta)}, net Δ ${fmt(netDelta)}.`;
}

function buildOperationalNarrative(
  enrollmentDelta: number,
  staffingDelta: number,
  serviceLevelDelta: number
): string {
  return `Operations: enrollment Δ ${fmt(enrollmentDelta)}, staffing Δ ${fmt(staffingDelta)}, service-level Δ ${(serviceLevelDelta * 100).toFixed(1)} pts.`;
}

function buildMissionNarrative(
  projected: DecisionBaseline,
  baseline: DecisionBaseline
): string {
  const healthDelta = projected.organizationHealthScore - baseline.organizationHealthScore;
  return `Mission/health score moves ${fmt(healthDelta)} points (${fmt(baseline.organizationHealthScore)} → ${fmt(projected.organizationHealthScore)}).`;
}

/** Alias matching Sprint 026 naming. */
export { ImpactForecastEngine as ImpactForecast };
