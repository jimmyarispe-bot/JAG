/**
 * Business Model Intelligence — BusinessModelSimulator (Sprint 037).
 */

import type { BusinessModelSimulator as BusinessModelSimulatorContract } from "@/lib/platform/intelligence/business-model/contracts";
import {
  buildLenses,
  clamp,
  defaultCreateId,
} from "@/lib/platform/intelligence/business-model/models";
import type {
  BusinessModelBaseline,
  BusinessModelComparisonResult,
  BusinessModelScenarioSuite,
  BusinessModelSimulationRecord,
  OrganizationDesignSuite,
  SimulationForecastDimension,
  SimulationForecastPoint,
} from "@/lib/platform/intelligence/business-model/types";

const DIMENSIONS: Array<{
  dimension: SimulationForecastDimension;
  label: string;
}> = [
  { dimension: "revenue", label: "Revenue" },
  { dimension: "profitability", label: "Profitability" },
  { dimension: "mission_impact", label: "Mission Impact" },
  { dimension: "growth", label: "Growth" },
  { dimension: "scalability", label: "Scalability" },
  { dimension: "capital_requirements", label: "Capital Requirements" },
  { dimension: "risk", label: "Risk" },
  { dimension: "operational_complexity", label: "Operational Complexity" },
];

export class BusinessModelSimulator implements BusinessModelSimulatorContract {
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  simulate(input: {
    baseline: BusinessModelBaseline;
    design: OrganizationDesignSuite;
    scenarios: BusinessModelScenarioSuite;
    now: Date;
  }): {
    simulations: BusinessModelSimulationRecord[];
    comparison: BusinessModelComparisonResult;
  } {
    void input.now;
    const candidates = [
      {
        modelId: "current",
        label: `Current — ${input.design.current.label}`,
        archetype: input.baseline.archetype,
        scenarioKind: "current" as const,
        designFit: input.design.current.fitScore,
        capital: input.design.current.capitalIntensity,
        complexity: input.design.current.operationalComplexity,
        scale: input.design.current.scalability,
        mission: input.design.current.missionFit,
      },
      {
        modelId: "recommended",
        label: `Recommended — ${input.design.recommended.label}`,
        archetype: input.design.recommended.kind,
        scenarioKind: "alternative" as const,
        designFit: input.design.recommended.fitScore,
        capital: input.design.recommended.capitalIntensity,
        complexity: input.design.recommended.operationalComplexity,
        scale: input.design.recommended.scalability,
        mission: input.design.recommended.missionFit,
      },
      ...input.scenarios.scenarios
        .filter((s) =>
          ["best_practice", "high_growth", "high_margin", "mission_first"].includes(
            s.kind
          )
        )
        .slice(0, 3)
        .map((s) => ({
          modelId: s.id,
          label: s.label,
          archetype: s.kind,
          scenarioKind: s.kind,
          designFit: s.score,
          capital: input.baseline.capitalIntensity * (s.kind === "high_growth" ? 1.2 : 0.95),
          complexity:
            input.baseline.operationalComplexity *
            (s.kind === "mission_first" ? 0.9 : 1.05),
          scale: clamp01ish(s.growthOutlook / 100),
          mission: clamp01ish(s.missionOutlook / 100),
        })),
    ];

    const simulations = candidates.map((candidate) => {
      const scenario = input.scenarios.scenarios.find(
        (s) => s.kind === candidate.scenarioKind
      );
      const forecasts = DIMENSIONS.map((dim) =>
        forecastDimension(dim.dimension, dim.label, input.baseline, {
          designFit: candidate.designFit,
          capital: candidate.capital,
          complexity: candidate.complexity,
          scale: candidate.scale,
          mission: candidate.mission,
          revenueOutlook: scenario?.revenueOutlook ?? input.baseline.valueCaptureScore,
          marginOutlook: scenario?.marginOutlook ?? input.baseline.grossMargin * 100,
          growthOutlook: scenario?.growthOutlook ?? input.baseline.growthRate * 100 + 40,
          riskOutlook:
            scenario?.riskOutlook ??
            input.baseline.operationalComplexity * 60 +
              input.baseline.capitalIntensity * 40,
        })
      );

      const overallScore = clamp(
        forecasts
          .filter((f) =>
            !["risk", "capital_requirements", "operational_complexity"].includes(
              f.dimension
            )
          )
          .reduce((sum, f) => sum + f.projected, 0) /
          5
      );
      const riskScore = clamp(
        forecasts.find((f) => f.dimension === "risk")?.projected ?? 40
      );

      return {
        id: this.createId(`sim-${candidate.modelId}`),
        modelId: candidate.modelId,
        label: candidate.label,
        archetype: candidate.archetype,
        forecasts,
        overallScore,
        riskScore,
        lenses: buildLenses({
          valueCreated: `${candidate.label} creates projected mission ${Math.round(candidate.mission * 100)}.`,
          valueDelivered: `Scalability ${Math.round(candidate.scale * 100)}.`,
          valueCaptured: `Overall simulation score ${Math.round(overallScore)}.`,
          canImprove: `Design fit ${Math.round(candidate.designFit)}.`,
          canScale: `Growth/scalability outlook embedded in forecasts.`,
          canSustain: `Risk ${Math.round(riskScore)}; capital ${Math.round(candidate.capital * 100)}.`,
        }),
        narrative: `${candidate.label}: score ${Math.round(overallScore)}, risk ${Math.round(riskScore)}.`,
      } satisfies BusinessModelSimulationRecord;
    });

    const ranked = [...simulations].sort(
      (a, b) => b.overallScore - a.riskScore * 0.25 - (a.overallScore - b.riskScore * 0.25)
    );
    // Fix sort: higher (overall - risk*0.25) wins
    ranked.sort(
      (a, b) =>
        b.overallScore - b.riskScore * 0.25 - (a.overallScore - a.riskScore * 0.25)
    );
    const winner = ranked[0]!;

    const comparison: BusinessModelComparisonResult = {
      models: simulations,
      winnerId: winner.id,
      winnerLabel: winner.label,
      narrative: `Simulation prefers ${winner.label} (score ${Math.round(winner.overallScore)}).`,
    };

    return { simulations, comparison };
  }
}

function clamp01ish(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function forecastDimension(
  dimension: SimulationForecastDimension,
  label: string,
  baseline: BusinessModelBaseline,
  ctx: {
    designFit: number;
    capital: number;
    complexity: number;
    scale: number;
    mission: number;
    revenueOutlook: number;
    marginOutlook: number;
    growthOutlook: number;
    riskOutlook: number;
  }
): SimulationForecastPoint {
  const currentMap: Record<SimulationForecastDimension, number> = {
    revenue: baseline.valueCaptureScore,
    profitability: baseline.grossMargin * 100,
    mission_impact: baseline.missionAlignment,
    growth: baseline.growthRate * 100 + 40,
    scalability: baseline.scalabilityScore,
    capital_requirements: baseline.capitalIntensity * 100,
    risk:
      baseline.operationalComplexity * 60 + baseline.capitalIntensity * 40,
    operational_complexity: baseline.operationalComplexity * 100,
  };

  const projectedMap: Record<SimulationForecastDimension, number> = {
    revenue: ctx.revenueOutlook,
    profitability: ctx.marginOutlook,
    mission_impact: clamp(ctx.mission * 100),
    growth: ctx.growthOutlook,
    scalability: clamp(ctx.scale * 100),
    capital_requirements: clamp(ctx.capital * 100),
    risk: ctx.riskOutlook,
    operational_complexity: clamp(ctx.complexity * 100),
  };

  const current = clamp(currentMap[dimension]);
  const projected = clamp(projectedMap[dimension]);

  return {
    dimension,
    label,
    current,
    projected,
    delta: projected - current,
    narrative: `${label}: ${Math.round(current)} → ${Math.round(projected)} (Δ ${Math.round(projected - current)}).`,
  };
}
