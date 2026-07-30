/**
 * GoalHealthEngine — evaluate goal health from progress, status, target — Sprint 205.
 */

import type {
  GoalHealthLevel,
  StrategicGoal,
  StrategicInitiative,
} from "./types";

export type GoalHealthEvaluation = {
  readonly goalId: string;
  readonly health: GoalHealthLevel;
  readonly progress: number;
  readonly confidence: number;
  readonly blocked: boolean;
  readonly behindSchedule: boolean;
  readonly summary: string;
};

function daysUntil(isoDate: string, now = Date.now()): number {
  const t = Date.parse(isoDate);
  if (Number.isNaN(t)) return 90;
  return Math.round((t - now) / (24 * 60 * 60 * 1000));
}

export function evaluateGoalHealth(
  goal: StrategicGoal,
  initiatives: readonly StrategicInitiative[] = []
): GoalHealthEvaluation {
  const remaining = daysUntil(goal.targetDate);
  const expected =
    remaining <= 0 ? 1 : Math.min(1, Math.max(0.05, 1 - remaining / 365));
  const behindSchedule =
    goal.progress + 0.08 < expected && goal.status !== "completed";
  const initiativeBlocked = initiatives.some(
    (i) => i.goalId === goal.id && (i.status === "blocked" || i.status === "behind")
  );
  const blocked =
    goal.status === "blocked" ||
    (initiativeBlocked && goal.progress < 0.9);

  let health: GoalHealthLevel = goal.health;
  if (goal.status === "completed" || goal.progress >= 0.98) {
    health = "achieved";
  } else if (blocked) {
    health = "blocked";
  } else if (goal.status === "at_risk" || (behindSchedule && goal.progress < 0.5)) {
    health = "at_risk";
  } else if (behindSchedule || goal.status === "deferred") {
    health = "watch";
  } else if (goal.progress >= expected - 0.05) {
    health = "on_track";
  } else {
    health = "watch";
  }

  const confidence = Number(
    Math.min(
      0.95,
      0.4 + goal.confidence * 0.35 + goal.evidence.length * 0.04 + goal.progress * 0.15
    ).toFixed(3)
  );

  const summary = blocked
    ? `Goal blocked — progress ${(goal.progress * 100).toFixed(0)}%.`
    : behindSchedule
      ? `Behind expected pace — ${(goal.progress * 100).toFixed(0)}% vs ~${(expected * 100).toFixed(0)}% expected.`
      : `On strategic pace — ${(goal.progress * 100).toFixed(0)}% complete.`;

  return {
    goalId: goal.id,
    health,
    progress: goal.progress,
    confidence,
    blocked,
    behindSchedule,
    summary,
  };
}

export function evaluateAllGoalHealth(
  goals: readonly StrategicGoal[],
  initiatives: readonly StrategicInitiative[]
): readonly GoalHealthEvaluation[] {
  return goals.map((g) =>
    evaluateGoalHealth(
      g,
      initiatives.filter((i) => i.goalId === g.id)
    )
  );
}
