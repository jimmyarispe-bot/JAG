import type {
  ClosedLearningLoopContribution,
  EcosystemRecommendationRecord,
  EcosystemScenarioSuite,
  EcosystemTrendSuite,
} from "@/lib/platform/intelligence/ecosystem/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: EcosystemTrendSuite;
    scenarios: EcosystemScenarioSuite;
    recommendations: EcosystemRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("esm-learning"),
      destinations: ["stakeholder", "competitive", "market", "systems", "resilience", "opportunity", "predictive"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => `${t.area}:${t.direction}`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => `${s.kind}:${Math.round(s.probability * 100)}`),
      contributedAt: input.now.toISOString(),
      narrative: "Ecosystem evidence feeds Stakeholder, Competitive, Market, Systems, Resilience, Opportunity, and Predictive Intelligence.",
    };
  }
}
