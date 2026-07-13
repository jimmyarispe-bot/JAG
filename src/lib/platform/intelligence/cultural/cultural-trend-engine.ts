import type { CulturalTrendEngineContract } from "@/lib/platform/intelligence/cultural/contracts";
import { buildLens, clamp, levelFromValue } from "@/lib/platform/intelligence/cultural/models";
import { CULTURAL_AREAS, type CulturalTrendSuite } from "@/lib/platform/intelligence/cultural/types";

export class CulturalTrendEngine implements CulturalTrendEngineContract {
  assess(input: Parameters<CulturalTrendEngineContract["assess"]>[0]): CulturalTrendSuite {
    const trends = CULTURAL_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const magnitude = clamp(Math.abs(score - 65) + index % 4);
      const direction = score >= 70 ? "improving" as const : score >= 55 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("cul-trend"),
        area,
        title: `${area.replaceAll("_", " ")} cultural trend`,
        direction,
        magnitude,
        confidence: levelFromValue(input.baseline.evidenceCoverage / 100),
        lenses: buildLens({
          missionAlignment: `${area} is ${direction} with magnitude ${Math.round(magnitude)}.`,
          valuesAlignment: `Values trend pressure around ${area}.`,
          culturalHealth: `Cultural health sensitivity to ${direction} ${area} path.`,
          collaborationQuality: `Collaboration tracks ${area} trend.`,
          innovationReadiness: `Innovation implication of ${direction} ${area}.`,
          psychologicalSafety: `Safety spillover from ${area} trend.`,
          engagement: `Engagement load under ${direction} ${area}.`,
          longTermCulturalOutlook: `Monitor ${area} acceleration and reversal.`,
        }),
        narrative: `${area} cultural trend is ${direction}.`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: `${trends.filter(t => t.direction === "improving").length} improving and ${trends.filter(t => t.direction === "worsening").length} worsening cultural trends.`,
    };
  }
}
