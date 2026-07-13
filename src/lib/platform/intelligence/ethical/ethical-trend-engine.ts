import type { EthicalTrendEngineContract } from "@/lib/platform/intelligence/ethical/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/ethical/models";
import { ETHICAL_AREAS, type EthicalTrendSuite } from "@/lib/platform/intelligence/ethical/types";

export class EthicalTrendEngine implements EthicalTrendEngineContract {
  assess(input: Parameters<EthicalTrendEngineContract["assess"]>[0]): EthicalTrendSuite {
    const trends = ETHICAL_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const direction = score >= 72 ? "improving" as const : score >= 58 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("eth-trend"),
        area,
        title: `${area.replaceAll("_", " ")} trend`,
        direction,
        magnitude: clamp(Math.abs(score - 65) + index),
        confidence: "medium" as const,
        lenses: buildLens({
          valuesAlignment: `Trend values alignment for ${area}.`,
          fairness: `Trend fairness for ${area}.`,
          transparency: `Trend transparency for ${area}.`,
          accountability: `Trend accountability for ${area}.`,
          humanImpact: `Trend human impact for ${area}.`,
          biasRisk: `Trend bias risk for ${area}.`,
          governanceIntegrity: `Trend governance integrity for ${area}.`,
          longTermEthicalOutlook: `Long-term ethical outlook trend for ${area}.`,
        }),
        narrative: `${area} is ${direction} at magnitude ${Math.round(Math.abs(score - 65))}.`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: `Ethical trends: ${trends.filter(t => t.direction === "improving").length} improving, ${trends.filter(t => t.direction === "worsening").length} worsening.`,
    };
  }
}
