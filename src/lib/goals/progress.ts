/**
 * GoalProgress — deterministic progress from tasks, decisions, KPIs, manual %.
 * No AI.
 */

import { createGoalHierarchy } from "@/lib/goals/hierarchy";
import { listGoalsForOrganization } from "@/lib/goals/store";
import type { JagGoal } from "@/lib/goals/types";

export type GoalProgressService = {
  calculate(goal: JagGoal): number;
  recalculateWithChildren(organizationId: string, goalId: string): number;
};

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function createGoalProgress(): GoalProgressService {
  const hierarchy = createGoalHierarchy();

  return {
    calculate(goal) {
      if (goal.status === "Completed") return 100;
      if (goal.status === "Cancelled" || goal.status === "Archived") {
        return clamp(goal.progressPercent);
      }

      const signals: number[] = [];

      if (goal.manualProgressPercent != null) {
        signals.push(clamp(goal.manualProgressPercent));
      }

      // Completed linked decisions → contribution
      if (goal.completedDecisionIds.length > 0 || goal.links.some((l) => l.kind === "decision")) {
        const decisionLinks = goal.links.filter((l) => l.kind === "decision");
        const denom = Math.max(1, decisionLinks.length);
        const completed = goal.completedDecisionIds.length;
        signals.push(clamp((completed / denom) * 100));
      }

      // Completed tasks
      if (goal.completedTaskIds.length > 0 || goal.links.some((l) => l.kind === "project")) {
        const taskLike = Math.max(
          goal.completedTaskIds.length,
          goal.links.filter((l) => l.kind === "project").length
        );
        if (taskLike > 0) {
          const completed = goal.completedTaskIds.length;
          const denom = Math.max(completed, taskLike, 1);
          signals.push(clamp((completed / denom) * 100));
        }
      }

      // KPI updates — each update contributes up to 10% capped at 100
      if (goal.kpiUpdateCount > 0) {
        signals.push(clamp(goal.kpiUpdateCount * 10));
      }

      if (signals.length === 0) {
        return clamp(goal.progressPercent);
      }

      const avg =
        signals.reduce((a, b) => a + b, 0) / signals.length;
      return clamp(avg);
    },

    recalculateWithChildren(organizationId, goalId) {
      const children = hierarchy.children(organizationId, goalId);
      const goals = listGoalsForOrganization(organizationId);
      const self = goals.find((g) => g.id === goalId);
      if (!self) return 0;

      if (children.length === 0) {
        return this.calculate(self);
      }

      const childProgress = children.map((c) =>
        this.recalculateWithChildren(organizationId, c.id)
      );
      const childAvg =
        childProgress.reduce((a, b) => a + b, 0) / childProgress.length;
      const own = this.calculate(self);
      // Parent progress blends own signals with child roll-up
      return clamp(own * 0.35 + childAvg * 0.65);
    },
  };
}
