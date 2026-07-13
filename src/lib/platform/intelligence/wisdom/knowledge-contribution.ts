import type { WisdomForecastSuite, WisdomKnowledgeContribution, WisdomScenarioSuite } from "@/lib/platform/intelligence/wisdom/types";

/**
 * Wisdom intelligence knowledge contribution drafts for redistribution
 * via closed learning to collective and peer domains.
 */
export class WisdomKnowledgeContributionEngine {
  contribute(input: {
    forecasts: WisdomForecastSuite;
    scenarios: WisdomScenarioSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): WisdomKnowledgeContribution {
    const artifacts = [
      ...input.forecasts.forecasts.slice(0, 4).map(forecast => ({
        id: input.createId("wis-knowledge"),
        type: "wisdom_forecast",
        title: forecast.narrative,
        confidence: forecast.forecast / 100,
        sourceRef: forecast.id,
        validated: forecast.confidence === "high" || forecast.confidence === "medium",
        metadata: { area: forecast.area, capturedAt: input.now.toISOString() },
      })),
      ...input.scenarios.scenarios.slice(0, 4).map(scenario => ({
        id: input.createId("wis-knowledge"),
        type: "wisdom_scenario",
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
      narrative: `${artifacts.length} wisdom intelligence learning drafts prepared for redistribution across collective and peer domains.`,
    };
  }
}
