import type { PoliticalAreaIntelligence } from "@/lib/platform/intelligence/political/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/political/models";
import type { PoliticalArea, PoliticalAreaSuite } from "@/lib/platform/intelligence/political/types";

export function createAreaIntelligence(
  area: PoliticalArea,
  titles: [string, string],
  forceLabel: string,
): new () => PoliticalAreaIntelligence {
  return class implements PoliticalAreaIntelligence {
    assess(input: Parameters<PoliticalAreaIntelligence["assess"]>[0]): PoliticalAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("pol-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: `${item.title} reading ${Math.round(value)}.`,
          evidence: [`baseline:${area}`, `indicator:${area}:current`],
          lenses: buildLens({
            legislativeImpact: `${forceLabel} legislative posture scored ${Math.round(value)}.`,
            regulatoryRisk: `Regulatory exposure linked to ${area} conditions.`,
            governmentFundingOpportunity: `Funding opportunity signals in ${area}.`,
            taxExposure: `Tax and fiscal exposure tracked through ${area}.`,
            politicalStability: `Stability reading for ${area} at ${Math.round(value)}.`,
            tradeImpact: `Trade and cross-border implications of ${area}.`,
            compliancePressure: `Compliance load associated with ${area}.`,
            strategicTiming: `Window to act on ${area} developments.`,
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
        narrative: `${forceLabel} political score ${Math.round(score)}.`,
      };
    }
  };
}
