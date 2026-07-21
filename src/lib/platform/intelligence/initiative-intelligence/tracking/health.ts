/**
 * Initiative health status from progress signals.
 */

import type {
  InitiativeHealthStatus,
  InitiativeProgress,
} from "@/lib/platform/intelligence/initiative-intelligence/types";

export function healthStatusFromScore(score: number): InitiativeHealthStatus {
  if (score >= 75) return "healthy";
  if (score >= 55) return "watch";
  if (score >= 35) return "at_risk";
  return "critical";
}

export function composeHealthScore(input: {
  percentComplete: number;
  kpiAchievement: number;
  milestoneCompletion: number;
  budgetVariancePct: number;
  scheduleVarianceDays: number;
  riskScore: number;
  blockerCount: number;
}): number {
  const budgetPenalty = Math.min(40, Math.abs(Math.max(0, input.budgetVariancePct)));
  const schedulePenalty = Math.min(30, Math.max(0, -input.scheduleVarianceDays));
  const riskPenalty = Math.min(35, input.riskScore * 0.35);
  const blockerPenalty = Math.min(25, input.blockerCount * 8);

  const base =
    input.percentComplete * 0.25 +
    input.kpiAchievement * 0.3 +
    input.milestoneCompletion * 0.25 +
    20;

  const score = Math.round(
    Math.max(0, Math.min(100, base - budgetPenalty - schedulePenalty - riskPenalty - blockerPenalty))
  );
  return score;
}

export function emptyProgress(): InitiativeProgress {
  return {
    percentComplete: 0,
    scheduleVarianceDays: 0,
    budgetVariance: 0,
    budgetVariancePct: 0,
    kpiAchievement: 0,
    milestoneCompletion: 0,
    healthScore: 50,
    healthStatus: "watch",
  };
}
