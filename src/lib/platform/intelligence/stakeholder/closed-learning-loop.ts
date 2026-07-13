import type {
  ClosedLearningLoopContribution,
  StakeholderRecommendationRecord,
  StakeholderScenarioSuite,
  StakeholderTrendSuite,
} from "@/lib/platform/intelligence/stakeholder/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: StakeholderTrendSuite;
    scenarios: StakeholderScenarioSuite;
    recommendations: StakeholderRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("stk-learning"),
      destinations: ["customer", "human-capital", "political", "competitive", "opportunity", "executive-decision", "predictive"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => `${t.area}:${t.direction}`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => `${s.kind}:${Math.round(s.probability * 100)}`),
      contributedAt: input.now.toISOString(),
      narrative: "Stakeholder evidence feeds Customer, Human Capital, Political, Competitive, Opportunity, Executive Decision, and Predictive Intelligence.",
    };
  }
}
