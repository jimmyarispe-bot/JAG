import type { EnvironmentalTrendEngineContract } from "@/lib/platform/intelligence/environmental/contracts";
import { buildLens, clamp, levelFromValue } from "@/lib/platform/intelligence/environmental/models";
import { ENVIRONMENTAL_AREAS, type EnvironmentalTrendSuite } from "@/lib/platform/intelligence/environmental/types";

export class EnvironmentalTrendEngine implements EnvironmentalTrendEngineContract {
  assess(input: Parameters<EnvironmentalTrendEngineContract["assess"]>[0]): EnvironmentalTrendSuite {
    const trends = ENVIRONMENTAL_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const magnitude = clamp(Math.abs(score - 65) + index % 4);
      const direction = score >= 70 ? "improving" as const : score >= 55 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("env-trend"),
        area,
        title: `${area.replaceAll("_", " ")} environmental trend`,
        direction,
        magnitude,
        confidence: levelFromValue(input.baseline.evidenceCoverage / 100),
        lenses: buildLens({
          climateRisk: `${area} is ${direction} with magnitude ${Math.round(magnitude)}.`,
          facilityExposure: `Facility trend pressure around ${area}.`,
          infrastructureResilience: `Infrastructure sensitivity to ${direction} ${area} path.`,
          resourceAvailability: `Resource availability tracks ${area} trend.`,
          sustainabilityImpact: `Sustainability implication of ${direction} ${area}.`,
          regulatoryExposure: `Regulatory spillover from ${area} trend.`,
          insuranceRisk: `Insurance load under ${direction} ${area}.`,
          longTermEnvironmentalOutlook: `Monitor ${area} acceleration and reversal.`,
        }),
        narrative: `${area} environmental trend is ${direction}.`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: `${trends.filter(t => t.direction === "improving").length} improving and ${trends.filter(t => t.direction === "worsening").length} worsening environmental trends.`,
    };
  }
}
