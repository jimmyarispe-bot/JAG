import type { EcosystemForecastSuite, EcosystemKnowledgeContribution, EcosystemScenarioSuite } from "@/lib/platform/intelligence/ecosystem/types";

/**
 * Ecosystem knowledge contribution drafts for Knowledge Intelligence soft-read
 * and downstream learning.
 */
export class EcosystemKnowledgeContributionEngine {
  contribute(input: {
    forecasts: EcosystemForecastSuite;
    scenarios: EcosystemScenarioSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): EcosystemKnowledgeContribution {
    const artifacts = [
      ...input.forecasts.forecasts.slice(0, 4).map(forecast => ({
        id: input.createId("esm-knowledge"),
        type: "ecosystem_forecast",
        title: forecast.narrative,
        confidence: forecast.forecast / 100,
        sourceRef: forecast.id,
        validated: forecast.confidence === "high" || forecast.confidence === "medium",
        metadata: { area: forecast.area, capturedAt: input.now.toISOString() },
      })),
      ...input.scenarios.scenarios.slice(0, 4).map(scenario => ({
        id: input.createId("esm-knowledge"),
        type: "ecosystem_scenario",
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
      narrative: `${artifacts.length} ecosystem learning drafts prepared for Knowledge and decision domains.`,
    };
  }
}
