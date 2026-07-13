import type { StakeholderTrendEngineContract } from "@/lib/platform/intelligence/stakeholder/contracts";
import { buildLens, clamp, levelFromValue } from "@/lib/platform/intelligence/stakeholder/models";
import { STAKEHOLDER_AREAS, type StakeholderTrendSuite } from "@/lib/platform/intelligence/stakeholder/types";

export class StakeholderTrendEngine implements StakeholderTrendEngineContract {
  assess(input: Parameters<StakeholderTrendEngineContract["assess"]>[0]): StakeholderTrendSuite {
    const trends = STAKEHOLDER_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const magnitude = clamp(Math.abs(score - 65) + index % 4);
      const direction = score >= 70 ? "improving" as const : score >= 55 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("stk-trend"),
        area,
        title: `${area.replaceAll("_", " ")} stakeholder trend`,
        direction,
        magnitude,
        confidence: levelFromValue(input.baseline.evidenceCoverage / 100),
        lenses: buildLens({
          influence: `${area} is ${direction} with magnitude ${Math.round(magnitude)}.`,
          interest: `Interest trend pressure around ${area}.`,
          trust: `Trust sensitivity to ${direction} ${area} path.`,
          engagement: `Engagement quality tracks ${area} trend.`,
          satisfaction: `Satisfaction implication of ${direction} ${area}.`,
          relationshipStrength: `Relationship spillover from ${area} trend.`,
          collaborationOpportunity: `Collaboration load under ${direction} ${area}.`,
          strategicImportance: `Monitor ${area} acceleration and reversal.`,
        }),
        narrative: `${area} stakeholder trend is ${direction}.`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: `${trends.filter(t => t.direction === "improving").length} improving and ${trends.filter(t => t.direction === "worsening").length} worsening stakeholder trends.`,
    };
  }
}
