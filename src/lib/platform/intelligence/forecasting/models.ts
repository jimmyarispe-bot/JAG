import type { ForecastTrend } from "@/lib/platform/intelligence/forecasting/types";

/** Round to `digits` decimal places (deterministic). */
export function roundTo(value: number, digits = 1): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

export function clampNonNegative(value: number): number {
  return value < 0 ? 0 : value;
}

/** Period-over-period growth rate; null if undefined or prior <= 0. */
export function growthRate(
  current: number | null | undefined,
  prior: number | null | undefined
): number | null {
  if (current == null || prior == null || prior <= 0) return null;
  return (current - prior) / prior;
}

export function trendFromRate(rate: number | null, epsilon = 0.01): ForecastTrend {
  if (rate == null) return "unknown";
  if (rate > epsilon) return "up";
  if (rate < -epsilon) return "down";
  return "flat";
}

/**
 * Project forward one horizon using compound growth for `periods` steps.
 * periods = horizonDays / 90 (quarterly step) by default one step.
 */
export function projectWithGrowth(
  baseline: number,
  growthRatePerStep: number,
  steps = 1
): number {
  let value = baseline;
  for (let i = 0; i < steps; i += 1) {
    value = value * (1 + growthRatePerStep);
  }
  return clampNonNegative(value);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
