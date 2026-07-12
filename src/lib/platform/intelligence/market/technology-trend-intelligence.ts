/**
 * Technology Trend Intelligence — disruption and adoption opportunity.
 */

import type { TechnologyTrendIntelligence as TechnologyTrendIntelligenceContract } from "@/lib/platform/intelligence/market/contracts";
import { clamp } from "@/lib/platform/intelligence/market/models";
import type {
  EconomicTrendSuite,
  MarketBaseline,
  TechnologyTrendRecord,
  TechnologyTrendSuite,
} from "@/lib/platform/intelligence/market/types";

const TRENDS = [
  { trend: "AI-assisted learning platforms", stage: "early_majority" },
  { trend: "Adaptive assessment systems", stage: "early_adopter" },
  { trend: "Hybrid campus operations tech", stage: "early_majority" },
  { trend: "Family engagement apps", stage: "late_majority" },
  { trend: "Credential / pathway micro-learning", stage: "innovator" },
];

export class TechnologyTrendIntelligence implements TechnologyTrendIntelligenceContract {
  assess(input: {
    baseline: MarketBaseline;
    economicTrend: EconomicTrendSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): TechnologyTrendSuite {
    const { baseline, economicTrend, createId } = input;
    void input.now;
    const trends: TechnologyTrendRecord[] = TRENDS.map((template, index) => {
      const disruptionPressure = clamp(
        baseline.technologyDisruptionPressure * 100 + (index % 3) * 5
      );
      const opportunityScore = clamp(
        100 - disruptionPressure * 0.35 + economicTrend.tailwindScore * 0.35 + baseline.operationsCapacity * 0.3
      );
      return {
        id: createId("mkt-tech"),
        trend: template.trend,
        disruptionPressure,
        adoptionStage: template.stage,
        opportunityScore,
        narrative: `${template.trend} disruption ${Math.round(disruptionPressure)}; opportunity ${Math.round(opportunityScore)}.`,
      };
    });
    const disruptionScore = clamp(
      trends.reduce((sum, trend) => sum + trend.disruptionPressure, 0) / trends.length
    );
    const opportunityScore = clamp(
      trends.reduce((sum, trend) => sum + trend.opportunityScore, 0) / trends.length
    );

    return {
      trends,
      disruptionScore,
      opportunityScore,
      narrative: `Technology disruption ${Math.round(disruptionScore)}; opportunity ${Math.round(opportunityScore)}.`,
    };
  }
}
