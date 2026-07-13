import type { CollectiveForecastSuite, CollectiveKnowledgeContribution, CollectiveScenarioSuite } from "@/lib/platform/intelligence/collective/types";

/**
 * Collective intelligence knowledge contribution drafts for redistribution
 * via closed learning to institutional-memory and peer domains.
 */
export class CollectiveKnowledgeContributionEngine {
  contribute(input: {
    forecasts: CollectiveForecastSuite;
    scenarios: CollectiveScenarioSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): CollectiveKnowledgeContribution {
    const artifacts = [
      ...input.forecasts.forecasts.slice(0, 4).map(forecast => ({
        id: input.createId("col-knowledge"),
        type: "collective_forecast",
        title: forecast.narrative,
        confidence: forecast.forecast / 100,
        sourceRef: forecast.id,
        validated: forecast.confidence === "high" || forecast.confidence === "medium",
        metadata: { area: forecast.area, capturedAt: input.now.toISOString() },
      })),
      ...input.scenarios.scenarios.slice(0, 4).map(scenario => ({
        id: input.createId("col-knowledge"),
        type: "collective_scenario",
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
      narrative: `${artifacts.length} collective intelligence learning drafts prepared for redistribution across institutional-memory and peer domains.`,
    };
  }
}
