/**
 * Predictive Intelligence — TrendAnalyzer (Sprint 028).
 */

import type { TrendAnalyzer as TrendAnalyzerContract } from "@/lib/platform/intelligence/predictive-intelligence/contracts";
import { clamp01 } from "@/lib/platform/intelligence/predictive-intelligence/scoring";
import type {
  ForecastDomain,
  TrendAnalysisResult,
  TrendDirection,
} from "@/lib/platform/intelligence/predictive-intelligence/types";

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance =
    values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * TrendAnalyzer — detects accelerating / declining / stable / volatile trends.
 */
export class TrendAnalyzerEngine implements TrendAnalyzerContract {
  analyze(input: {
    domain: ForecastDomain;
    series: number[];
    baselineValue: number;
  }): TrendAnalysisResult {
    const series =
      input.series.length >= 2
        ? input.series
        : [
            input.baselineValue * 0.96,
            input.baselineValue * 0.98,
            input.baselineValue,
          ];

    const deltas: number[] = [];
    for (let i = 1; i < series.length; i += 1) {
      const prev = series[i - 1]!;
      const curr = series[i]!;
      deltas.push(prev === 0 ? 0 : (curr - prev) / Math.abs(prev));
    }

    const slope = mean(deltas);
    const accelDeltas: number[] = [];
    for (let i = 1; i < deltas.length; i += 1) {
      accelDeltas.push(deltas[i]! - deltas[i - 1]!);
    }
    const acceleration = mean(accelDeltas);
    const volatility = stddev(deltas);
    const momentum = clamp01(0.5 + slope * 5);

    let direction: TrendDirection;
    if (volatility > 0.08) {
      direction = "volatile";
    } else if (Math.abs(slope) < 0.008 && Math.abs(acceleration) < 0.005) {
      direction = "stable";
    } else if (slope > 0 && acceleration >= -0.002) {
      direction = "accelerating";
    } else if (slope < 0) {
      direction = "declining";
    } else {
      direction = acceleration > 0 ? "accelerating" : "stable";
    }

    // Risk domain inverts narrative polarity (higher risk = worse)
    const isRisk = input.domain === "risk";
    const narrative = buildNarrative(input.domain, direction, slope, isRisk);
    const confidence = clamp01(
      0.35 +
        Math.min(series.length / 8, 0.35) +
        (volatility < 0.05 ? 0.2 : volatility < 0.1 ? 0.1 : 0)
    );

    return {
      domain: input.domain,
      direction,
      slope,
      acceleration,
      volatility,
      momentum,
      narrative,
      confidence,
    };
  }
}

function buildNarrative(
  domain: ForecastDomain,
  direction: TrendDirection,
  slope: number,
  isRisk: boolean
): string {
  const pct = `${(Math.abs(slope) * 100).toFixed(1)}%`;
  switch (direction) {
    case "accelerating":
      return isRisk
        ? `${domain} risk is accelerating (~${pct} per period).`
        : `${domain} is accelerating upward (~${pct} per period).`;
    case "declining":
      return isRisk
        ? `${domain} risk is declining (~${pct} per period).`
        : `${domain} is declining (~${pct} per period).`;
    case "volatile":
      return `${domain} shows elevated volatility; near-term forecasts carry wider intervals.`;
    case "stable":
    default:
      return `${domain} trend is relatively stable around the current baseline.`;
  }
}

/** Alias matching Sprint 028 naming. */
export { TrendAnalyzerEngine as TrendAnalyzer };
