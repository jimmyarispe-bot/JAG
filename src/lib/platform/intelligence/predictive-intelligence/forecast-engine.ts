/**
 * Predictive Intelligence — ForecastEngine (Sprint 028).
 */

import type {
  ForecastEngine as ForecastEngineContract,
  PredictionConfidence as PredictionConfidenceContract,
} from "@/lib/platform/intelligence/predictive-intelligence/contracts";
import { PredictionConfidenceEngine } from "@/lib/platform/intelligence/predictive-intelligence/confidence";
import { clamp01 } from "@/lib/platform/intelligence/predictive-intelligence/scoring";
import type {
  DomainForecast,
  ForecastDomain,
  ForecastHorizonDays,
  ForecastPoint,
  ForecastScenarioDefinition,
  ThresholdCrossing,
  TrendAnalysisResult,
} from "@/lib/platform/intelligence/predictive-intelligence/types";

export interface ForecastEngineDependencies {
  confidence?: PredictionConfidenceContract;
  createId?: (prefix: string) => string;
}

/**
 * ForecastEngine — projects multi-horizon domain forecasts with intervals.
 */
export class ForecastEngineImpl implements ForecastEngineContract {
  private readonly confidence: PredictionConfidenceContract;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: ForecastEngineDependencies = {}) {
    this.confidence =
      dependencies.confidence ?? new PredictionConfidenceEngine();
    this.createId =
      dependencies.createId ??
      ((prefix) =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  }

  forecastDomain(input: {
    domain: ForecastDomain;
    baselineValue: number;
    trend: TrendAnalysisResult;
    horizons: ForecastHorizonDays[];
    scenario: ForecastScenarioDefinition;
    now: Date;
  }): DomainForecast {
    const multiplier =
      input.scenario.domainMultipliers?.[input.domain] ?? 1;
    const offset = input.scenario.domainOffsets?.[input.domain] ?? 0;
    const adjustedBaseline = Math.max(
      0,
      input.baselineValue * multiplier + offset
    );

    const points: ForecastPoint[] = input.horizons.map((horizonDays) => {
      const periods = horizonDays / 30;
      const projected =
        adjustedBaseline *
        (1 + input.trend.slope * periods + 0.5 * input.trend.acceleration * periods ** 2);
      const intervalWidth =
        Math.abs(projected) *
        (0.05 + input.trend.volatility * 2 + periods * 0.02);
      const confidence = clamp01(
        input.trend.confidence * (1 - periods * 0.06) *
          (input.scenario.kind === "stress" ? 0.85 : 1)
      );
      const asOf = new Date(input.now);
      asOf.setUTCDate(asOf.getUTCDate() + horizonDays);

      return {
        horizonDays,
        value: Math.max(0, projected),
        low: Math.max(0, projected - intervalWidth),
        high: Math.max(0, projected + intervalWidth),
        confidence,
        asOf: asOf.toISOString(),
      };
    });

    const conf = this.confidence.score([
      {
        key: "trend",
        label: "Trend confidence",
        contribution: input.trend.confidence * 0.5,
      },
      {
        key: "horizon",
        label: "Horizon confidence",
        contribution:
          (points.reduce((s, p) => s + p.confidence, 0) /
            Math.max(points.length, 1)) *
          0.35,
      },
      {
        key: "scenario",
        label: "Scenario stability",
        contribution:
          input.scenario.kind === "baseline"
            ? 0.15
            : input.scenario.kind === "stress"
              ? 0.05
              : 0.1,
      },
    ]);

    return {
      domain: input.domain,
      baselineValue: adjustedBaseline,
      points,
      trend: input.trend,
      thresholdCrossings: [],
      confidence: conf,
      summary: `${input.domain}: ${input.trend.narrative} Projected ${points[0]?.value.toFixed(1) ?? "n/a"} at ${points[0]?.horizonDays ?? 30}d.`,
    };
  }

  detectThresholds(input: {
    domain: ForecastDomain;
    points: ForecastPoint[];
    threshold: number | undefined;
    now: Date;
  }): ThresholdCrossing[] {
    if (input.threshold === undefined || Number.isNaN(input.threshold)) {
      return [];
    }

    const crossings: ThresholdCrossing[] = [];
    const threshold = input.threshold;
    const isRisk = input.domain === "risk" || input.domain === "expense" || input.domain === "payroll";

    for (const point of input.points) {
      const crossesAbove = point.value >= threshold;
      const crossesBelow = point.value <= threshold;
      const relevant = isRisk ? crossesAbove : crossesBelow;

      if (!relevant) continue;

      const severity =
        Math.abs(point.value - threshold) / Math.max(Math.abs(threshold), 1e-6) >
        0.2
          ? "critical"
          : Math.abs(point.value - threshold) /
                Math.max(Math.abs(threshold), 1e-6) >
              0.08
            ? "warning"
            : "info";

      crossings.push({
        id: this.createId("threshold"),
        domain: input.domain,
        threshold,
        predictedValue: point.value,
        horizonDays: point.horizonDays,
        estimatedCrossingAt: point.asOf,
        severity,
        direction: isRisk ? "above" : "below",
        narrative: isRisk
          ? `${input.domain} is projected to exceed ${threshold} within ${point.horizonDays} days (${point.value.toFixed(2)}).`
          : `${input.domain} is projected to fall to or below ${threshold} within ${point.horizonDays} days (${point.value.toFixed(2)}).`,
      });
    }

    // Keep earliest crossing per severity band
    return crossings
      .sort((a, b) => a.horizonDays - b.horizonDays)
      .slice(0, 3);
  }
}

/** Alias matching Sprint 028 naming. */
export { ForecastEngineImpl as ForecastEngine };
