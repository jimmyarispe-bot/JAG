import type { SystemsTrendEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/systems/models";
import { SYSTEMS_AREAS, type SystemsTrendSuite } from "@/lib/platform/intelligence/systems/types";

export class SystemsTrendEngine implements SystemsTrendEngineContract {
  assess(input: Parameters<SystemsTrendEngineContract["assess"]>[0]): SystemsTrendSuite {
    const trends = SYSTEMS_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const direction = score >= 72 ? "improving" as const : score >= 58 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("sys-trend"),
        area,
        title: `${area.replaceAll("_", " ")} trend`,
        direction,
        magnitude: clamp(Math.abs(score - 65) + index),
        confidence: "medium" as const,
        lenses: buildLens({
            dependencyImpact: `Trend dependency impact for ${area}.`,
            bottleneckRisk: `Trend bottleneck risk for ${area}.`,
            feedbackStability: `Trend feedback stability for ${area}.`,
            systemComplexity: `Trend system complexity for ${area}.`,
            resourceFlow: `Trend resource flow for ${area}.`,
            cascadingRisk: `Trend cascading risk for ${area}.`,
            adaptability: `Trend adaptability for ${area}.`,
            longTermSystemHealth: `Long-term system health trend for ${area}.`,
          }),
        narrative: `${area} is ${direction} at magnitude ${Math.round(Math.abs(score - 65))}.`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: `Systems trends: ${trends.filter(t => t.direction === "improving").length} improving, ${trends.filter(t => t.direction === "worsening").length} worsening.`,
    };
  }
}
