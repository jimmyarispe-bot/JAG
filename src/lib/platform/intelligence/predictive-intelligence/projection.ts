/**
 * Predictive Intelligence — ForecastProjection (Sprint 028).
 */

import type { ForecastProjection as ForecastProjectionContract } from "@/lib/platform/intelligence/predictive-intelligence/contracts";
import type {
  ForecastProjectionResult,
  PredictionConfidenceScore,
  PredictionRequest,
  ScenarioForecast,
} from "@/lib/platform/intelligence/predictive-intelligence/types";

export interface ForecastProjectionDependencies {
  now?: () => Date;
}

/**
 * ForecastProjection — flattens prediction results for executive briefings / UI.
 */
export class ForecastProjectionEngine implements ForecastProjectionContract {
  private readonly now: () => Date;

  constructor(dependencies: ForecastProjectionDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
  }

  project(input: {
    request: PredictionRequest;
    scenarioForecasts: ScenarioForecast[];
    confidence: PredictionConfidenceScore;
  }): ForecastProjectionResult {
    const { request, scenarioForecasts, confidence } = input;
    const horizons = request.horizons ?? [30, 90, 180, 365];
    const baselineScenario =
      scenarioForecasts.find((s) => s.scenario.kind === "baseline") ??
      scenarioForecasts[0] ??
      null;

    const domainHighlights =
      baselineScenario?.domains.flatMap((domain) =>
        domain.points.slice(0, 2).map((point) => ({
          domain: domain.domain,
          horizonDays: point.horizonDays,
          value: point.value,
          direction: domain.trend.direction,
          narrative: domain.trend.narrative,
        }))
      ) ?? [];

    const emergingRisks = scenarioForecasts
      .flatMap((s) => s.emergingRisks)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const preventiveActions = scenarioForecasts
      .flatMap((s) => s.preventiveActions)
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3, monitor: 4 };
        return order[a.priority] - order[b.priority];
      })
      .slice(0, 8);

    const thresholdCrossings = scenarioForecasts
      .flatMap((s) => s.domains.flatMap((d) => d.thresholdCrossings))
      .sort((a, b) => a.horizonDays - b.horizonDays)
      .slice(0, 10);

    const topRisk = emergingRisks[0];
    const topAction = preventiveActions[0];
    const headline = topAction
      ? `Forecast: ${topAction.action}`
      : topRisk
        ? `Forecast alert: ${topRisk.title}`
        : `Predictive outlook ready${request.question ? ` for: ${request.question}` : "."}`;

    return {
      generatedAt: this.now().toISOString(),
      headline,
      horizons: [...horizons],
      scenarios: scenarioForecasts.map((s) => ({
        scenarioId: s.scenario.id,
        title: s.scenario.title,
        kind: s.scenario.kind,
        score: s.score,
        confidence: s.confidence.level,
        summary: s.summary,
      })),
      domainHighlights: domainHighlights.slice(0, 16),
      emergingRisks,
      preventiveActions,
      thresholdCrossings,
      overallConfidence: confidence,
      metrics: {
        scenarioCount: scenarioForecasts.length,
        domainCount: baselineScenario?.domains.length ?? 0,
        riskCount: emergingRisks.length,
        actionCount: preventiveActions.length,
        crossingCount: thresholdCrossings.length,
      },
    };
  }
}

/** Alias matching Sprint 028 naming. */
export { ForecastProjectionEngine as ForecastProjection };
