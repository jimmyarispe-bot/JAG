/**
 * Executive Graph Analyzer — shared scoring utilities (Sprint 025).
 */

import type { ConfidenceScorer } from "@/lib/platform/intelligence/executive-graph/contracts";
import type {
  ConfidenceScore,
  ExecutivePriorityBand,
  GraphConfidenceLevel,
} from "@/lib/platform/intelligence/executive-graph/types";
import {
  clamp01NaNSafe,
  levelFromValue01,
  priorityBandFromScore01,
} from "@/lib/platform/intelligence/common";


export const clamp01 = clamp01NaNSafe;

export function levelFromValue(value: number): GraphConfidenceLevel {
  return levelFromValue01(value);
}

export function priorityBandFromScore(score: number): ExecutivePriorityBand {
  return priorityBandFromScore01(score);
}

export function severityToScore(severity: string | null | undefined): number {
  switch ((severity ?? "").toLowerCase()) {
    case "critical":
      return 1;
    case "high":
      return 0.8;
    case "medium":
      return 0.55;
    case "low":
      return 0.35;
    case "info":
    case "monitor":
      return 0.2;
    default:
      return 0.4;
  }
}

export function statusToPressure(status: string | null | undefined): number {
  switch ((status ?? "").toLowerCase()) {
    case "critical":
      return 1;
    case "warning":
    case "high":
      return 0.7;
    case "healthy":
    case "medium":
      return 0.35;
    case "excellent":
    case "low":
      return 0.1;
    default:
      return 0.3;
  }
}

/**
 * ConfidenceScore — calibrated graph-local confidence.
 */
export class ConfidenceScoreEngine implements ConfidenceScorer {
  score(
    factors: Array<{ key: string; label: string; contribution: number }>
  ): ConfidenceScore {
    const raw = factors.reduce((sum, f) => sum + f.contribution, 0);
    const value = clamp01(raw);
    return {
      value,
      level: levelFromValue(value),
      factors,
    };
  }

  fromValue(value: number): ConfidenceScore {
    const v = clamp01(value);
    return {
      value: v,
      level: levelFromValue(v),
      factors: [{ key: "base", label: "Base confidence", contribution: v }],
    };
  }
}

/** Alias export matching Sprint 025 naming. */
export { ConfidenceScoreEngine as ConfidenceScore };
