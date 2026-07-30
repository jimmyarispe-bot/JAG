/**
 * ExecutionMetrics — Execution Summary for dashboards.
 */

import {
  listProjectsForOrganization,
  listWorkItemsForOrganization,
} from "@/lib/work/store";
import type {
  ExecutionDashboard,
  ExecutionSummary,
  WorkStatus,
} from "@/lib/work/types";

const ACTIVE: ReadonlySet<WorkStatus> = new Set([
  "Backlog",
  "Planned",
  "In Progress",
  "Blocked",
  "Review",
]);

function bump(map: Record<string, number>, key: string): void {
  const k = key.trim() || "Unassigned";
  map[k] = (map[k] ?? 0) + 1;
}

function startOfWeek(now: Date): Date {
  const d = new Date(now);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
}

export type ExecutionMetricsService = {
  summarize(organizationId: string, now?: Date): ExecutionSummary;
  dashboard(organizationId: string, now?: Date): ExecutionDashboard;
};

export function createExecutionMetrics(): ExecutionMetricsService {
  return {
    summarize(organizationId, now = new Date()) {
      const projects = listProjectsForOrganization(organizationId);
      const items = listWorkItemsForOrganization(organizationId);
      const activeProjects = projects.filter((p) => ACTIVE.has(p.status));
      const activeWorkItems = items.filter((w) => ACTIVE.has(w.status));
      const blocked = items.filter((w) => w.status === "Blocked");
      const overdue = items.filter(
        (w) =>
          ACTIVE.has(w.status) &&
          w.dueDate != null &&
          Date.parse(w.dueDate) < now.getTime()
      );
      const weekStart = startOfWeek(now).getTime();
      const completedThisWeek = items.filter(
        (w) =>
          w.status === "Completed" &&
          w.completedAt != null &&
          Date.parse(w.completedAt) >= weekStart
      );

      const workByBusinessUnit: Record<string, number> = {};
      const workByDepartment: Record<string, number> = {};
      for (const w of activeWorkItems) {
        bump(workByBusinessUnit, w.businessUnit ?? "Unassigned");
        bump(workByDepartment, w.department ?? "Unassigned");
      }

      const avg =
        activeWorkItems.length === 0
          ? 0
          : Math.round(
              activeWorkItems.reduce((a, w) => a + w.progressPercent, 0) /
                activeWorkItems.length
            );

      return {
        activeProjects: activeProjects.length,
        activeWorkItems: activeWorkItems.length,
        blockedWork: blocked.length,
        overdueWork: overdue.length,
        completedThisWeek: completedThisWeek.length,
        averageProgress: avg,
        workByBusinessUnit: Object.freeze(workByBusinessUnit),
        workByDepartment: Object.freeze(workByDepartment),
      };
    },

    dashboard(organizationId, now = new Date()) {
      const projects = listProjectsForOrganization(organizationId);
      const items = listWorkItemsForOrganization(organizationId);
      const summary = this.summarize(organizationId, now);
      const weekStart = startOfWeek(now).getTime();
      return {
        activeProjects: Object.freeze(
          projects.filter((p) => ACTIVE.has(p.status))
        ),
        activeWorkItems: Object.freeze(
          items.filter((w) => ACTIVE.has(w.status))
        ),
        blocked: Object.freeze(items.filter((w) => w.status === "Blocked")),
        overdue: Object.freeze(
          items.filter(
            (w) =>
              ACTIVE.has(w.status) &&
              w.dueDate != null &&
              Date.parse(w.dueDate) < now.getTime()
          )
        ),
        completedThisWeek: Object.freeze(
          items.filter(
            (w) =>
              w.status === "Completed" &&
              w.completedAt != null &&
              Date.parse(w.completedAt) >= weekStart
          )
        ),
        summary,
      };
    },
  };
}

export function getExecutionSummary(
  organizationId: string,
  now?: Date
): ExecutionSummary {
  return createExecutionMetrics().summarize(organizationId, now);
}
