/**
 * Executive Decision Intelligence — DecisionScoring (Sprint 026).
 */

import type { DecisionScoring as DecisionScoringContract } from "@/lib/platform/intelligence/executive-decision/contracts";
import type {
  DecisionConfidenceLevel,
  DecisionPriorityBand,
} from "@/lib/platform/intelligence/executive-decision/types";
import {
  clamp01NaNSafe,
  levelFromValue01,
  priorityBandFromScore01,
} from "@/lib/platform/intelligence/common";


export const clamp01 = clamp01NaNSafe;

export function levelFromValue(value: number): DecisionConfidenceLevel {
  return levelFromValue01(value);
}

export function priorityBandFromScore(score: number): DecisionPriorityBand {
  return priorityBandFromScore01(score);
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
