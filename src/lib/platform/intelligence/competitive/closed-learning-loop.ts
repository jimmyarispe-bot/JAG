import type {
  ClosedLearningLoopContribution,
  CompetitiveRecommendationRecord,
  CompetitiveScenarioSuite,
  CompetitiveTrendSuite,
} from "@/lib/platform/intelligence/competitive/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: CompetitiveTrendSuite;
    scenarios: CompetitiveScenarioSuite;
    recommendations: CompetitiveRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const declining = input.trends.trends.filter(t => t.direction === "declining");
    return {
      id: input.createId("cmp-learning"),
      destinations: ["market", "revenue", "customer", "human-capital", "opportunity", "executive-decision", "innovation"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: declining.slice(0, 4).map(t => `${t.area}:${t.direction}`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => `${s.kind}:${Math.round(s.probability * 100)}`),
      contributedAt: input.now.toISOString(),
      narrative: "Competitive evidence feeds Market, Revenue, Customer, Human Capital, Opportunity, Executive Decision, and Innovation Intelligence.",
    };
  }
}
