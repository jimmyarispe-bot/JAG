import type {
  ClosedLearningLoopContribution,
  WisdomRecommendationRecord,
  WisdomScenarioSuite,
  WisdomTrendSuite,
} from "@/lib/platform/intelligence/wisdom/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: WisdomTrendSuite;
    scenarios: WisdomScenarioSuite;
    recommendations: WisdomRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("wis-learning"),
      destinations: ["collective", "institutional-memory", "knowledge", "executive-decision", "opportunity", "predictive", "ethical"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => `${t.area}:${t.direction}`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => `${s.kind}:${Math.round(s.probability * 100)}`),
      contributedAt: input.now.toISOString(),
      narrative: "Final terminal synthesis layer that unifies judgment, trade-offs, uncertainty, and long-term impact into executive wisdom.",
    };
  }
}
