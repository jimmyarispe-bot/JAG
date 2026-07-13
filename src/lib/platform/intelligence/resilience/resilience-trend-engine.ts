import type { ResilienceTrendEngineContract } from "@/lib/platform/intelligence/resilience/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/resilience/models";
import { RESILIENCE_AREAS, type ResilienceTrendSuite } from "@/lib/platform/intelligence/resilience/types";

export class ResilienceTrendEngine implements ResilienceTrendEngineContract {
  assess(input: Parameters<ResilienceTrendEngineContract["assess"]>[0]): ResilienceTrendSuite {
    const trends = RESILIENCE_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const direction = score >= 72 ? "improving" as const : score >= 58 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("rsl-trend"),
        area,
        title: `${area.replaceAll("_", " ")} trend`,
        direction,
        magnitude: clamp(Math.abs(score - 65) + index),
        confidence: "medium" as const,
        lenses: buildLens({
            organizationalReadiness: `Trend organizational readiness for ${area}.`,
            recoveryCapability: `Trend recovery capability for ${area}.`,
            operationalStability: `Trend operational stability for ${area}.`,
            financialStability: `Trend financial stability for ${area}.`,
            workforceStability: `Trend workforce stability for ${area}.`,
            infrastructureReadiness: `Trend infrastructure readiness for ${area}.`,
            adaptiveCapacity: `Trend adaptive capacity for ${area}.`,
            longTermResilienceOutlook: `Long-term resilience outlook trend for ${area}.`,
          }),
        narrative: `${area} is ${direction} at magnitude ${Math.round(Math.abs(score - 65))}.`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: `Resilience trends: ${trends.filter(t => t.direction === "improving").length} improving, ${trends.filter(t => t.direction === "worsening").length} worsening.`,
    };
  }
}
