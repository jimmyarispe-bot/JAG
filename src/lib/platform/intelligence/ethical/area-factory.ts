import type { EthicalAreaIntelligence } from "@/lib/platform/intelligence/ethical/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/ethical/models";
import type { EthicalArea, EthicalAreaSuite } from "@/lib/platform/intelligence/ethical/types";

export function createAreaIntelligence(
  area: EthicalArea,
  titles: [string, string],
  forceLabel: string,
): new () => EthicalAreaIntelligence {
  return class implements EthicalAreaIntelligence {
    assess(input: Parameters<EthicalAreaIntelligence["assess"]>[0]): EthicalAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("eth-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: `${item.title} reading ${Math.round(value)}.`,
          evidence: [`baseline:${area}`, `indicator:${area}:current`],
          lenses: buildLens({
            valuesAlignment: `Values alignment linked to ${area} at ${Math.round(value)}.`,
            fairness: `Fairness implications of ${area} conditions.`,
            transparency: `Transparency surrounding ${area}.`,
            accountability: `Accountability reading for ${area}.`,
            humanImpact: `Human impact associated with ${area}.`,
            biasRisk: `Bias risk reading for ${area}.`,
            governanceIntegrity: `Governance integrity around ${area}.`,
            longTermEthicalOutlook: `Long-term ethical outlook for ${area} developments.`,
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
        narrative: `${forceLabel} ethical score ${Math.round(score)}.`,
      };
    }
  };
}
