import type { BehavioralAreaIntelligence } from "@/lib/platform/intelligence/behavioral/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/behavioral/models";
import type { BehavioralArea, BehavioralAreaSuite } from "@/lib/platform/intelligence/behavioral/types";

export function createAreaIntelligence(
  area: BehavioralArea,
  titles: [string, string],
  forceLabel: string,
): new () => BehavioralAreaIntelligence {
  return class implements BehavioralAreaIntelligence {
    assess(input: Parameters<BehavioralAreaIntelligence["assess"]>[0]): BehavioralAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("beh-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: `${item.title} reading ${Math.round(value)}.`,
          evidence: [`baseline:${area}`, `indicator:${area}:current`],
          lenses: buildLens({
            decisionConfidence: `Decision confidence linked to ${area} at ${Math.round(value)}.`,
            cognitiveBiasRisk: `Cognitive bias risk around ${area} conditions.`,
            motivationAlignment: `Motivation alignment implications of ${area}.`,
            adoptionProbability: `Adoption probability surrounding ${area}.`,
            collaborationImpact: `Collaboration impact associated with ${area}.`,
            changeResistance: `Change resistance reading for ${area}.`,
            leadershipReadiness: `Leadership readiness for ${area} at ${Math.round(value)}.`,
            longTermBehavioralOutlook: `Long-term behavioral outlook for ${area} developments.`,
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
        narrative: `${forceLabel} behavioral score ${Math.round(score)}.`,
      };
    }
  };
}
