import type { ImpactAreaIntelligence } from "@/lib/platform/intelligence/impact/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/impact/models";
import type { ImpactAreaSuite } from "@/lib/platform/intelligence/impact/types";
export class CustomerImpactIntelligence implements ImpactAreaIntelligence {
  assess(input: Parameters<ImpactAreaIntelligence["assess"]>[0]): ImpactAreaSuite {
    const score = clamp(input.baseline.areaScores.customer);
    const records = [
      { title: "Customer outcome achievement", delta: 4 },
      { title: "Customer evidence and improvement", delta: -3 },
    ].map((item, index) => {
      const value = clamp(score + item.delta);
      return { id: input.createId("imp-outcome"), area: "customer" as const, title: item.title, score: value,
        status: value >= 75 ? "achieved" as const : value >= 60 ? "improving" as const : "at_risk" as const,
        outcome: `${item.title} reached ${Math.round(value)}% of expected performance.`,
        evidence: [`baseline:customer`, `measurement:customer:current`],
        lenses: buildLens({ outcomeAchieved: `${item.title} at ${Math.round(value)}.`, evidenceSupports: `Current and longitudinal customer evidence.`, baselineUsed: `Baseline ${Math.round(score - item.delta)}.`, whatChanged: `${item.delta >= 0 ? "+" : ""}${item.delta} points from baseline.`, confidenceLevel: input.baseline.evidenceCoverage >= 70 ? "high" : "medium", causeAttribution: "Attributed to program execution and operating conditions.", goalsImproved: "Customer strategic goals.", nextImprovement: `Close the remaining ${Math.round(100 - value)} point outcome gap.` }),
        narrative: `${item.title} score ${Math.round(value)}.` };
    });
    return { area: "customer", records, score, achievedCount: records.filter(r => r.status === "achieved").length, atRiskCount: records.filter(r => r.status === "at_risk").length, narrative: "Customer impact score " + Math.round(score) + "." };
  }
}
