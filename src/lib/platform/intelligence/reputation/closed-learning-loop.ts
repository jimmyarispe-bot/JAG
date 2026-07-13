import type {
  ClosedLearningLoopContribution,
  ReputationRecommendationRecord,
  ReputationScenarioSuite,
  ReputationTrendSuite,
} from "@/lib/platform/intelligence/reputation/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: ReputationTrendSuite;
    scenarios: ReputationScenarioSuite;
    recommendations: ReputationRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("rep-learning"),
      destinations: ["stakeholder", "customer", "competitive", "political", "opportunity", "executive-decision", "predictive"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => `${t.area}:${t.direction}`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => `${s.kind}:${Math.round(s.probability * 100)}`),
      contributedAt: input.now.toISOString(),
      narrative: "Reputation evidence feeds Stakeholder, Customer, Competitive, Political, Opportunity, Executive Decision, and Predictive Intelligence.",
    };
  }
}
