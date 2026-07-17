/**
 * Shared confidence aggregation helpers (Stabilization A2).
 */

import { clamp01, clamp01NaNSafe } from "@/lib/platform/intelligence/common/numeric";
import {
  levelFromValue,
  levelFromValue01,
  levelFromValueFunding,
  type StandardConfidenceLevel,
} from "@/lib/platform/intelligence/common/bands";

export interface ConfidenceFactor {
  key: string;
  label: string;
  contribution: number;
}

export interface ConfidenceScoreShape {
  value: number;
  level: StandardConfidenceLevel;
  factors: ConfidenceFactor[];
}

export type ConfidenceLevelMapper = (value: number) => StandardConfidenceLevel;

/**
 * Average contribution confidence (late-domain pattern).
 * Uses Math.max(1, length) divisor — empty factors → 0.
 */
export function buildConfidenceAverage(
  factors: ConfidenceFactor[],
  levelMapper: ConfidenceLevelMapper = levelFromValue
): ConfidenceScoreShape {
  const value = Math.min(
    1,
    Math.max(
      0,
      factors.reduce((sum, f) => sum + f.contribution, 0) / Math.max(1, factors.length)
    )
  );
  return { value, level: levelMapper(value), factors };
}

/**
 * Average contribution with empty → 0.5 fallback (customer / market pattern).
 */
export function buildConfidenceAverageEmptyHalf(
  factors: ConfidenceFactor[],
  levelMapper: ConfidenceLevelMapper = levelFromValue
): ConfidenceScoreShape {
  const value =
    factors.length === 0
      ? 0.5
      : clamp01(
          factors.reduce((sum, f) => sum + f.contribution, 0) / factors.length
        );
  return { value, level: levelMapper(value), factors };
}

/**
 * Average via clamp01 + max(1,length) (funding pattern) with funding level bands.
 */
export function buildConfidenceAverageFunding(
  factors: ConfidenceFactor[]
): ConfidenceScoreShape {
  const value = clamp01(
    factors.reduce((sum, f) => sum + f.contribution, 0) / Math.max(1, factors.length)
  );
  return { value, level: levelFromValueFunding(value), factors };
}

/**
 * Sum (not average) of contributions, NaN-safe clamp01 (executive-graph engine).
 */
export function buildConfidenceSum(
  factors: ConfidenceFactor[],
  levelMapper: ConfidenceLevelMapper = levelFromValue01
): ConfidenceScoreShape {
  const raw = factors.reduce((sum, f) => sum + f.contribution, 0);
  const value = clamp01NaNSafe(raw);
  return { value, level: levelMapper(value), factors };
}

/** Simple narrative helper used by several product domains. */
export function scoreNarrative(
  label: string,
  value: number,
  status: string
): string {
  return `${label} is ${status} at ${Math.round(value)}.`;
}
