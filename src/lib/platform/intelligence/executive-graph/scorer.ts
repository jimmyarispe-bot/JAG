/**
 * Executive Graph Analyzer — shared scoring utilities (Sprint 025).
 */

import type { ConfidenceScorer } from "@/lib/platform/intelligence/executive-graph/contracts";
import type {
  ConfidenceScore,
  ExecutivePriorityBand,
  GraphConfidenceLevel,
} from "@/lib/platform/intelligence/executive-graph/types";

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function levelFromValue(value: number): GraphConfidenceLevel {
  if (value >= 0.75) return "high";
  if (value >= 0.45) return "medium";
  if (value > 0) return "low";
  return "unknown";
}

export function priorityBandFromScore(score: number): ExecutivePriorityBand {
  if (score >= 0.85) return "critical";
  if (score >= 0.7) return "high";
  if (score >= 0.5) return "medium";
  if (score >= 0.3) return "low";
  return "monitor";
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
