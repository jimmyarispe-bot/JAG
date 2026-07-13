import type { CollectiveTrendEngineContract } from "@/lib/platform/intelligence/collective/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/collective/models";
import { COLLECTIVE_AREAS, type CollectiveTrendSuite } from "@/lib/platform/intelligence/collective/types";

export class CollectiveTrendEngine implements CollectiveTrendEngineContract {
  assess(input: Parameters<CollectiveTrendEngineContract["assess"]>[0]): CollectiveTrendSuite {
    const trends = COLLECTIVE_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const direction = score >= 72 ? "improving" as const : score >= 58 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("col-trend"),
        area,
        title: `${area.replaceAll("_", " ")} trend`,
        direction,
        magnitude: clamp(Math.abs(score - 65) + index),
        confidence: "medium" as const,
        lenses: buildLens({
            consensusStrength: `Trend consensus strength for ${area}.`,
            expertiseCoverage: `Trend expertise coverage for ${area}.`,
            perspectiveDiversity: `Trend perspective diversity for ${area}.`,
            crossDomainAgreement: `Trend cross-domain agreement for ${area}.`,
            organizationalAlignment: `Trend organizational alignment for ${area}.`,
            collaborationQuality: `Trend collaboration quality for ${area}.`,
            collectiveConfidence: `Trend collective confidence for ${area}.`,
            longTermCollectiveValue: `Long-term collective value trend for ${area}.`,
          }),
        narrative: `${area} is ${direction} at magnitude ${Math.round(Math.abs(score - 65))}.`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: `Collective trends: ${trends.filter(t => t.direction === "improving").length} improving, ${trends.filter(t => t.direction === "worsening").length} worsening.`,
    };
  }
}
