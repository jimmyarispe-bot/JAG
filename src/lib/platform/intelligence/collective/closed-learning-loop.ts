import type {
  ClosedLearningLoopContribution,
  CollectiveRecommendationRecord,
  CollectiveScenarioSuite,
  CollectiveTrendSuite,
} from "@/lib/platform/intelligence/collective/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: CollectiveTrendSuite;
    scenarios: CollectiveScenarioSuite;
    recommendations: CollectiveRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("col-learning"),
      destinations: ["institutional-memory", "knowledge", "executive-decision", "opportunity", "predictive", "stakeholder", "organizational-improvement"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => `${t.area}:${t.direction}`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => `${s.kind}:${Math.round(s.probability * 100)}`),
      contributedAt: input.now.toISOString(),
      narrative: "Collaborative synthesis layer that aggregates multi-domain recommendations and redistributes synthesized learning.",
    };
  }
}
