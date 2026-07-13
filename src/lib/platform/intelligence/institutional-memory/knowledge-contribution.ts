import type { InstitutionalMemoryForecastSuite, InstitutionalMemoryKnowledgeContribution, InstitutionalMemoryScenarioSuite } from "@/lib/platform/intelligence/institutional-memory/types";

/**
 * Institutional memory knowledge contribution drafts for redistribution
 * via closed learning to knowledge and peer domains.
 */
export class InstitutionalMemoryKnowledgeContributionEngine {
  contribute(input: {
    forecasts: InstitutionalMemoryForecastSuite;
    scenarios: InstitutionalMemoryScenarioSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): InstitutionalMemoryKnowledgeContribution {
    const artifacts = [
      ...input.forecasts.forecasts.slice(0, 4).map(forecast => ({
        id: input.createId("imm-knowledge"),
        type: "institutional_memory_forecast",
        title: forecast.narrative,
        confidence: forecast.forecast / 100,
        sourceRef: forecast.id,
        validated: forecast.confidence === "high" || forecast.confidence === "medium",
        metadata: { area: forecast.area, capturedAt: input.now.toISOString() },
      })),
      ...input.scenarios.scenarios.slice(0, 4).map(scenario => ({
        id: input.createId("imm-knowledge"),
        type: "institutional_memory_scenario",
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
      narrative: `${artifacts.length} institutional memory learning drafts prepared for redistribution across knowledge and peer domains.`,
    };
  }
}
