import type { ImpactAreaIntelligence } from "@/lib/platform/intelligence/impact/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/impact/models";
import type { ImpactAreaSuite } from "@/lib/platform/intelligence/impact/types";
export class InnovationImpactIntelligence implements ImpactAreaIntelligence {
  assess(input: Parameters<ImpactAreaIntelligence["assess"]>[0]): ImpactAreaSuite {
    const score = clamp(input.baseline.areaScores.innovation);
    const records = [
      { title: "Innovation outcome achievement", delta: 4 },
      { title: "Innovation evidence and improvement", delta: -3 },
    ].map((item, index) => {
      const value = clamp(score + item.delta);
      return { id: input.createId("imp-outcome"), area: "innovation" as const, title: item.title, score: value,
        status: value >= 75 ? "achieved" as const : value >= 60 ? "improving" as const : "at_risk" as const,
        outcome: `${item.title} reached ${Math.round(value)}% of expected performance.`,
        evidence: [`baseline:innovation`, `measurement:innovation:current`],
        lenses: buildLens({ outcomeAchieved: `${item.title} at ${Math.round(value)}.`, evidenceSupports: `Current and longitudinal innovation evidence.`, baselineUsed: `Baseline ${Math.round(score - item.delta)}.`, whatChanged: `${item.delta >= 0 ? "+" : ""}${item.delta} points from baseline.`, confidenceLevel: input.baseline.evidenceCoverage >= 70 ? "high" : "medium", causeAttribution: "Attributed to program execution and operating conditions.", goalsImproved: "Innovation strategic goals.", nextImprovement: `Close the remaining ${Math.round(100 - value)} point outcome gap.` }),
        narrative: `${item.title} score ${Math.round(value)}.` };
    });
    return { area: "innovation", records, score, achievedCount: records.filter(r => r.status === "achieved").length, atRiskCount: records.filter(r => r.status === "at_risk").length, narrative: "Innovation impact score " + Math.round(score) + "." };
  }
}
