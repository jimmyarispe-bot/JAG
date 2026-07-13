import type {
  ClosedLearningLoopContribution,
  PoliticalRecommendationRecord,
  PoliticalScenarioSuite,
  PoliticalTrendSuite,
} from "@/lib/platform/intelligence/political/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: PoliticalTrendSuite;
    scenarios: PoliticalScenarioSuite;
    recommendations: PoliticalRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("pol-learning"),
      destinations: ["market", "economic", "competitive", "opportunity", "legal-compliance-risk", "executive-decision", "predictive"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => `${t.area}:${t.direction}`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => `${s.kind}:${Math.round(s.probability * 100)}`),
      contributedAt: input.now.toISOString(),
      narrative: "Political evidence feeds Market, Economic, Competitive, Opportunity, Legal-Compliance-Risk, Executive Decision, and Predictive Intelligence.",
    };
  }
}
