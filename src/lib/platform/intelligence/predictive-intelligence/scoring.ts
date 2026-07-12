/**
 * Predictive Intelligence — ForecastScoring (Sprint 028).
 */

import type { ForecastScoring as ForecastScoringContract } from "@/lib/platform/intelligence/predictive-intelligence/contracts";
import type {
  ForecastPriorityBand,
  PredictionConfidenceLevel,
  TrendAnalysisResult,
} from "@/lib/platform/intelligence/predictive-intelligence/types";

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function levelFromValue(value: number): PredictionConfidenceLevel {
  if (value >= 0.75) return "high";
  if (value >= 0.45) return "medium";
  if (value > 0) return "low";
  return "unknown";
}

export function priorityBandFromScore(score: number): ForecastPriorityBand {
  if (score >= 0.85) return "critical";
  if (score >= 0.7) return "high";
  if (score >= 0.5) return "medium";
  if (score >= 0.3) return "low";
  return "monitor";
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
