import type { EconomicAreaIntelligence } from "@/lib/platform/intelligence/economic/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/economic/models";
import type { EconomicArea, EconomicAreaSuite } from "@/lib/platform/intelligence/economic/types";

export function createAreaIntelligence(
  area: EconomicArea,
  titles: [string, string],
  forceLabel: string,
): new () => EconomicAreaIntelligence {
  return class implements EconomicAreaIntelligence {
    assess(input: Parameters<EconomicAreaIntelligence["assess"]>[0]): EconomicAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("eco-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: `${item.title} reading ${Math.round(value)}.`,
          evidence: [`baseline:${area}`, `indicator:${area}:current`],
          lenses: buildLens({
            economicForces: `${forceLabel} conditions scored ${Math.round(value)}.`,
            evidenceSupports: `Current ${area} indicators and upstream soft signals.`,
            confidenceLevel: input.baseline.evidenceCoverage >= 70 ? "high" : "medium",
            organizationalAreas: "Strategy, pricing, staffing, funding, and operations.",
            financialImplications: `Budget and margin exposure tracked against ${area} movement.`,
            operationalImplications: `Operating cadence and capacity adjust to ${area} pressure.`,
            strategicOptions: `Hedge, reprice, reallocate, or monitor ${area} exposure.`,
            scenariosToMonitor: `${area} shock, lagging recovery, and regional divergence.`,
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
        narrative: `${forceLabel} economic score ${Math.round(score)}.`,
      };
    }
  };
}
