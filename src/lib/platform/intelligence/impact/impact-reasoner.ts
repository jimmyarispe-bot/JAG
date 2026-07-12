import type { ImpactReasonerContract } from "@/lib/platform/intelligence/impact/contracts";
import type { ImpactReasoningResult } from "@/lib/platform/intelligence/impact/types";
export class ImpactReasoner implements ImpactReasonerContract {
  reason(input: Parameters<ImpactReasonerContract["reason"]>[0]): ImpactReasoningResult {
    const connectedOutcomes = input.outcomes.outcomes.slice().sort((a,b) => b.current-a.current).slice(0,6).map(o=>o.title);
    const evidenceGaps = input.measurements.measurements.filter(m => m.current < m.target).slice(0,6).map(m=>m.name);
    return { answer: input.request.question ?? `${input.outcomes.achievedCount} outcomes achieved with ${Math.round(input.outcomes.achievementScore)} overall outcome performance.`, connectedOutcomes, evidenceGaps, confidence: input.confidence, narrative: `Reasoning used ${input.measurements.measurements.length} measures and ${input.outcomes.outcomes.length} outcomes.` };
  }
}
