import type { EnvironmentalForecastSuite, EnvironmentalKnowledgeContribution, EnvironmentalScenarioSuite } from "@/lib/platform/intelligence/environmental/types";

export class EnvironmentalKnowledgeContributionEngine {
  contribute(input: {
    forecasts: EnvironmentalForecastSuite;
    scenarios: EnvironmentalScenarioSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): EnvironmentalKnowledgeContribution {
    const artifacts = [
      ...input.forecasts.forecasts.slice(0, 4).map(forecast => ({
        id: input.createId("env-knowledge"),
        type: "environmental_forecast",
        title: forecast.narrative,
        confidence: forecast.forecast / 100,
        sourceRef: forecast.id,
        validated: forecast.confidence === "high" || forecast.confidence === "medium",
        metadata: { area: forecast.area, capturedAt: input.now.toISOString() },
      })),
      ...input.scenarios.scenarios.slice(0, 4).map(scenario => ({
        id: input.createId("env-knowledge"),
        type: "environmental_scenario",
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
      narrative: `${artifacts.length} environmental learning drafts prepared for Knowledge and decision domains.`,
    };
  }
}
