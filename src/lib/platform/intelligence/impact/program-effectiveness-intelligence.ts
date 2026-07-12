import type { ImpactAreaIntelligence } from "@/lib/platform/intelligence/impact/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/impact/models";
import type { ImpactAreaSuite } from "@/lib/platform/intelligence/impact/types";
export class ProgramEffectivenessImpactIntelligence implements ImpactAreaIntelligence {
  assess(input: Parameters<ImpactAreaIntelligence["assess"]>[0]): ImpactAreaSuite {
    const score = clamp(input.baseline.areaScores.program_effectiveness);
    const records = [
      { title: "Program Effectiveness outcome achievement", delta: 4 },
      { title: "Program Effectiveness evidence and improvement", delta: -3 },
    ].map((item, index) => {
      const value = clamp(score + item.delta);
      return { id: input.createId("imp-outcome"), area: "program_effectiveness" as const, title: item.title, score: value,
        status: value >= 75 ? "achieved" as const : value >= 60 ? "improving" as const : "at_risk" as const,
        outcome: `${item.title} reached ${Math.round(value)}% of expected performance.`,
        evidence: [`baseline:program_effectiveness`, `measurement:program_effectiveness:current`],
        lenses: buildLens({ outcomeAchieved: `${item.title} at ${Math.round(value)}.`, evidenceSupports: `Current and longitudinal program effectiveness evidence.`, baselineUsed: `Baseline ${Math.round(score - item.delta)}.`, whatChanged: `${item.delta >= 0 ? "+" : ""}${item.delta} points from baseline.`, confidenceLevel: input.baseline.evidenceCoverage >= 70 ? "high" : "medium", causeAttribution: "Attributed to program execution and operating conditions.", goalsImproved: "Program Effectiveness strategic goals.", nextImprovement: `Close the remaining ${Math.round(100 - value)} point outcome gap.` }),
        narrative: `${item.title} score ${Math.round(value)}.` };
    });
    return { area: "program_effectiveness", records, score, achievedCount: records.filter(r => r.status === "achieved").length, atRiskCount: records.filter(r => r.status === "at_risk").length, narrative: "Program Effectiveness impact score " + Math.round(score) + "." };
  }
}
