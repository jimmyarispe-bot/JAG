import type { SystemsAreaIntelligence } from "@/lib/platform/intelligence/systems/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/systems/models";
import type { SystemsArea, SystemsAreaSuite } from "@/lib/platform/intelligence/systems/types";

export function createAreaIntelligence(
  area: SystemsArea,
  titles: [string, string],
  forceLabel: string,
): new () => SystemsAreaIntelligence {
  return class implements SystemsAreaIntelligence {
    assess(input: Parameters<SystemsAreaIntelligence["assess"]>[0]): SystemsAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("sys-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: `${item.title} reading ${Math.round(value)}.`,
          evidence: [`baseline:${area}`, `indicator:${area}:current`],
          lenses: buildLens({
            dependencyImpact: `Dependency impact linked to ${area} at ${Math.round(value)}.`,
            bottleneckRisk: `Bottleneck risk implications of ${area} conditions.`,
            feedbackStability: `Feedback stability surrounding ${area}.`,
            systemComplexity: `System complexity reading for ${area}.`,
            resourceFlow: `Resource flow associated with ${area}.`,
            cascadingRisk: `Cascading risk reading for ${area}.`,
            adaptability: `Adaptability around ${area}.`,
            longTermSystemHealth: `Long-term system health for ${area} developments.`,
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
        narrative: `${forceLabel} systems score ${Math.round(score)}.`,
      };
    }
  };
}
