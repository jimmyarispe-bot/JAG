import type { EcosystemAreaIntelligence } from "@/lib/platform/intelligence/ecosystem/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/ecosystem/models";
import type { EcosystemArea, EcosystemAreaSuite } from "@/lib/platform/intelligence/ecosystem/types";

export function createAreaIntelligence(
  area: EcosystemArea,
  titles: [string, string],
  forceLabel: string,
): new () => EcosystemAreaIntelligence {
  return class implements EcosystemAreaIntelligence {
    assess(input: Parameters<EcosystemAreaIntelligence["assess"]>[0]): EcosystemAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("esm-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: `${item.title} reading ${Math.round(value)}.`,
          evidence: [`baseline:${area}`, `indicator:${area}:current`],
          lenses: buildLens({
            networkStrength: `Network strength linked to ${area} at ${Math.round(value)}.`,
            strategicPartnerships: `Strategic partnership implications of ${area} conditions.`,
            ecosystemHealth: `Ecosystem health surrounding ${area}.`,
            collaborationPotential: `Collaboration potential reading for ${area}.`,
            dependencyRisk: `Dependency risk associated with ${area}.`,
            networkEffects: `Network effects around ${area}.`,
            strategicPosition: `Strategic position reading for ${area}.`,
            longTermEcosystemOutlook: `Long-term ecosystem outlook for ${area} developments.`,
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
        narrative: `${forceLabel} ecosystem score ${Math.round(score)}.`,
      };
    }
  };
}
