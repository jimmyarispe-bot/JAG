/**
 * Predictive Intelligence — ForecastScoring (Sprint 028).
 */

import type { ForecastScoring as ForecastScoringContract } from "@/lib/platform/intelligence/predictive-intelligence/contracts";
import type {
  ForecastPriorityBand,
  PredictionConfidenceLevel,
  TrendAnalysisResult,
} from "@/lib/platform/intelligence/predictive-intelligence/types";
import {
  clamp01NaNSafe,
  levelFromValue01,
  priorityBandFromScore01,
} from "@/lib/platform/intelligence/common";


export const clamp01 = clamp01NaNSafe;

export function levelFromValue(value: number): PredictionConfidenceLevel {
  return levelFromValue01(value);
}

export function priorityBandFromScore(score: number): ForecastPriorityBand {
  return priorityBandFromScore01(score);
}

/**
 * ForecastScoring — domain and scenario forecast quality scores.
 */
export class ForecastScoringEngine implements ForecastScoringContract {
  clamp01(value: number): number {
    return clamp01(value);
  }

  scoreDomainForecast(input: {
    trend: TrendAnalysisResult;
    confidence: number;
    riskScore: number;
  }): number {
    const trendQuality =
      input.trend.direction === "volatile"
        ? 0.35
        : input.trend.direction === "stable"
          ? 0.7
          : 0.55;
    const momentum = clamp01(0.5 + input.trend.momentum * 0.5);
    const confidence = clamp01(input.confidence);
    const riskPenalty = clamp01(input.riskScore);
    return clamp01(
      trendQuality * 0.3 +
        momentum * 0.25 +
        confidence * 0.3 +
        (1 - riskPenalty) * 0.15
    );
  }

  scoreScenario(input: {
    domainScores: number[];
    confidence: number;
    riskCount: number;
  }): number {
    const avgDomain =
      input.domainScores.length === 0
        ? 0.4
        : input.domainScores.reduce((s, v) => s + v, 0) /
          input.domainScores.length;
    const confidence = clamp01(input.confidence);
    const riskPenalty = clamp01(input.riskCount / 8);
    return clamp01(avgDomain * 0.55 + confidence * 0.3 + (1 - riskPenalty) * 0.15);
  }
}

/** Alias matching Sprint 028 naming. */
export { ForecastScoringEngine as ForecastScoring };
