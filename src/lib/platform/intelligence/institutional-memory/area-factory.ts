import type { InstitutionalMemoryAreaIntelligence } from "@/lib/platform/intelligence/institutional-memory/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/institutional-memory/models";
import type { InstitutionalMemoryArea, InstitutionalMemoryAreaSuite } from "@/lib/platform/intelligence/institutional-memory/types";

export function createAreaIntelligence(
  area: InstitutionalMemoryArea,
  titles: [string, string],
  forceLabel: string,
): new () => InstitutionalMemoryAreaIntelligence {
  return class implements InstitutionalMemoryAreaIntelligence {
    assess(input: Parameters<InstitutionalMemoryAreaIntelligence["assess"]>[0]): InstitutionalMemoryAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("imm-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: `${item.title} reading ${Math.round(value)}.`,
          evidence: [`baseline:${area}`, `indicator:${area}:current`],
          lenses: buildLens({
            knowledgeConfidence: `Knowledge confidence linked to ${area} at ${Math.round(value)}.`,
            evidenceStrength: `Evidence strength implications of ${area} conditions.`,
            institutionalMemoryCoverage: `Institutional memory coverage surrounding ${area}.`,
            knowledgeFreshness: `Knowledge freshness reading for ${area}.`,
            expertiseAvailability: `Expertise availability associated with ${area}.`,
            knowledgeGaps: `Knowledge gaps around ${area}.`,
            knowledgeQuality: `Knowledge quality reading for ${area}.`,
            longTermLearningValue: `Long-term learning value for ${area} developments.`,
          }),
          narrative: `${item.title} score ${Math.round(value)}.`,
        };
      });
      return {
        area,
        records,
        score,
        favorableCount: records.filter(r => r.status === "favorable").length,
        atRiskCount: records.filter(r => r.status === "at_risk").length,
        narrative: `${forceLabel} institutional memory score ${Math.round(score)}.`,
      };
    }
  };
}
