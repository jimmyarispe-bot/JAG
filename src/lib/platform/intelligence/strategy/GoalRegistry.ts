/**
 * GoalRegistry — strategic goals — Sprint 205.
 */

import type { StrategicGoal } from "./types";

const goals: StrategicGoal[] = [];

export const GoalRegistry = {
  list(organizationId?: string): readonly StrategicGoal[] {
    return organizationId
      ? goals.filter((g) => g.organizationId === organizationId)
      : goals;
  },

  get(id: string): StrategicGoal | null {
    return goals.find((g) => g.id === id) ?? null;
  },

  upsert(goal: StrategicGoal): StrategicGoal {
    const idx = goals.findIndex((g) => g.id === goal.id);
    if (idx >= 0) goals[idx] = goal;
    else goals.unshift(goal);
    return goal;
  },

  upsertMany(items: readonly StrategicGoal[]): void {
    for (const g of items) this.upsert(g);
  },

  resetForTests(): void {
    goals.length = 0;
  },
} as const;
