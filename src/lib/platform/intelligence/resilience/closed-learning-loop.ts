import type {
  ClosedLearningLoopContribution,
  ResilienceRecommendationRecord,
  ResilienceScenarioSuite,
  ResilienceTrendSuite,
} from "@/lib/platform/intelligence/resilience/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: ResilienceTrendSuite;
    scenarios: ResilienceScenarioSuite;
    recommendations: ResilienceRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("rsl-learning"),
      destinations: ["systems", "operations", "legal-compliance-risk", "economic", "executive-decision", "predictive", "opportunity"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => `${t.area}:${t.direction}`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => `${s.kind}:${Math.round(s.probability * 100)}`),
      contributedAt: input.now.toISOString(),
      narrative: "Resilience evidence feeds Systems, Operations, Legal Compliance Risk, Economic, Executive Decision, Predictive, and Opportunity Intelligence.",
    };
  }
}
