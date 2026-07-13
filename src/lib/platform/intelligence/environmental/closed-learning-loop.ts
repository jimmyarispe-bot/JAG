import type {
  ClosedLearningLoopContribution,
  EnvironmentalRecommendationRecord,
  EnvironmentalScenarioSuite,
  EnvironmentalTrendSuite,
} from "@/lib/platform/intelligence/environmental/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: EnvironmentalTrendSuite;
    scenarios: EnvironmentalScenarioSuite;
    recommendations: EnvironmentalRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("env-learning"),
      destinations: ["political", "economic", "operations", "opportunity", "legal-compliance-risk", "executive-decision", "predictive"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => `${t.area}:${t.direction}`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => `${s.kind}:${Math.round(s.probability * 100)}`),
      contributedAt: input.now.toISOString(),
      narrative: "Environmental evidence feeds Political, Economic, Operations, Opportunity, Legal-Compliance-Risk, Executive Decision, and Predictive Intelligence.",
    };
  }
}
