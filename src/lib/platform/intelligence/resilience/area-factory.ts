import type { ResilienceAreaIntelligence } from "@/lib/platform/intelligence/resilience/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/resilience/models";
import type { ResilienceArea, ResilienceAreaSuite } from "@/lib/platform/intelligence/resilience/types";

export function createAreaIntelligence(
  area: ResilienceArea,
  titles: [string, string],
  forceLabel: string,
): new () => ResilienceAreaIntelligence {
  return class implements ResilienceAreaIntelligence {
    assess(input: Parameters<ResilienceAreaIntelligence["assess"]>[0]): ResilienceAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("rsl-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: `${item.title} reading ${Math.round(value)}.`,
          evidence: [`baseline:${area}`, `indicator:${area}:current`],
          lenses: buildLens({
            organizationalReadiness: `Organizational readiness linked to ${area} at ${Math.round(value)}.`,
            recoveryCapability: `Recovery capability implications of ${area} conditions.`,
            operationalStability: `Operational stability surrounding ${area}.`,
            financialStability: `Financial stability reading for ${area}.`,
            workforceStability: `Workforce stability associated with ${area}.`,
            infrastructureReadiness: `Infrastructure readiness reading for ${area}.`,
            adaptiveCapacity: `Adaptive capacity around ${area}.`,
            longTermResilienceOutlook: `Long-term resilience outlook for ${area} developments.`,
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
        narrative: `${forceLabel} resilience score ${Math.round(score)}.`,
      };
    }
  };
}
