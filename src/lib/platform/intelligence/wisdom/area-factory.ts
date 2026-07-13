import type { WisdomAreaIntelligence } from "@/lib/platform/intelligence/wisdom/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/wisdom/models";
import type { WisdomArea, WisdomAreaSuite } from "@/lib/platform/intelligence/wisdom/types";

export function createAreaIntelligence(
  area: WisdomArea,
  titles: [string, string],
  forceLabel: string,
): new () => WisdomAreaIntelligence {
  return class implements WisdomAreaIntelligence {
    assess(input: Parameters<WisdomAreaIntelligence["assess"]>[0]): WisdomAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("wis-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: `${item.title} reading ${Math.round(value)}.`,
          evidence: [`baseline:${area}`, `indicator:${area}:current`],
          lenses: buildLens({
            strategicValue: `Strategic value linked to ${area} at ${Math.round(value)}.`,
            longTermImpact: `Long-term impact implications of ${area} conditions.`,
            confidenceLevel: `Confidence level surrounding ${area}.`,
            evidenceQuality: `Evidence quality reading for ${area}.`,
            tradeOffBalance: `Trade-off balance associated with ${area}.`,
            organizationalAlignment: `Organizational alignment reading for ${area}.`,
            ethicalIntegrity: `Ethical integrity in ${area}.`,
            wisdomScore: `Wisdom score for ${area} developments.`,
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
        narrative: `${forceLabel} wisdom intelligence score ${Math.round(score)}.`,
      };
    }
  };
}
