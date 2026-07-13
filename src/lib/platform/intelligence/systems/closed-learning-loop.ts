import type {
  ClosedLearningLoopContribution,
  SystemsRecommendationRecord,
  SystemsScenarioSuite,
  SystemsTrendSuite,
} from "@/lib/platform/intelligence/systems/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: SystemsTrendSuite;
    scenarios: SystemsScenarioSuite;
    recommendations: SystemsRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("sys-learning"),
      destinations: ["operations", "legal-compliance-risk", "predictive", "executive-decision", "economic", "behavioral", "opportunity"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => `${t.area}:${t.direction}`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => `${s.kind}:${Math.round(s.probability * 100)}`),
      contributedAt: input.now.toISOString(),
      narrative: "Systems evidence feeds Operations, Legal Compliance Risk, Predictive, Executive Decision, Economic, Behavioral, and Opportunity Intelligence.",
    };
  }
}
