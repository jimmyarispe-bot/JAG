import type { StakeholderAreaIntelligence } from "@/lib/platform/intelligence/stakeholder/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/stakeholder/models";
import type { StakeholderArea, StakeholderAreaSuite } from "@/lib/platform/intelligence/stakeholder/types";

export function createAreaIntelligence(
  area: StakeholderArea,
  titles: [string, string],
  forceLabel: string,
): new () => StakeholderAreaIntelligence {
  return class implements StakeholderAreaIntelligence {
    assess(input: Parameters<StakeholderAreaIntelligence["assess"]>[0]): StakeholderAreaSuite {
      const score = clamp(input.baseline.areaScores[area]);
      const records = [
        { title: titles[0], delta: 3 },
        { title: titles[1], delta: -4 },
      ].map((item) => {
        const value = clamp(score + item.delta);
        return {
          id: input.createId("stk-signal"),
          area,
          title: item.title,
          score: value,
          status: value >= 75 ? "favorable" as const : value >= 60 ? "improving" as const : "at_risk" as const,
          signal: `${item.title} reading ${Math.round(value)}.`,
          evidence: [`baseline:${area}`, `indicator:${area}:current`],
          lenses: buildLens({
            influence: `${forceLabel} influence scored ${Math.round(value)}.`,
            interest: `Interest posture linked to ${area} conditions.`,
            trust: `Trust signals in ${area}.`,
            engagement: `Engagement quality tracked through ${area}.`,
            satisfaction: `Satisfaction reading for ${area} at ${Math.round(value)}.`,
            relationshipStrength: `Relationship strength implications of ${area}.`,
            collaborationOpportunity: `Collaboration opportunity associated with ${area}.`,
            strategicImportance: `Strategic importance window for ${area} developments.`,
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
        narrative: `${forceLabel} stakeholder score ${Math.round(score)}.`,
      };
    }
  };
}
