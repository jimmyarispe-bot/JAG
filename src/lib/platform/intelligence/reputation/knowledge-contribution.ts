import type { ReputationForecastSuite, ReputationKnowledgeContribution, ReputationScenarioSuite } from "@/lib/platform/intelligence/reputation/types";

export class ReputationKnowledgeContributionEngine {
  contribute(input: {
    forecasts: ReputationForecastSuite;
    scenarios: ReputationScenarioSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): ReputationKnowledgeContribution {
    const artifacts = [
      ...input.forecasts.forecasts.slice(0, 4).map(forecast => ({
        id: input.createId("rep-knowledge"),
        type: "reputation_forecast",
        title: forecast.narrative,
        confidence: forecast.forecast / 100,
        sourceRef: forecast.id,
        validated: forecast.confidence === "high" || forecast.confidence === "medium",
        metadata: { area: forecast.area, capturedAt: input.now.toISOString() },
      })),
      ...input.scenarios.scenarios.slice(0, 4).map(scenario => ({
        id: input.createId("rep-knowledge"),
        type: "reputation_scenario",
        title: scenario.title,
        confidence: scenario.probability,
        sourceRef: scenario.id,
        validated: scenario.probability >= .35,
        metadata: { kind: scenario.kind, capturedAt: input.now.toISOString() },
      })),
    ];
    return {
      artifacts,
      contributionScore: artifacts.reduce((s, a) => s + a.confidence, 0) / Math.max(1, artifacts.length) * 100,
      validatedCount: artifacts.filter(a => a.validated).length,
      narrative: `${artifacts.length} reputation learning drafts prepared for Knowledge and decision domains.`,
    };
  }
}
