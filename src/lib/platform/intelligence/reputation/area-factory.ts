import type { ReputationAreaIntelligence } from "@/lib/platform/intelligence/reputation/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/reputation/models";
import type { ReputationArea, ReputationAreaSuite } from "@/lib/platform/intelligence/reputation/types";

export function createAreaIntelligence(
  area: ReputationArea,
  titles: [string, string],
  forceLabel: string,
): new () => ReputationAreaIntelligence {
  return class implements ReputationAreaIntelligence {
    assess(input: Parameters<ReputationAreaIntelligence["assess"]>[0]): ReputationAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("rep-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: `${item.title} reading ${Math.round(value)}.`,
          evidence: [`baseline:${area}`, `indicator:${area}:current`],
          lenses: buildLens({
            trustLevel: `Trust level linked to ${area} at ${Math.round(value)}.`,
            publicPerception: `Public perception of ${area} conditions.`,
            brandStrength: `Brand strength implications of ${area}.`,
            mediaExposure: `Media exposure surrounding ${area}.`,
            crisisRisk: `Crisis risk associated with ${area}.`,
            narrativeMomentum: `Narrative momentum for ${area}.`,
            credibility: `Credibility reading for ${area} at ${Math.round(value)}.`,
            longTermReputationOutlook: `Long-term reputation outlook for ${area} developments.`,
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
        narrative: `${forceLabel} reputation score ${Math.round(score)}.`,
      };
    }
  };
}
