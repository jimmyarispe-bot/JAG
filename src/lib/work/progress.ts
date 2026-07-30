/**
 * Deterministic execution progress — tasks, work items, milestones.
 */

import {
  listMilestonesForOrganization,
  listWorkItemsForOrganization,
} from "@/lib/work/store";
import type { JagMilestone, JagProject, JagWorkItem, WorkStatus } from "@/lib/work/types";

const COMPLETED: ReadonlySet<WorkStatus> = new Set(["Completed", "Archived"]);

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export type WorkProgressService = {
  workItemProgress(item: JagWorkItem, children?: readonly JagWorkItem[]): number;
  milestoneProgress(
    organizationId: string,
    milestone: JagMilestone
  ): { readonly progressPercent: number; readonly overdue: boolean };
  projectProgress(organizationId: string, project: JagProject): number;
};

export function createWorkProgress(): WorkProgressService {
  return {
    workItemProgress(item, children = []) {
      if (COMPLETED.has(item.status)) return 100;
      if (children.length > 0) {
        const done = children.filter((c) => COMPLETED.has(c.status)).length;
        return clamp((done / children.length) * 100);
      }
      if (item.status === "Review") return 85;
      if (item.status === "In Progress") return Math.max(25, item.progressPercent || 40);
      if (item.status === "Blocked") return item.progressPercent || 20;
      if (item.status === "Planned") return 10;
      return 0;
    },

    milestoneProgress(organizationId, milestone) {
      if (COMPLETED.has(milestone.status)) {
        return { progressPercent: 100, overdue: false };
      }
      const items = listWorkItemsForOrganization(organizationId).filter(
        (w) =>
          w.projectId === milestone.projectId &&
          // Items due on/before milestone date count toward milestone
          (milestone.dueDate == null ||
            (w.dueDate != null && w.dueDate <= milestone.dueDate) ||
            w.parentWorkItemId == null)
      );
      const scoped =
        items.length > 0
          ? items
          : listWorkItemsForOrganization(organizationId).filter(
              (w) => w.projectId === milestone.projectId
            );
      const progressPercent =
        scoped.length === 0
          ? milestone.progressPercent
          : clamp(
              (scoped.filter((w) => COMPLETED.has(w.status)).length /
                scoped.length) *
                100
            );
      const overdue =
        milestone.dueDate != null &&
        Date.parse(milestone.dueDate) < Date.now() &&
        progressPercent < 100;
      return { progressPercent, overdue };
    },

    projectProgress(organizationId, project) {
      if (COMPLETED.has(project.status)) return 100;
      const items = listWorkItemsForOrganization(organizationId).filter(
        (w) => w.projectId === project.id
      );
      const milestones = listMilestonesForOrganization(
        organizationId,
        project.id
      );

      const signals: number[] = [];
      if (items.length > 0) {
        signals.push(
          clamp(
            (items.filter((w) => COMPLETED.has(w.status)).length /
              items.length) *
              100
          )
        );
      }
      if (milestones.length > 0) {
        const mDone = milestones.filter((m) => COMPLETED.has(m.status)).length;
        signals.push(clamp((mDone / milestones.length) * 100));
        const mAvg =
          milestones.reduce((a, m) => a + m.progressPercent, 0) /
          milestones.length;
        signals.push(clamp(mAvg));
      }
      if (signals.length === 0) return project.progressPercent || 0;
      return clamp(signals.reduce((a, b) => a + b, 0) / signals.length);
    },
  };
}
