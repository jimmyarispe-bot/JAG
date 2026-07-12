import type { ClosedLearningLoopContribution, ImpactRecommendationRecord, OutcomeSuite } from "@/lib/platform/intelligence/impact/types";
export class ClosedLearningLoop {
  contribute(input: { outcomes: OutcomeSuite; recommendations: ImpactRecommendationRecord[]; now: Date; createId: (prefix: string) => string }): ClosedLearningLoopContribution {
    const gaps = input.outcomes.outcomes.filter(o => !o.achieved);
    return { id: input.createId("imp-learning"), destinations: ["knowledge", "organizational-improvement", "executive-decision", "innovation"], lessons: input.outcomes.outcomes.slice(0, 5).map(o => o.narrative), improvementActions: input.recommendations.map(r => r.action), decisionSignals: gaps.slice(0, 4).map(o => `${o.area}:${Math.round(o.current)}`), innovationSignals: gaps.slice(0, 4).map(o => `Experiment on ${o.title}`), contributedAt: input.now.toISOString(), narrative: "Impact evidence feeds Knowledge, Organizational Improvement, Executive Decision, and Innovation." };
  }
}
