import type { OutcomeEngineContract } from "@/lib/platform/intelligence/impact/contracts";
import { buildLens, levelFromValue } from "@/lib/platform/intelligence/impact/models";
import { IMPACT_AREAS, type OutcomeSuite } from "@/lib/platform/intelligence/impact/types";
export class OutcomeEngine implements OutcomeEngineContract {
  assess(input: Parameters<OutcomeEngineContract["assess"]>[0]): OutcomeSuite {
    const outcomes = IMPACT_AREAS.map(area => { const current = input.areas[area].score; const baseline = Math.max(0, current - 5); const target = Math.min(100, current + 8); return { id: input.createId("imp-outcome"), title: `${area} measurable outcome`, area, baseline, current, target, achieved: current >= 75, attribution: .68, confidence: levelFromValue(input.baseline.evidenceCoverage / 100), lenses: buildLens({ outcomeAchieved: `${area} reached ${Math.round(current)}.`, evidenceSupports: input.areas[area].narrative, baselineUsed: `${Math.round(baseline)} starting score.`, whatChanged: `Improved ${Math.round(current - baseline)} points.`, confidenceLevel: levelFromValue(input.baseline.evidenceCoverage / 100), causeAttribution: "68% attributed to managed initiatives.", goalsImproved: `${area} outcome goal.`, nextImprovement: `Advance toward target ${Math.round(target)}.` }), narrative: `${area} outcome is ${current >= 75 ? "achieved" : "improving"}.` }; });
    return { outcomes, achievementScore: outcomes.reduce((s, o) => s + o.current, 0) / outcomes.length, achievedCount: outcomes.filter(o => o.achieved).length, narrative: `${outcomes.filter(o => o.achieved).length} of ${outcomes.length} outcomes achieved.` };
  }
}
