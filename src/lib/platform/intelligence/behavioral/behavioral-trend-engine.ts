import type { BehavioralTrendEngineContract } from "@/lib/platform/intelligence/behavioral/contracts";
import { buildLens, clamp, levelFromValue } from "@/lib/platform/intelligence/behavioral/models";
import { BEHAVIORAL_AREAS, type BehavioralTrendSuite } from "@/lib/platform/intelligence/behavioral/types";

export class BehavioralTrendEngine implements BehavioralTrendEngineContract {
  assess(input: Parameters<BehavioralTrendEngineContract["assess"]>[0]): BehavioralTrendSuite {
    const trends = BEHAVIORAL_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const magnitude = clamp(Math.abs(score - 65) + index % 4);
      const direction = score >= 70 ? "improving" as const : score >= 55 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("beh-trend"),
        area,
        title: `${area.replaceAll("_", " ")} behavioral trend`,
        direction,
        magnitude,
        confidence: levelFromValue(input.baseline.evidenceCoverage / 100),
        lenses: buildLens({
          decisionConfidence: `${area} is ${direction} with magnitude ${Math.round(magnitude)}.`,
          cognitiveBiasRisk: `Bias trend pressure around ${area}.`,
          motivationAlignment: `Motivation sensitivity to ${direction} ${area} path.`,
          adoptionProbability: `Adoption tracks ${area} trend.`,
          collaborationImpact: `Collaboration implication of ${direction} ${area}.`,
          changeResistance: `Resistance spillover from ${area} trend.`,
          leadershipReadiness: `Leadership load under ${direction} ${area}.`,
          longTermBehavioralOutlook: `Monitor ${area} acceleration and reversal.`,
        }),
        narrative: `${area} behavioral trend is ${direction}.`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: `${trends.filter(t => t.direction === "improving").length} improving and ${trends.filter(t => t.direction === "worsening").length} worsening behavioral trends.`,
    };
  }
}
