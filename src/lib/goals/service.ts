/**
 * GoalService — create / read / patch goals with hierarchy, progress, health, twin.
 */

import { randomUUID } from "node:crypto";
import { createGoalHealth } from "@/lib/goals/health";
import { createGoalHierarchy } from "@/lib/goals/hierarchy";
import { createGoalMetrics } from "@/lib/goals/metrics";
import { createGoalProgress } from "@/lib/goals/progress";
import {
  getGoal,
  listGoalsForOrganization,
  upsertGoal,
} from "@/lib/goals/store";
import { createGoalTimeline } from "@/lib/goals/timeline";
import { createGoalTwinService } from "@/lib/goals/twin";
import type {
  CreateGoalInput,
  GoalDashboard,
  JagGoal,
  PatchGoalInput,
  StrategySummary,
} from "@/lib/goals/types";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";

export type GoalService = {
  create(input: CreateGoalInput): JagGoal | { error: string };
  get(organizationId: string, goalId: string): JagGoal | null;
  list(organizationId: string): readonly JagGoal[];
  patch(input: PatchGoalInput): JagGoal | { error: string } | null;
  dashboard(organizationId: string): GoalDashboard;
  summary(organizationId: string): StrategySummary;
  recalculateProgress(organizationId: string, goalId: string): JagGoal | null;
};

function refreshDerived(
  goal: JagGoal,
  deps: {
    progress: ReturnType<typeof createGoalProgress>;
    health: ReturnType<typeof createGoalHealth>;
  },
  now = new Date()
): JagGoal {
  const progressPercent = deps.progress.recalculateWithChildren(
    goal.organizationId,
    goal.id
  );
  const withProgress = { ...goal, progressPercent };
  const health = deps.health.evaluate(withProgress, now);
  return { ...withProgress, health };
}

export function createGoalService(): GoalService {
  const hierarchy = createGoalHierarchy();
  const progress = createGoalProgress();
  const health = createGoalHealth();
  const timeline = createGoalTimeline();
  const twin = createGoalTwinService();
  const metrics = createGoalMetrics();

  const service: GoalService = {
    create(input) {
      const title = input.title.trim();
      const description = input.description.trim();
      if (!title) return { error: "Title is required." };
      if (!description) return { error: "Description is required." };

      const goalType = input.goalType ?? "Objective";
      const hierarchyLevel =
        input.hierarchyLevel ?? hierarchy.levelForType(goalType);
      const parentCheck = hierarchy.validateParent(
        input.organizationId,
        input.parentGoalId ?? null,
        hierarchyLevel
      );
      if (!parentCheck.ok) return { error: parentCheck.error };

      const now = new Date().toISOString();
      const id = randomUUID();
      let goal: JagGoal = {
        id,
        organizationId: input.organizationId,
        title,
        description,
        category: input.category ?? "General",
        owner: input.owner ?? null,
        businessUnit: input.businessUnit ?? null,
        department: input.department ?? null,
        status: input.status ?? "Active",
        priority: input.priority ?? "P2",
        targetDate: input.targetDate ?? null,
        startDate: input.startDate ?? now.slice(0, 10),
        progressPercent: input.manualProgressPercent ?? 0,
        parentGoalId: input.parentGoalId ?? null,
        goalType,
        hierarchyLevel,
        visibility: input.visibility ?? "Organization",
        health: "Watch",
        links: Object.freeze([...(input.links ?? [])]),
        twinEntityId: null,
        manualProgressPercent: input.manualProgressPercent ?? null,
        completedTaskIds: Object.freeze([]),
        completedDecisionIds: Object.freeze([]),
        kpiUpdateCount: 0,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        archivedAt: null,
        createdBy: input.createdBy,
      };

      upsertGoal(goal);
      const twinId = twin.ensureGoalTwin(goal, input.createdBy);
      goal = { ...goal, twinEntityId: twinId };
      goal = refreshDerived(goal, { progress, health });
      upsertGoal(goal);
      twin.syncLinks(goal, input.createdBy);

      timeline.record({
        organizationId: input.organizationId,
        goalId: id,
        kind: "created",
        actor: input.createdBy,
        message: `Goal created (${goal.goalType}).`,
        metadata: {
          hierarchyLevel: goal.hierarchyLevel,
          status: goal.status,
        },
      });
      if (goal.owner) {
        timeline.record({
          organizationId: input.organizationId,
          goalId: id,
          kind: "assigned",
          actor: input.createdBy,
          message: `Assigned to ${goal.owner}.`,
          metadata: { owner: goal.owner },
        });
      }

      emitJagPlatformEvent({
        organizationId: input.organizationId,
        sourceModule: "goals",
        entityType: "JagGoal",
        entityId: id,
        eventType: "goal.created",
        actor: input.createdBy,
        metadata: {
          goalType: goal.goalType,
          status: goal.status,
          twinEntityId: goal.twinEntityId ?? "",
        },
      });

      return goal;
    },

    get: getGoal,
    list: listGoalsForOrganization,

    patch(input) {
      const current = getGoal(input.organizationId, input.goalId);
      if (!current) return null;

      if (input.parentGoalId !== undefined || input.hierarchyLevel || input.goalType) {
        const level =
          input.hierarchyLevel ??
          (input.goalType
            ? hierarchy.levelForType(input.goalType)
            : current.hierarchyLevel);
        const parentId =
          input.parentGoalId !== undefined
            ? input.parentGoalId
            : current.parentGoalId;
        const check = hierarchy.validateParent(
          input.organizationId,
          parentId,
          level
        );
        if (!check.ok) return { error: check.error };
      }

      const prevProgress = current.progressPercent;
      const prevOwner = current.owner;
      const now = new Date().toISOString();

      let next: JagGoal = {
        ...current,
        title: input.title?.trim() ?? current.title,
        description: input.description?.trim() ?? current.description,
        category: input.category ?? current.category,
        owner: input.owner !== undefined ? input.owner : current.owner,
        businessUnit:
          input.businessUnit !== undefined
            ? input.businessUnit
            : current.businessUnit,
        department:
          input.department !== undefined
            ? input.department
            : current.department,
        status: input.status ?? current.status,
        priority: input.priority ?? current.priority,
        targetDate:
          input.targetDate !== undefined
            ? input.targetDate
            : current.targetDate,
        startDate:
          input.startDate !== undefined ? input.startDate : current.startDate,
        parentGoalId:
          input.parentGoalId !== undefined
            ? input.parentGoalId
            : current.parentGoalId,
        goalType: input.goalType ?? current.goalType,
        hierarchyLevel:
          input.hierarchyLevel ??
          (input.goalType
            ? hierarchy.levelForType(input.goalType)
            : current.hierarchyLevel),
        visibility: input.visibility ?? current.visibility,
        links:
          input.links !== undefined
            ? Object.freeze([...input.links])
            : current.links,
        manualProgressPercent:
          input.manualProgressPercent !== undefined
            ? input.manualProgressPercent
            : current.manualProgressPercent,
        completedTaskIds:
          input.completedTaskIds !== undefined
            ? Object.freeze([...input.completedTaskIds])
            : current.completedTaskIds,
        completedDecisionIds:
          input.completedDecisionIds !== undefined
            ? Object.freeze([...input.completedDecisionIds])
            : current.completedDecisionIds,
        kpiUpdateCount:
          input.kpiUpdateCount !== undefined
            ? input.kpiUpdateCount
            : current.kpiUpdateCount,
        updatedAt: now,
        completedAt:
          input.status === "Completed"
            ? now
            : input.status
              ? null
              : current.completedAt,
        archivedAt:
          input.status === "Archived" ? now : current.archivedAt,
      };

      upsertGoal(next);
      const twinId = twin.ensureGoalTwin(next, input.actor);
      next = { ...next, twinEntityId: twinId ?? next.twinEntityId };
      next = refreshDerived(next, { progress, health });
      upsertGoal(next);
      twin.syncLinks(next, input.actor);

      timeline.record({
        organizationId: input.organizationId,
        goalId: next.id,
        kind: "updated",
        actor: input.actor,
        message: "Goal updated.",
        metadata: { status: next.status },
      });

      if (input.owner !== undefined && input.owner !== prevOwner) {
        timeline.record({
          organizationId: input.organizationId,
          goalId: next.id,
          kind: "assigned",
          actor: input.actor,
          message: `Assigned to ${input.owner ?? "unassigned"}.`,
          metadata: { owner: input.owner ?? "" },
        });
      }

      if (next.progressPercent !== prevProgress) {
        timeline.record({
          organizationId: input.organizationId,
          goalId: next.id,
          kind: "progress_changed",
          actor: input.actor,
          message: `Progress ${prevProgress}% → ${next.progressPercent}%.`,
          metadata: {
            from: String(prevProgress),
            to: String(next.progressPercent),
          },
        });
      }

      if (next.status === "Completed" && current.status !== "Completed") {
        timeline.record({
          organizationId: input.organizationId,
          goalId: next.id,
          kind: "completed",
          actor: input.actor,
          message: "Goal completed.",
        });
      }

      if (next.status === "Archived" && current.status !== "Archived") {
        timeline.record({
          organizationId: input.organizationId,
          goalId: next.id,
          kind: "archived",
          actor: input.actor,
          message: "Goal archived.",
        });
      }

      emitJagPlatformEvent({
        organizationId: input.organizationId,
        sourceModule: "goals",
        entityType: "JagGoal",
        entityId: next.id,
        eventType: "goal.updated",
        actor: input.actor,
        metadata: {
          status: next.status,
          health: next.health,
          progressPercent: String(next.progressPercent),
        },
      });

      // Roll up parent progress
      if (next.parentGoalId) {
        service.recalculateProgress(input.organizationId, next.parentGoalId);
      }

      return getGoal(input.organizationId, next.id);
    },

    dashboard(organizationId) {
      return metrics.dashboard(organizationId);
    },

    summary(organizationId) {
      return metrics.summarize(organizationId);
    },

    recalculateProgress(organizationId, goalId) {
      const current = getGoal(organizationId, goalId);
      if (!current) return null;
      const next = refreshDerived(current, { progress, health });
      upsertGoal(next);
      if (next.parentGoalId) {
        service.recalculateProgress(organizationId, next.parentGoalId);
      }
      return getGoal(organizationId, goalId);
    },
  };

  return service;
}

let singleton: GoalService | null = null;

export function getGoalService(): GoalService {
  if (!singleton) singleton = createGoalService();
  return singleton;
}

export function resetGoalServiceForTests(): void {
  singleton = null;
}
