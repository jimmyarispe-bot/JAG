import type { InstitutionalMemoryTrendEngineContract } from "@/lib/platform/intelligence/institutional-memory/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/institutional-memory/models";
import { INSTITUTIONAL_MEMORY_AREAS, type InstitutionalMemoryTrendSuite } from "@/lib/platform/intelligence/institutional-memory/types";

export class InstitutionalMemoryTrendEngine implements InstitutionalMemoryTrendEngineContract {
  assess(input: Parameters<InstitutionalMemoryTrendEngineContract["assess"]>[0]): InstitutionalMemoryTrendSuite {
    const trends = INSTITUTIONAL_MEMORY_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const direction = score >= 72 ? "improving" as const : score >= 58 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("imm-trend"),
        area,
        title: `${area.replaceAll("_", " ")} trend`,
        direction,
        magnitude: clamp(Math.abs(score - 65) + index),
        confidence: "medium" as const,
        lenses: buildLens({
            knowledgeConfidence: `Trend knowledge confidence for ${area}.`,
            evidenceStrength: `Trend evidence strength for ${area}.`,
            institutionalMemoryCoverage: `Trend institutional memory coverage for ${area}.`,
            knowledgeFreshness: `Trend knowledge freshness for ${area}.`,
            expertiseAvailability: `Trend expertise availability for ${area}.`,
            knowledgeGaps: `Trend knowledge gaps for ${area}.`,
            knowledgeQuality: `Trend knowledge quality for ${area}.`,
            longTermLearningValue: `Long-term learning value trend for ${area}.`,
          }),
        narrative: `${area} is ${direction} at magnitude ${Math.round(Math.abs(score - 65))}.`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: `Institutional memory trends: ${trends.filter(t => t.direction === "improving").length} improving, ${trends.filter(t => t.direction === "worsening").length} worsening.`,
    };
  }
}
