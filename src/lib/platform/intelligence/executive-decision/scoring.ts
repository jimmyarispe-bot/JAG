/**
 * Executive Decision Intelligence — DecisionScoring (Sprint 026).
 */

import type { DecisionScoring as DecisionScoringContract } from "@/lib/platform/intelligence/executive-decision/contracts";
import type {
  DecisionConfidenceLevel,
  DecisionPriorityBand,
} from "@/lib/platform/intelligence/executive-decision/types";

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function levelFromValue(value: number): DecisionConfidenceLevel {
  if (value >= 0.75) return "high";
  if (value >= 0.45) return "medium";
  if (value > 0) return "low";
  return "unknown";
}

export function priorityBandFromScore(score: number): DecisionPriorityBand {
  if (score >= 0.85) return "critical";
  if (score >= 0.7) return "high";
  if (score >= 0.5) return "medium";
  if (score >= 0.3) return "low";
  return "monitor";
}

/**
 * DecisionScoring — ROI and composite decision scores.
 */
export class DecisionScoringEngine implements DecisionScoringContract {
  clamp01(value: number): number {
    return clamp01(value);
  }

  /**
   * Annualized-ish ROI score normalized toward 0..1+.
   * Raw ROI can exceed 1; composite scoring will clamp.
   */
  scoreRoi(investment: number, expectedReturn: number, months: number): number {
    if (investment <= 0) {
      return expectedReturn > 0 ? 1 : 0;
    }
    const horizonYears = Math.max(months, 1) / 12;
    const net = expectedReturn - investment;
    const annualized = net / investment / horizonYears;
    return annualized;
  }

  scoreComposite(input: {
    roi: number;
    mission: number;
    risk: number;
    confidence: number;
  }): number {
    const roiNorm = clamp01((input.roi + 1) / 3);
    const mission = clamp01(input.mission);
    const riskPenalty = clamp01(input.risk);
    const confidence = clamp01(input.confidence);
    return clamp01(
      roiNorm * 0.4 + mission * 0.25 + (1 - riskPenalty) * 0.2 + confidence * 0.15
    );
  }
}

/** Alias matching Sprint 026 naming. */
export { DecisionScoringEngine as DecisionScoring };
