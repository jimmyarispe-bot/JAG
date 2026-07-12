import type {
  ClosedLearningLoopContribution,
  EconomicRecommendationRecord,
  EconomicScenarioSuite,
  EconomicTrendSuite,
} from "@/lib/platform/intelligence/economic/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: EconomicTrendSuite;
    scenarios: EconomicScenarioSuite;
    recommendations: EconomicRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("eco-learning"),
      destinations: ["market", "revenue", "funding", "operations", "opportunity", "executive-decision", "predictive"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => `${t.area}:${t.direction}`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => `${s.kind}:${Math.round(s.probability * 100)}`),
      contributedAt: input.now.toISOString(),
      narrative: "Economic evidence feeds Market, Revenue, Funding, Operations, Opportunity, Executive Decision, and Predictive Intelligence.",
    };
  }
}
