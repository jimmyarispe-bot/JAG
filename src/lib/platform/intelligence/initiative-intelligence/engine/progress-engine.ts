/**
 * Progress intelligence — percent complete, variances, KPI achievement, health.
 */

import { budgetVariance } from "@/lib/platform/intelligence/initiative-intelligence/planning/budget";
import { scoreKpiAchievement } from "@/lib/platform/intelligence/initiative-intelligence/planning/kpis";
import {
  composeHealthScore,
  healthStatusFromScore,
} from "@/lib/platform/intelligence/initiative-intelligence/tracking/health";
import {
  milestoneCompletionPct,
  workBreakdownPct,
} from "@/lib/platform/intelligence/initiative-intelligence/tracking/progress";
import { openRiskScore } from "@/lib/platform/intelligence/initiative-intelligence/tracking/risks";
import { scheduleVarianceDays } from "@/lib/platform/intelligence/initiative-intelligence/tracking/timeline";
import type {
  Initiative,
  InitiativeProgress,
} from "@/lib/platform/intelligence/initiative-intelligence/types";

export class ProgressEngine {
  constructor(private readonly now: () => Date = () => new Date()) {}

  calculate(initiative: Initiative): InitiativeProgress {
    const percentComplete = workBreakdownPct(initiative.milestones);
    const milestoneCompletion = milestoneCompletionPct(initiative.milestones);
    const kpiAchievement = scoreKpiAchievement(initiative.kpis);
    const bv = budgetVariance(initiative.budget);
    const scheduleVariance = scheduleVarianceDays(
      initiative.targetCompletionDate,
      this.now(),
      percentComplete
    );
    const riskScore = openRiskScore(initiative.risks);
    const healthScore = composeHealthScore({
      percentComplete,
      kpiAchievement,
      milestoneCompletion,
      budgetVariancePct: bv.pct,
      scheduleVarianceDays: scheduleVariance,
      riskScore,
      blockerCount: initiative.blockers.length,
    });

    // Lifecycle at_risk forces health ceiling.
    let score = healthScore;
    if (initiative.state === "at_risk") score = Math.min(score, 45);
    if (initiative.state === "on_hold") score = Math.min(score, 55);
    if (initiative.state === "completed") score = Math.max(score, 80);

    return {
      percentComplete,
      scheduleVarianceDays: scheduleVariance,
      budgetVariance: bv.absolute,
      budgetVariancePct: bv.pct,
      kpiAchievement,
      milestoneCompletion,
      healthScore: score,
      healthStatus: healthStatusFromScore(score),
    };
  }
}
