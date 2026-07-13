import type {
  ClosedLearningLoopContribution,
  BehavioralRecommendationRecord,
  BehavioralScenarioSuite,
  BehavioralTrendSuite,
} from "@/lib/platform/intelligence/behavioral/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: BehavioralTrendSuite;
    scenarios: BehavioralScenarioSuite;
    recommendations: BehavioralRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("beh-learning"),
      destinations: ["stakeholder", "reputation", "human-capital", "customer", "opportunity", "executive-decision", "predictive"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => `${t.area}:${t.direction}`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => `${s.kind}:${Math.round(s.probability * 100)}`),
      contributedAt: input.now.toISOString(),
      narrative: "Behavioral evidence feeds Stakeholder, Reputation, Human Capital, Customer, Opportunity, Executive Decision, and Predictive Intelligence.",
    };
  }
}
