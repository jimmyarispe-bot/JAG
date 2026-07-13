import type { ReputationTrendEngineContract } from "@/lib/platform/intelligence/reputation/contracts";
import { buildLens, clamp, levelFromValue } from "@/lib/platform/intelligence/reputation/models";
import { REPUTATION_AREAS, type ReputationTrendSuite } from "@/lib/platform/intelligence/reputation/types";

export class ReputationTrendEngine implements ReputationTrendEngineContract {
  assess(input: Parameters<ReputationTrendEngineContract["assess"]>[0]): ReputationTrendSuite {
    const trends = REPUTATION_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const magnitude = clamp(Math.abs(score - 65) + index % 4);
      const direction = score >= 70 ? "improving" as const : score >= 55 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("rep-trend"),
        area,
        title: `${area.replaceAll("_", " ")} reputation trend`,
        direction,
        magnitude,
        confidence: levelFromValue(input.baseline.evidenceCoverage / 100),
        lenses: buildLens({
          trustLevel: `${area} is ${direction} with magnitude ${Math.round(magnitude)}.`,
          publicPerception: `Perception trend pressure around ${area}.`,
          brandStrength: `Brand sensitivity to ${direction} ${area} path.`,
          mediaExposure: `Media exposure tracks ${area} trend.`,
          crisisRisk: `Crisis implication of ${direction} ${area}.`,
          narrativeMomentum: `Narrative spillover from ${area} trend.`,
          credibility: `Credibility load under ${direction} ${area}.`,
          longTermReputationOutlook: `Monitor ${area} acceleration and reversal.`,
        }),
        narrative: `${area} reputation trend is ${direction}.`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: `${trends.filter(t => t.direction === "improving").length} improving and ${trends.filter(t => t.direction === "worsening").length} worsening reputation trends.`,
    };
  }
}
