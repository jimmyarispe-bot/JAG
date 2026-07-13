import type {
  ClosedLearningLoopContribution,
  InstitutionalMemoryRecommendationRecord,
  InstitutionalMemoryScenarioSuite,
  InstitutionalMemoryTrendSuite,
} from "@/lib/platform/intelligence/institutional-memory/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: InstitutionalMemoryTrendSuite;
    scenarios: InstitutionalMemoryScenarioSuite;
    recommendations: InstitutionalMemoryRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("imm-learning"),
      destinations: ["knowledge", "ecosystem", "opportunity", "executive-decision", "predictive", "organizational-improvement", "stakeholder"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => `${t.area}:${t.direction}`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => `${s.kind}:${Math.round(s.probability * 100)}`),
      contributedAt: input.now.toISOString(),
      narrative: "Primary institutional memory destination that redistributes validated insights via soft contribution records to Knowledge, Ecosystem, Opportunity, Executive Decision, Predictive, Organizational Improvement, and Stakeholder Intelligence.",
    };
  }
}
