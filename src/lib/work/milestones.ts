/**
 * MilestoneService — project milestones with aggregated progress / overdue.
 */

import { randomUUID } from "node:crypto";
import { createProjectService } from "@/lib/work/projects";
import { createWorkProgress } from "@/lib/work/progress";
import {
  getMilestone,
  getProject,
  listMilestonesForOrganization,
  upsertMilestone,
} from "@/lib/work/store";
import { createExecutionTimeline } from "@/lib/work/timeline";
import { createWorkTwinService } from "@/lib/work/twin";
import type { JagMilestone, WorkStatus } from "@/lib/work/types";

export type MilestoneService = {
  create(input: {
    organizationId: string;
    projectId: string;
    title: string;
    description?: string;
    dueDate?: string | null;
    createdBy: string;
  }): JagMilestone | { error: string };
  get(organizationId: string, milestoneId: string): JagMilestone | null;
  list(organizationId: string, projectId?: string): readonly JagMilestone[];
  update(input: {
    organizationId: string;
    milestoneId: string;
    actor: string;
    title?: string;
    description?: string;
    dueDate?: string | null;
    status?: WorkStatus;
  }): JagMilestone | { error: string } | null;
  refresh(organizationId: string, milestoneId: string): JagMilestone | null;
};

export function createMilestoneService(): MilestoneService {
  const progress = createWorkProgress();
  const timeline = createExecutionTimeline();
  const twin = createWorkTwinService();
  const projects = createProjectService();

  function applyDerived(milestone: JagMilestone): JagMilestone {
    const derived = progress.milestoneProgress(
      milestone.organizationId,
      milestone
    );
    return {
      ...milestone,
      progressPercent: derived.progressPercent,
      overdue: derived.overdue,
      status:
        derived.progressPercent >= 100
          ? "Completed"
          : milestone.status === "Completed"
            ? "In Progress"
            : milestone.status,
      completedAt:
        derived.progressPercent >= 100
          ? milestone.completedAt ?? new Date().toISOString()
          : null,
    };
  }

  return {
    create(input) {
      if (!input.title.trim()) return { error: "Milestone title is required." };
      const project = getProject(input.organizationId, input.projectId);
      if (!project) return { error: "Project was not found." };

      const now = new Date().toISOString();
      let milestone: JagMilestone = {
        id: randomUUID(),
        organizationId: input.organizationId,
        projectId: input.projectId,
        title: input.title.trim(),
        description: input.description?.trim() ?? "",
        dueDate: input.dueDate ?? null,
        status: "Planned",
        progressPercent: 0,
        overdue: false,
        twinEntityId: null,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        createdBy: input.createdBy,
      };
      milestone = applyDerived(milestone);
      upsertMilestone(milestone);
      const twinId = twin.ensureMilestoneTwin(milestone, input.createdBy);
      milestone = { ...milestone, twinEntityId: twinId };
      upsertMilestone(milestone);
      projects.refreshProgress(input.organizationId, input.projectId);

      timeline.record({
        organizationId: input.organizationId,
        entityType: "milestone",
        entityId: milestone.id,
        kind: "created",
        actor: input.createdBy,
        message: `Milestone “${milestone.title}” created.`,
        metadata: { projectId: input.projectId },
      });
      return milestone;
    },

    get: getMilestone,
    list: listMilestonesForOrganization,

    update(input) {
      const current = getMilestone(input.organizationId, input.milestoneId);
      if (!current) return null;
      const now = new Date().toISOString();
      let next: JagMilestone = {
        ...current,
        title: input.title?.trim() ?? current.title,
        description: input.description?.trim() ?? current.description,
        dueDate: input.dueDate !== undefined ? input.dueDate : current.dueDate,
        status: input.status ?? current.status,
        updatedAt: now,
      };
      next = applyDerived(next);
      upsertMilestone(next);
      twin.ensureMilestoneTwin(next, input.actor);
      projects.refreshProgress(input.organizationId, next.projectId);
      return next;
    },

    refresh(organizationId, milestoneId) {
      const current = getMilestone(organizationId, milestoneId);
      if (!current) return null;
      const next = applyDerived({
        ...current,
        updatedAt: new Date().toISOString(),
      });
      upsertMilestone(next);
      projects.refreshProgress(organizationId, next.projectId);
      return next;
    },
  };
}
