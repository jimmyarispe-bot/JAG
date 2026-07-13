import type { EnvironmentalAreaIntelligence } from "@/lib/platform/intelligence/environmental/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/environmental/models";
import type { EnvironmentalArea, EnvironmentalAreaSuite } from "@/lib/platform/intelligence/environmental/types";

export function createAreaIntelligence(
  area: EnvironmentalArea,
  titles: [string, string],
  forceLabel: string,
): new () => EnvironmentalAreaIntelligence {
  return class implements EnvironmentalAreaIntelligence {
    assess(input: Parameters<EnvironmentalAreaIntelligence["assess"]>[0]): EnvironmentalAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("env-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: `${item.title} reading ${Math.round(value)}.`,
          evidence: [`baseline:${area}`, `indicator:${area}:current`],
          lenses: buildLens({
            climateRisk: `${forceLabel} climate risk scored ${Math.round(value)}.`,
            facilityExposure: `Facility exposure linked to ${area} conditions.`,
            infrastructureResilience: `Infrastructure resilience signals in ${area}.`,
            resourceAvailability: `Resource availability tracked through ${area}.`,
            sustainabilityImpact: `Sustainability impact reading for ${area} at ${Math.round(value)}.`,
            regulatoryExposure: `Regulatory exposure implications of ${area}.`,
            insuranceRisk: `Insurance load associated with ${area}.`,
            longTermEnvironmentalOutlook: `Long-term outlook window for ${area} developments.`,
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
        narrative: `${forceLabel} environmental score ${Math.round(score)}.`,
      };
    }
  };
}
