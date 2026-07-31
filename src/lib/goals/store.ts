import type { GoalTimelineEntry, JagGoal } from "@/lib/goals/types";

type GoalStore = {
  goals: Map<string, JagGoal>;
  timeline: GoalTimelineEntry[];
};

const g = globalThis as typeof globalThis & {
  __jagGoalsStore?: GoalStore;
};

function store(): GoalStore {
  if (!g.__jagGoalsStore) {
    g.__jagGoalsStore = { goals: new Map(), timeline: [] };
  }
  return g.__jagGoalsStore;
}

export function resetGoalsStoreForTests(): void {
  g.__jagGoalsStore = { goals: new Map(), timeline: [] };
}

export function upsertGoal(goal: JagGoal): JagGoal {
  store().goals.set(`${goal.organizationId}::${goal.id}`, goal);
  return goal;
}

export function getGoal(
  organizationId: string,
  goalId: string
): JagGoal | null {
  return store().goals.get(`${organizationId}::${goalId}`) ?? null;
}

export function listGoalsForOrganization(
  organizationId: string
): readonly JagGoal[] {
  return Object.freeze(
    [...store().goals.values()]
      .filter((g) => g.organizationId === organizationId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}

export function deleteGoal(organizationId: string, goalId: string): boolean {
  return store().goals.delete(`${organizationId}::${goalId}`);
}

export function appendGoalTimeline(
  entry: GoalTimelineEntry
): GoalTimelineEntry {
  store().timeline.push(entry);
  if (store().timeline.length > 8000) {
    store().timeline = store().timeline.slice(-6000);
  }
  return entry;
}

export function listGoalTimeline(
  organizationId: string,
  goalId?: string
): readonly GoalTimelineEntry[] {
  return Object.freeze(
    store()
      .timeline.filter(
        (e) =>
          e.organizationId === organizationId &&
          (goalId == null || e.goalId === goalId)
      )
      .sort((a, b) => b.at.localeCompare(a.at))
  );
}
