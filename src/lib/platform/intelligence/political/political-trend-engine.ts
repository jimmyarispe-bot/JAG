import type { PoliticalTrendEngineContract } from "@/lib/platform/intelligence/political/contracts";
import { buildLens, clamp, levelFromValue } from "@/lib/platform/intelligence/political/models";
import { POLITICAL_AREAS, type PoliticalTrendSuite } from "@/lib/platform/intelligence/political/types";

export class PoliticalTrendEngine implements PoliticalTrendEngineContract {
  assess(input: Parameters<PoliticalTrendEngineContract["assess"]>[0]): PoliticalTrendSuite {
    const trends = POLITICAL_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const magnitude = clamp(Math.abs(score - 65) + index % 4);
      const direction = score >= 70 ? "improving" as const : score >= 55 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("pol-trend"),
        area,
        title: `${area.replaceAll("_", " ")} political trend`,
        direction,
        magnitude,
        confidence: levelFromValue(input.baseline.evidenceCoverage / 100),
        lenses: buildLens({
          legislativeImpact: `${area} is ${direction} with magnitude ${Math.round(magnitude)}.`,
          regulatoryRisk: `Regulatory trend pressure around ${area}.`,
          governmentFundingOpportunity: `Funding sensitivity to ${direction} ${area} path.`,
          taxExposure: `Tax exposure tracks ${area} trend.`,
          politicalStability: `Stability implication of ${direction} ${area}.`,
          tradeImpact: `Trade spillover from ${area} trend.`,
          compliancePressure: `Compliance load under ${direction} ${area}.`,
          strategicTiming: `Monitor ${area} acceleration and reversal.`,
        }),
        narrative: `${area} political trend is ${direction}.`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: `${trends.filter(t => t.direction === "improving").length} improving and ${trends.filter(t => t.direction === "worsening").length} worsening political trends.`,
    };
  }
}
