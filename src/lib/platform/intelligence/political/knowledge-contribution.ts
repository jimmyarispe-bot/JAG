import type { PoliticalForecastSuite, PoliticalKnowledgeContribution, PoliticalScenarioSuite } from "@/lib/platform/intelligence/political/types";

export class PoliticalKnowledgeContributionEngine {
  contribute(input: {
    forecasts: PoliticalForecastSuite;
    scenarios: PoliticalScenarioSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): PoliticalKnowledgeContribution {
    const artifacts = [
      ...input.forecasts.forecasts.slice(0, 4).map(forecast => ({
        id: input.createId("pol-knowledge"),
        type: "political_forecast",
        title: forecast.narrative,
        confidence: forecast.forecast / 100,
        sourceRef: forecast.id,
        validated: forecast.confidence === "high" || forecast.confidence === "medium",
        metadata: { area: forecast.area, capturedAt: input.now.toISOString() },
      })),
      ...input.scenarios.scenarios.slice(0, 4).map(scenario => ({
        id: input.createId("pol-knowledge"),
        type: "political_scenario",
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
      narrative: `${artifacts.length} political learning drafts prepared for Knowledge and decision domains.`,
    };
  }
}
