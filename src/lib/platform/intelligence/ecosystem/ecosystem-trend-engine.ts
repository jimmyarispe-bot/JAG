import type { EcosystemTrendEngineContract } from "@/lib/platform/intelligence/ecosystem/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/ecosystem/models";
import { ECOSYSTEM_AREAS, type EcosystemTrendSuite } from "@/lib/platform/intelligence/ecosystem/types";

export class EcosystemTrendEngine implements EcosystemTrendEngineContract {
  assess(input: Parameters<EcosystemTrendEngineContract["assess"]>[0]): EcosystemTrendSuite {
    const trends = ECOSYSTEM_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const direction = score >= 72 ? "improving" as const : score >= 58 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("esm-trend"),
        area,
        title: `${area.replaceAll("_", " ")} trend`,
        direction,
        magnitude: clamp(Math.abs(score - 65) + index),
        confidence: "medium" as const,
        lenses: buildLens({
            networkStrength: `Trend network strength for ${area}.`,
            strategicPartnerships: `Trend strategic partnerships for ${area}.`,
            ecosystemHealth: `Trend ecosystem health for ${area}.`,
            collaborationPotential: `Trend collaboration potential for ${area}.`,
            dependencyRisk: `Trend dependency risk for ${area}.`,
            networkEffects: `Trend network effects for ${area}.`,
            strategicPosition: `Trend strategic position for ${area}.`,
            longTermEcosystemOutlook: `Long-term ecosystem outlook trend for ${area}.`,
          }),
        narrative: `${area} is ${direction} at magnitude ${Math.round(Math.abs(score - 65))}.`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: `Ecosystem trends: ${trends.filter(t => t.direction === "improving").length} improving, ${trends.filter(t => t.direction === "worsening").length} worsening.`,
    };
  }
}
