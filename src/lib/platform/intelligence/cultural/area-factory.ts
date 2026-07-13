import type { CulturalAreaIntelligence } from "@/lib/platform/intelligence/cultural/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/cultural/models";
import type { CulturalArea, CulturalAreaSuite } from "@/lib/platform/intelligence/cultural/types";

export function createAreaIntelligence(
  area: CulturalArea,
  titles: [string, string],
  forceLabel: string,
): new () => CulturalAreaIntelligence {
  return class implements CulturalAreaIntelligence {
    assess(input: Parameters<CulturalAreaIntelligence["assess"]>[0]): CulturalAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("cul-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: `${item.title} reading ${Math.round(value)}.`,
          evidence: [`baseline:${area}`, `indicator:${area}:current`],
          lenses: buildLens({
            missionAlignment: `Mission alignment linked to ${area} at ${Math.round(value)}.`,
            valuesAlignment: `Values alignment around ${area} conditions.`,
            culturalHealth: `Cultural health implications of ${area}.`,
            collaborationQuality: `Collaboration quality surrounding ${area}.`,
            innovationReadiness: `Innovation readiness associated with ${area}.`,
            psychologicalSafety: `Psychological safety reading for ${area}.`,
            engagement: `Engagement pressure for ${area} at ${Math.round(value)}.`,
            longTermCulturalOutlook: `Long-term cultural outlook for ${area} developments.`,
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
        narrative: `${forceLabel} cultural score ${Math.round(score)}.`,
      };
    }
  };
}
