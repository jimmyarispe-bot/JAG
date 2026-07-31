/**
 * GoalHealth — rule-based On Track / Watch / At Risk / Off Track / Completed.
 */

import type { GoalHealth, JagGoal } from "@/lib/goals/types";

export type GoalHealthService = {
  evaluate(goal: JagGoal, now?: Date): GoalHealth;
};

export function createGoalHealth(): GoalHealthService {
  return {
    evaluate(goal, now = new Date()) {
      if (goal.status === "Completed") return "Completed";
      if (goal.status === "Archived" || goal.status === "Cancelled") {
        return "Off Track";
      }
      if (goal.status === "Draft" || goal.status === "On Hold") {
        return "Watch";
      }

      const progress = goal.progressPercent;
      const targetMs = goal.targetDate ? Date.parse(goal.targetDate) : null;
      const startMs = goal.startDate ? Date.parse(goal.startDate) : null;
      const nowMs = now.getTime();

      let expectedProgress = 50;
      if (targetMs != null && startMs != null && targetMs > startMs) {
        const elapsed = Math.max(0, nowMs - startMs);
        const total = targetMs - startMs;
        expectedProgress = Math.min(100, Math.round((elapsed / total) * 100));
      } else if (targetMs != null) {
        // No start — assume 90-day window ending at target
        const windowMs = 90 * 24 * 60 * 60 * 1000;
        const start = targetMs - windowMs;
        const elapsed = Math.max(0, nowMs - start);
        expectedProgress = Math.min(100, Math.round((elapsed / windowMs) * 100));
      }

      const behind = progress < expectedProgress - 15;
      const farBehind = progress < expectedProgress - 35;
      const pastDue = targetMs != null && nowMs > targetMs && progress < 100;

      if (pastDue || farBehind || progress < 20 && expectedProgress > 50) {
        return "Off Track";
      }
      if (behind || progress < expectedProgress - 5) {
        return "At Risk";
      }
      if (progress < expectedProgress || progress < 40 && expectedProgress > 30) {
        return "Watch";
      }
      return "On Track";
    },
  };
}
