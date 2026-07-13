import type { CollectiveAreaIntelligence } from "@/lib/platform/intelligence/collective/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/collective/models";
import type { CollectiveArea, CollectiveAreaSuite } from "@/lib/platform/intelligence/collective/types";

export function createAreaIntelligence(
  area: CollectiveArea,
  titles: [string, string],
  forceLabel: string,
): new () => CollectiveAreaIntelligence {
  return class implements CollectiveAreaIntelligence {
    assess(input: Parameters<CollectiveAreaIntelligence["assess"]>[0]): CollectiveAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("col-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: `${item.title} reading ${Math.round(value)}.`,
          evidence: [`baseline:${area}`, `indicator:${area}:current`],
          lenses: buildLens({
            consensusStrength: `Consensus strength linked to ${area} at ${Math.round(value)}.`,
            expertiseCoverage: `Expertise coverage implications of ${area} conditions.`,
            perspectiveDiversity: `Perspective diversity surrounding ${area}.`,
            crossDomainAgreement: `Cross-domain agreement reading for ${area}.`,
            organizationalAlignment: `Organizational alignment associated with ${area}.`,
            collaborationQuality: `Collaboration quality reading for ${area}.`,
            collectiveConfidence: `Collective confidence in ${area}.`,
            longTermCollectiveValue: `Long-term collective value for ${area} developments.`,
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
        narrative: `${forceLabel} collective intelligence score ${Math.round(score)}.`,
      };
    }
  };
}
