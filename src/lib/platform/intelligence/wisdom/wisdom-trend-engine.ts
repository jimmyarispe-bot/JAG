import type { WisdomTrendEngineContract } from "@/lib/platform/intelligence/wisdom/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/wisdom/models";
import { WISDOM_AREAS, type WisdomTrendSuite } from "@/lib/platform/intelligence/wisdom/types";

export class WisdomTrendEngine implements WisdomTrendEngineContract {
  assess(input: Parameters<WisdomTrendEngineContract["assess"]>[0]): WisdomTrendSuite {
    const trends = WISDOM_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const direction = score >= 72 ? "improving" as const : score >= 58 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("wis-trend"),
        area,
        title: `${area.replaceAll("_", " ")} trend`,
        direction,
        magnitude: clamp(Math.abs(score - 65) + index),
        confidence: "medium" as const,
        lenses: buildLens({
            strategicValue: `Trend strategic value for ${area}.`,
            longTermImpact: `Trend long-term impact for ${area}.`,
            confidenceLevel: `Trend confidence level for ${area}.`,
            evidenceQuality: `Trend evidence quality for ${area}.`,
            tradeOffBalance: `Trend trade-off balance for ${area}.`,
            organizationalAlignment: `Trend organizational alignment for ${area}.`,
            ethicalIntegrity: `Trend ethical integrity for ${area}.`,
            wisdomScore: `Wisdom score trend for ${area}.`,
          }),
        narrative: `${area} is ${direction} at magnitude ${Math.round(Math.abs(score - 65))}.`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: `Wisdom trends: ${trends.filter(t => t.direction === "improving").length} improving, ${trends.filter(t => t.direction === "worsening").length} worsening.`,
    };
  }
}
