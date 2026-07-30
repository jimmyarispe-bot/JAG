/**
 * WorkService — work item CRUD + workflow transitions.
 */

import { randomUUID } from "node:crypto";
import { createDependencyService } from "@/lib/work/dependencies";
import { createExecutionMetrics } from "@/lib/work/metrics";
import { createWorkProgress } from "@/lib/work/progress";
import {
  getWorkItem,
  listWorkItemsForOrganization,
  upsertWorkItem,
} from "@/lib/work/store";
import { createExecutionTimeline } from "@/lib/work/timeline";
import { createWorkTwinService } from "@/lib/work/twin";
import type {
  CreateWorkItemInput,
  ExecutionDashboard,
  ExecutionSummary,
  JagWorkItem,
  PatchWorkItemInput,
  WorkStatus,
} from "@/lib/work/types";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";

const STATUS_ORDER: readonly WorkStatus[] = [
  "Backlog",
  "Planned",
  "In Progress",
  "Blocked",
  "Review",
  "Completed",
  "Archived",
];

export type WorkService = {
  create(input: CreateWorkItemInput): JagWorkItem | { error: string };
  get(organizationId: string, workItemId: string): JagWorkItem | null;
  list(organizationId: string): readonly JagWorkItem[];
  listByProject(
    organizationId: string,
    projectId: string
  ): readonly JagWorkItem[];
  patch(input: PatchWorkItemInput): JagWorkItem | { error: string } | null;
  dashboard(organizationId: string): ExecutionDashboard;
  summary(organizationId: string): ExecutionSummary;
  canTransition(from: WorkStatus, to: WorkStatus): boolean;
};

export function createWorkService(): WorkService {
  const progress = createWorkProgress();
  const deps = createDependencyService();
  const timeline = createExecutionTimeline();
  const twin = createWorkTwinService();
  const metrics = createExecutionMetrics();

  const service: WorkService = {
    canTransition(from, to) {
      if (from === to) return true;
      if (to === "Blocked" || from === "Blocked") return true;
      if (to === "Archived" || to === "Completed") return true;
      const fi = STATUS_ORDER.indexOf(from);
      const ti = STATUS_ORDER.indexOf(to);
      if (fi < 0 || ti < 0) return false;
      return Math.abs(ti - fi) <= 2 || ti > fi;
    },

    create(input) {
      const title = input.title.trim();
      const description = input.description.trim();
      if (!title) return { error: "Title is required." };
      if (!description) return { error: "Description is required." };

      const now = new Date().toISOString();
      const id = randomUUID();
      let item: JagWorkItem = {
        id,
        organizationId: input.organizationId,
        title,
        description,
        type: input.type ?? "Work Item",
        status: input.status ?? "Backlog",
        priority: input.priority ?? "P2",
        owner: input.owner ?? null,
        assignee: input.assignee ?? null,
        department: input.department ?? null,
        businessUnit: input.businessUnit ?? null,
        dueDate: input.dueDate ?? null,
        startDate: input.startDate ?? null,
        estimatedEffort: input.estimatedEffort ?? 0,
        actualEffort: 0,
        relatedGoalId: input.relatedGoalId ?? null,
        relatedDecisionId: input.relatedDecisionId ?? null,
        relatedRiskId: input.relatedRiskId ?? null,
        relatedEvidenceIds: Object.freeze([
          ...(input.relatedEvidenceIds ?? []),
        ]),
        relatedTwinEntityIds: Object.freeze([
          ...(input.relatedTwinEntityIds ?? []),
        ]),
        projectId: input.projectId ?? null,
        parentWorkItemId: input.parentWorkItemId ?? null,
        progressPercent: 0,
        twinEntityId: null,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        archivedAt: null,
        createdBy: input.createdBy,
      };

      const children = listWorkItemsForOrganization(input.organizationId).filter(
        (w) => w.parentWorkItemId === id
      );
      item = {
        ...item,
        progressPercent: progress.workItemProgress(item, children),
      };
      upsertWorkItem(item);
      const twinId = twin.ensureWorkItemTwin(item, input.createdBy);
      item = { ...item, twinEntityId: twinId };
      upsertWorkItem(item);
      twin.syncWorkItemLinks(item, input.createdBy);

      timeline.record({
        organizationId: input.organizationId,
        entityType: "work_item",
        entityId: id,
        kind: "created",
        actor: input.createdBy,
        message: `Work item created (${item.type}).`,
        metadata: { status: item.status },
      });
      emitJagPlatformEvent({
        organizationId: input.organizationId,
        sourceModule: "work",
        entityType: "JagWorkItem",
        entityId: id,
        eventType: "work.created",
        actor: input.createdBy,
        metadata: {
          type: item.type,
          status: item.status,
          twinEntityId: item.twinEntityId ?? "",
        },
      });

      return item;
    },

    get: getWorkItem,
    list: listWorkItemsForOrganization,
    listByProject(organizationId, projectId) {
      return Object.freeze(
        listWorkItemsForOrganization(organizationId).filter(
          (w) => w.projectId === projectId
        )
      );
    },

    patch(input) {
      const current = getWorkItem(input.organizationId, input.workItemId);
      if (!current) return null;

      if (input.status && !service.canTransition(current.status, input.status)) {
        return {
          error: `Cannot transition from ${current.status} to ${input.status}.`,
        };
      }
      if (input.status) {
        const gate = deps.canTransitionTo(
          input.organizationId,
          input.workItemId,
          input.status
        );
        if (!gate.ok) return { error: gate.error };
      }

      const now = new Date().toISOString();
      let next: JagWorkItem = {
        ...current,
        title: input.title?.trim() ?? current.title,
        description: input.description?.trim() ?? current.description,
        type: input.type ?? current.type,
        status: input.status ?? current.status,
        priority: input.priority ?? current.priority,
        owner: input.owner !== undefined ? input.owner : current.owner,
        assignee:
          input.assignee !== undefined ? input.assignee : current.assignee,
        department:
          input.department !== undefined
            ? input.department
            : current.department,
        businessUnit:
          input.businessUnit !== undefined
            ? input.businessUnit
            : current.businessUnit,
        dueDate: input.dueDate !== undefined ? input.dueDate : current.dueDate,
        startDate:
          input.startDate !== undefined ? input.startDate : current.startDate,
        estimatedEffort: input.estimatedEffort ?? current.estimatedEffort,
        actualEffort: input.actualEffort ?? current.actualEffort,
        relatedGoalId:
          input.relatedGoalId !== undefined
            ? input.relatedGoalId
            : current.relatedGoalId,
        relatedDecisionId:
          input.relatedDecisionId !== undefined
            ? input.relatedDecisionId
            : current.relatedDecisionId,
        relatedRiskId:
          input.relatedRiskId !== undefined
            ? input.relatedRiskId
            : current.relatedRiskId,
        relatedEvidenceIds:
          input.relatedEvidenceIds !== undefined
            ? Object.freeze([...input.relatedEvidenceIds])
            : current.relatedEvidenceIds,
        relatedTwinEntityIds:
          input.relatedTwinEntityIds !== undefined
            ? Object.freeze([...input.relatedTwinEntityIds])
            : current.relatedTwinEntityIds,
        projectId:
          input.projectId !== undefined ? input.projectId : current.projectId,
        parentWorkItemId:
          input.parentWorkItemId !== undefined
            ? input.parentWorkItemId
            : current.parentWorkItemId,
        updatedAt: now,
        completedAt:
          input.status === undefined
            ? current.completedAt
            : input.status === "Completed"
              ? now
              : null,
        archivedAt:
          input.status === undefined
            ? current.archivedAt
            : input.status === "Archived"
              ? now
              : current.archivedAt,
      };

      const children = listWorkItemsForOrganization(
        input.organizationId
      ).filter((w) => w.parentWorkItemId === next.id);
      const prevProgress = current.progressPercent;
      next = {
        ...next,
        progressPercent: progress.workItemProgress(next, children),
      };

      upsertWorkItem(next);
      const twinId = twin.ensureWorkItemTwin(next, input.actor);
      next = { ...next, twinEntityId: twinId ?? next.twinEntityId };
      upsertWorkItem(next);
      twin.syncWorkItemLinks(next, input.actor);

      timeline.record({
        organizationId: input.organizationId,
        entityType: "work_item",
        entityId: next.id,
        kind: "updated",
        actor: input.actor,
        message: "Work item updated.",
        metadata: { status: next.status },
      });

      if (input.status && input.status !== current.status) {
        timeline.record({
          organizationId: input.organizationId,
          entityType: "work_item",
          entityId: next.id,
          kind: "status_changed",
          actor: input.actor,
          message: `${current.status} → ${input.status}.`,
          metadata: { from: current.status, to: input.status },
        });
        emitJagPlatformEvent({
          organizationId: input.organizationId,
          sourceModule: "work",
          entityType: "JagWorkItem",
          entityId: next.id,
          eventType: "work.status_changed",
          actor: input.actor,
          metadata: { from: current.status, to: input.status },
        });
      }

      if (
        input.assignee !== undefined &&
        input.assignee !== current.assignee
      ) {
        timeline.record({
          organizationId: input.organizationId,
          entityType: "work_item",
          entityId: next.id,
          kind: "assigned",
          actor: input.actor,
          message: `Assigned to ${input.assignee ?? "unassigned"}.`,
          metadata: { assignee: input.assignee ?? "" },
        });
      }

      if (next.progressPercent !== prevProgress) {
        timeline.record({
          organizationId: input.organizationId,
          entityType: "work_item",
          entityId: next.id,
          kind: "progress_changed",
          actor: input.actor,
          message: `Progress ${prevProgress}% → ${next.progressPercent}%.`,
        });
      }

      if (next.status === "Completed" && current.status !== "Completed") {
        timeline.record({
          organizationId: input.organizationId,
          entityType: "work_item",
          entityId: next.id,
          kind: "completed",
          actor: input.actor,
          message: "Work item completed.",
        });
      }

      if (next.status === "Archived" && current.status !== "Archived") {
        timeline.record({
          organizationId: input.organizationId,
          entityType: "work_item",
          entityId: next.id,
          kind: "archived",
          actor: input.actor,
          message: "Work item archived.",
        });
      }

      return getWorkItem(input.organizationId, next.id);
    },

    dashboard(organizationId) {
      return metrics.dashboard(organizationId);
    },

    summary(organizationId) {
      return metrics.summarize(organizationId);
    },
  };

  return service;
}

let singleton: WorkService | null = null;

export function getWorkService(): WorkService {
  if (!singleton) singleton = createWorkService();
  return singleton;
}

export function resetWorkServiceForTests(): void {
  singleton = null;
}
