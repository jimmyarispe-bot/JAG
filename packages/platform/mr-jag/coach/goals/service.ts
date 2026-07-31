/**
 * Goal engine — daily / weekly / monthly / milestone goals.
 */

import { randomUUID } from "node:crypto";
import { normalizePersona } from "../../personas";
import { listEvents, listGoals, upsertGoal } from "../store";
import type { CoachEventKind, CoachGoal, CoachGoalHorizon } from "../types";

function dueFor(horizon: CoachGoalHorizon): string | null {
  const d = new Date();
  if (horizon === "daily") {
    d.setHours(23, 59, 59, 0);
    return d.toISOString();
  }
  if (horizon === "weekly") {
    d.setDate(d.getDate() + (7 - d.getDay()));
    return d.toISOString();
  }
  if (horizon === "monthly") {
    d.setMonth(d.getMonth() + 1, 0);
    return d.toISOString();
  }
  return null;
}

export function createCoachGoal(input: {
  organizationId: string;
  userId: string;
  persona?: string | null;
  horizon: CoachGoalHorizon;
  title: string;
  description?: string;
  targetCount?: number;
  relatedEventKind?: CoachEventKind | null;
}): CoachGoal {
  const persona = normalizePersona(input.persona);
  const target = Math.max(1, input.targetCount ?? 1);
  const now = new Date().toISOString();
  return upsertGoal({
    id: `goal:${randomUUID()}`,
    organizationId: input.organizationId,
    userId: input.userId,
    persona,
    horizon: input.horizon,
    title: input.title,
    description: input.description ?? input.title,
    targetCount: target,
    completedCount: 0,
    completionPercent: 0,
    relatedEventKind: input.relatedEventKind ?? null,
    dueAt: dueFor(input.horizon),
    createdAt: now,
    completedAt: null,
  });
}

export function seedDefaultGoals(input: {
  organizationId: string;
  userId: string;
  persona?: string | null;
}): readonly CoachGoal[] {
  const existing = listGoals(input);
  if (existing.length > 0) return existing;
  const persona = normalizePersona(input.persona);
  return Object.freeze([
    createCoachGoal({
      ...input,
      persona,
      horizon: "daily",
      title: "Complete one guided action",
      description: "Accept or complete one Coach recommendation today.",
      targetCount: 1,
    }),
    createCoachGoal({
      ...input,
      persona,
      horizon: "weekly",
      title: "Hit two operational milestones",
      description: "Observe two first_* milestone events this week.",
      targetCount: 2,
      relatedEventKind: "first_login",
    }),
    createCoachGoal({
      ...input,
      persona,
      horizon: "monthly",
      title: "Raise training completion",
      description: "Advance Academy path completion this month.",
      targetCount: 3,
      relatedEventKind: "first_certification",
    }),
    createCoachGoal({
      ...input,
      persona,
      horizon: "milestone",
      title: "Complete persona onboarding milestones",
      description: `Reach core ${persona} first-run milestones.`,
      targetCount: 3,
    }),
  ]);
}

export function syncGoalsFromEvents(input: {
  organizationId: string;
  userId: string;
}): readonly CoachGoal[] {
  const events = listEvents({
    organizationId: input.organizationId,
    userId: input.userId,
    limit: 200,
  });
  const milestoneCount = events.filter((e) =>
    String(e.kind).startsWith("first_")
  ).length;
  const goals = listGoals(input);
  return Object.freeze(
    goals.map((g) => {
      let completed = g.completedCount;
      if (g.horizon === "weekly" || g.horizon === "milestone") {
        completed = Math.min(g.targetCount, milestoneCount);
      }
      if (g.horizon === "daily" && g.completedCount === 0) {
        // leave daily for accept/dismiss actions
        completed = g.completedCount;
      }
      const percent = Math.round((completed / g.targetCount) * 100);
      return upsertGoal({
        ...g,
        completedCount: completed,
        completionPercent: percent,
        completedAt: percent >= 100 ? g.completedAt ?? new Date().toISOString() : null,
      });
    })
  );
}

export function incrementGoalProgress(goalId: string, by = 1): CoachGoal | null {
  const goals = listGoals({});
  const g = goals.find((x) => x.id === goalId);
  if (!g) return null;
  const completed = Math.min(g.targetCount, g.completedCount + by);
  const percent = Math.round((completed / g.targetCount) * 100);
  return upsertGoal({
    ...g,
    completedCount: completed,
    completionPercent: percent,
    completedAt: percent >= 100 ? new Date().toISOString() : null,
  });
}

export function listCoachGoals(input: {
  organizationId: string;
  userId: string;
}): readonly CoachGoal[] {
  seedDefaultGoals(input);
  return syncGoalsFromEvents(input);
}
