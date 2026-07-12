import type { EconomicTrendEngineContract } from "@/lib/platform/intelligence/economic/contracts";
import { buildLens, clamp, levelFromValue } from "@/lib/platform/intelligence/economic/models";
import { ECONOMIC_AREAS, type EconomicTrendSuite } from "@/lib/platform/intelligence/economic/types";

export class EconomicTrendEngine implements EconomicTrendEngineContract {
  assess(input: Parameters<EconomicTrendEngineContract["assess"]>[0]): EconomicTrendSuite {
    const trends = ECONOMIC_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const magnitude = clamp(Math.abs(score - 65) + index % 4);
      const direction = score >= 70 ? "improving" as const : score >= 55 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("eco-trend"),
        area,
        title: `${area.replaceAll("_", " ")} trend`,
        direction,
        magnitude,
        confidence: levelFromValue(input.baseline.evidenceCoverage / 100),
        lenses: buildLens({
          economicForces: `${area} is ${direction} with magnitude ${Math.round(magnitude)}.`,
          evidenceSupports: input.areas[area].narrative,
          confidenceLevel: levelFromValue(input.baseline.evidenceCoverage / 100),
          organizationalAreas: "Planning, pricing, staffing, and capital allocation.",
          financialImplications: `Trend-driven budget sensitivity around ${area}.`,
          operationalImplications: `Operating plans track ${direction} ${area} conditions.`,
          strategicOptions: `Lean into improving signals or hedge ${direction} deterioration.`,
          scenariosToMonitor: `${area} acceleration and reversal.`,
        }),
        narrative: `${area} trend is ${direction}.`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: `${trends.filter(t => t.direction === "improving").length} improving and ${trends.filter(t => t.direction === "worsening").length} worsening economic trends.`,
    };
  }
}
