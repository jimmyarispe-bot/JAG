import type { CompetitiveTrendEngineContract } from "@/lib/platform/intelligence/competitive/contracts";
import { buildLens, clamp, levelFromValue } from "@/lib/platform/intelligence/competitive/models";
import { COMPETITIVE_AREAS, type CompetitiveTrendSuite } from "@/lib/platform/intelligence/competitive/types";

export class CompetitiveTrendEngine implements CompetitiveTrendEngineContract {
  assess(input: Parameters<CompetitiveTrendEngineContract["assess"]>[0]): CompetitiveTrendSuite {
    const trends = COMPETITIVE_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const magnitude = clamp(Math.abs(score - 65) + index % 4);
      const direction = score >= 70 ? "advancing" as const : score >= 55 ? "stable" as const : "declining" as const;
      return {
        id: input.createId("cmp-trend"),
        area,
        title: `${area.replaceAll("_", " ")} competitive trend`,
        direction,
        magnitude,
        confidence: levelFromValue(input.baseline.evidenceCoverage / 100),
        lenses: buildLens({
          competitiveThreatExists: `${area} is ${direction} with magnitude ${Math.round(magnitude)}.`,
          evidenceSupports: input.areas[area].narrative,
          competitorsInvolved: `Peers and substitutes influencing ${area} trend.`,
          ourDifferentiation: `Our position relative to ${direction} ${area} trajectory.`,
          enrollmentOrRevenueImpact: `Trend-driven enrollment sensitivity around ${area}.`,
          responseOptions: `Lean into advancing signals or hedge ${direction} deterioration.`,
          organizationalCapabilitiesRequired: `Strategy, marketing, admissions, and academic planning.`,
          signalsToMonitor: `${area} acceleration and competitive reversal.`,
        }),
        narrative: `${area} competitive trend is ${direction}.`,
      };
    });
    return {
      trends,
      advancingCount: trends.filter(t => t.direction === "advancing").length,
      decliningCount: trends.filter(t => t.direction === "declining").length,
      narrative: `${trends.filter(t => t.direction === "advancing").length} advancing and ${trends.filter(t => t.direction === "declining").length} declining competitive trends.`,
    };
  }
}
