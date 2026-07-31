/**
 * GoalMetrics — Strategy Summary aggregates (deterministic).
 */

import { createGoalHealth } from "@/lib/goals/health";
import { listGoalsForOrganization } from "@/lib/goals/store";
import type {
  GoalDashboard,
  GoalHealth,
  JagGoal,
  StrategySummary,
} from "@/lib/goals/types";

function avg(nums: readonly number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function groupProgress(
  goals: readonly JagGoal[],
  keyFn: (g: JagGoal) => string
): Record<string, number> {
  const buckets: Record<string, number[]> = {};
  for (const g of goals) {
    const key = keyFn(g).trim() || "Unassigned";
    (buckets[key] ??= []).push(g.progressPercent);
  }
  return Object.fromEntries(
    Object.entries(buckets).map(([k, vals]) => [k, avg(vals)])
  );
}

export type GoalMetricsService = {
  summarize(organizationId: string, now?: Date): StrategySummary;
  dashboard(organizationId: string, now?: Date): GoalDashboard;
};

function isBehindSchedule(goal: JagGoal, now: Date): boolean {
  if (goal.status === "Completed" || goal.status === "Archived") return false;
  if (!goal.targetDate) return false;
  const target = Date.parse(goal.targetDate);
  if (Number.isNaN(target)) return false;
  if (now.getTime() > target && goal.progressPercent < 100) return true;
  // Expected progress lag
  if (goal.startDate) {
    const start = Date.parse(goal.startDate);
    if (!Number.isNaN(start) && target > start) {
      const expected =
        ((now.getTime() - start) / (target - start)) * 100;
      return goal.progressPercent < expected - 15;
    }
  }
  return false;
}

export function createGoalMetrics(): GoalMetricsService {
  const health = createGoalHealth();

  return {
    summarize(organizationId, now = new Date()) {
      const goals = listGoalsForOrganization(organizationId).filter(
        (g) => g.status !== "Cancelled"
      );
      const active = goals.filter(
        (g) => g.status === "Active" || g.status === "On Hold"
      );
      const completed = goals.filter((g) => g.status === "Completed");
      const atRisk = goals.filter((g) => {
        const h = health.evaluate(g, now);
        return h === "At Risk" || h === "Off Track";
      });
      const behind = goals.filter((g) => isBehindSchedule(g, now));

      const byGoalType: Record<string, number> = {};
      for (const g of active) {
        byGoalType[g.goalType] = (byGoalType[g.goalType] ?? 0) + 1;
      }

      const byHealth: Record<GoalHealth, number> = {
        "On Track": 0,
        Watch: 0,
        "At Risk": 0,
        "Off Track": 0,
        Completed: 0,
      };
      for (const g of goals) {
        byHealth[health.evaluate(g, now)] += 1;
      }

      return {
        activeGoals: active.length,
        completedGoals: completed.length,
        goalsAtRisk: atRisk.length,
        goalsBehindSchedule: behind.length,
        averageProgress: avg(active.map((g) => g.progressPercent)),
        byGoalType: Object.freeze(byGoalType),
        byHealth: Object.freeze(byHealth),
        progressByBusinessUnit: Object.freeze(
          groupProgress(active, (g) => g.businessUnit ?? "Unassigned")
        ),
        progressByDepartment: Object.freeze(
          groupProgress(active, (g) => g.department ?? "Unassigned")
        ),
      };
    },

    dashboard(organizationId, now = new Date()) {
      const goals = listGoalsForOrganization(organizationId);
      const summary = this.summarize(organizationId, now);
      return {
        strategicGoals: Object.freeze(
          goals.filter(
            (g) =>
              g.goalType === "Strategic Goal" ||
              g.hierarchyLevel === "Strategic Goal" ||
              g.hierarchyLevel === "Vision"
          )
        ),
        objectives: Object.freeze(
          goals.filter(
            (g) =>
              g.goalType === "Objective" || g.hierarchyLevel === "Objective"
          )
        ),
        keyResults: Object.freeze(
          goals.filter(
            (g) =>
              g.goalType === "Key Result" || g.hierarchyLevel === "Key Result"
          )
        ),
        atRisk: Object.freeze(
          goals.filter((g) => {
            const h = health.evaluate(g, now);
            return h === "At Risk" || h === "Off Track";
          })
        ),
        behindSchedule: Object.freeze(
          goals.filter((g) => isBehindSchedule(g, now))
        ),
        completed: Object.freeze(
          goals.filter((g) => g.status === "Completed")
        ),
        summary,
      };
    },
  };
}

export function getStrategySummary(
  organizationId: string,
  now?: Date
): StrategySummary {
  return createGoalMetrics().summarize(organizationId, now);
}
