/**
 * Organizational Performance™ — goals, KPIs, milestones, reviews, coaching hooks.
 */

import { randomUUID } from "node:crypto";
import {
  getOrganization,
  listGoals,
  listMilestones,
  listOneOnOnes,
  listReviews,
  upsertGoal,
  upsertKpi,
  upsertMilestone,
  upsertOneOnOne,
  upsertReview,
} from "../store";
import type { GoalLevel, OrgGoal, OrgKpi, OrgMilestone } from "../types";

export function updateGoalProgress(input: {
  goalId: string;
  organizationId: string;
  progressPercent: number;
  status?: OrgGoal["status"];
}): OrgGoal | { error: string } {
  const goal = listGoals(input.organizationId).find(
    (g) => g.id === input.goalId
  );
  if (!goal) return { error: "Goal not found." };
  const progress = Math.min(100, Math.max(0, input.progressPercent));
  return upsertGoal({
    ...goal,
    progressPercent: progress,
    status:
      input.status ??
      (progress >= 100 ? "completed" : progress < 40 ? "at_risk" : "active"),
    updatedAt: new Date().toISOString(),
  });
}

export function createKpi(input: {
  organizationId: string;
  name: string;
  target?: number | null;
  current?: number | null;
  unit?: string | null;
  goalId?: string | null;
}): OrgKpi | { error: string } {
  if (!getOrganization(input.organizationId)) {
    return { error: "Organization not found." };
  }
  const kpi: OrgKpi = {
    id: `kpi:${randomUUID()}`,
    organizationId: input.organizationId,
    name: input.name,
    target: input.target ?? null,
    current: input.current ?? null,
    unit: input.unit ?? null,
    goalId: input.goalId ?? null,
  };
  const saved = upsertKpi(kpi);
  if (input.goalId) {
    const goal = listGoals(input.organizationId).find(
      (g) => g.id === input.goalId
    );
    if (goal && !goal.kpiIds.includes(saved.id)) {
      upsertGoal({
        ...goal,
        kpiIds: Object.freeze([...goal.kpiIds, saved.id]),
        updatedAt: new Date().toISOString(),
      });
    }
  }
  return saved;
}

export function createMilestone(input: {
  organizationId: string;
  goalId: string;
  title: string;
  dueAt?: string | null;
}): OrgMilestone | { error: string } {
  const goal = listGoals(input.organizationId).find(
    (g) => g.id === input.goalId
  );
  if (!goal) return { error: "Goal not found." };
  const m: OrgMilestone = {
    id: `ms:${randomUUID()}`,
    organizationId: input.organizationId,
    goalId: input.goalId,
    title: input.title,
    dueAt: input.dueAt ?? null,
    completed: false,
  };
  upsertMilestone(m);
  upsertGoal({
    ...goal,
    milestoneIds: Object.freeze([...goal.milestoneIds, m.id]),
    updatedAt: new Date().toISOString(),
  });
  return m;
}

export function recordReview(input: {
  organizationId: string;
  personRef: string;
  periodLabel: string;
  summary: string;
  rating?: number | null;
}) {
  return upsertReview({
    id: `rev:${randomUUID()}`,
    organizationId: input.organizationId,
    personRef: input.personRef,
    periodLabel: input.periodLabel,
    summary: input.summary,
    rating: input.rating ?? null,
    createdAt: new Date().toISOString(),
  });
}

export function recordOneOnOne(input: {
  organizationId: string;
  managerRef: string;
  reportRef: string;
  notes: string;
  occurredAt?: string;
}) {
  return upsertOneOnOne({
    id: `ooo:${randomUUID()}`,
    organizationId: input.organizationId,
    managerRef: input.managerRef,
    reportRef: input.reportRef,
    notes: input.notes,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  });
}

export function performanceAnalytics(organizationId: string) {
  const goals = listGoals(organizationId);
  const byLevel = {
    organizational: 0,
    department: 0,
    team: 0,
    individual: 0,
  } as Record<GoalLevel, number>;
  for (const g of goals) byLevel[g.level] += 1;
  const avg =
    goals.length === 0
      ? 0
      : Math.round(
          goals.reduce((a, g) => a + g.progressPercent, 0) / goals.length
        );
  return {
    generatedAt: new Date().toISOString(),
    goalCounts: byLevel,
    activeGoals: goals.filter((g) => g.status === "active").length,
    atRiskGoals: goals.filter((g) => g.status === "at_risk").length,
    completedGoals: goals.filter((g) => g.status === "completed").length,
    averageProgressPercent: avg,
    milestoneCount: listMilestones(organizationId).length,
    reviewCount: listReviews(organizationId).length,
    oneOnOneCount: listOneOnOnes(organizationId).length,
    cascadingLinks: goals.filter((g) => g.parentGoalId || g.strategicObjectiveId)
      .length,
  };
}
