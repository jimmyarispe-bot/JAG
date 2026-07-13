import type {
  ClosedLearningLoopContribution,
  EthicalRecommendationRecord,
  EthicalScenarioSuite,
  EthicalTrendSuite,
} from "@/lib/platform/intelligence/ethical/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: EthicalTrendSuite;
    scenarios: EthicalScenarioSuite;
    recommendations: EthicalRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("eth-learning"),
      destinations: ["cultural", "behavioral", "legal-compliance-risk", "opportunity", "executive-decision", "predictive", "reputation"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => `${t.area}:${t.direction}`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => `${s.kind}:${Math.round(s.probability * 100)}`),
      contributedAt: input.now.toISOString(),
      narrative: "Ethical evidence feeds Cultural, Behavioral, Legal Compliance Risk, Opportunity, Executive Decision, Predictive, and Reputation Intelligence.",
    };
  }
}
