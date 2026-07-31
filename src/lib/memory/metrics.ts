/**
 * MemoryMetrics — Organizational Knowledge summary for dashboards.
 */

import { listMemoriesForOrganization } from "@/lib/memory/store";
import type {
  MemoryDashboard,
  OrganizationalKnowledgeSummary,
} from "@/lib/memory/types";

function bump(map: Record<string, number>, key: string): void {
  const k = key.trim() || "Unassigned";
  map[k] = (map[k] ?? 0) + 1;
}

function daysAgo(iso: string, now: Date, days: number): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return now.getTime() - t <= days * 24 * 60 * 60 * 1000;
}

export type MemoryMetricsService = {
  summarize(
    organizationId: string,
    now?: Date
  ): OrganizationalKnowledgeSummary;
  dashboard(organizationId: string, now?: Date): MemoryDashboard;
};

export function createMemoryMetrics(): MemoryMetricsService {
  return {
    summarize(organizationId, now = new Date()) {
      const memories = listMemoriesForOrganization(organizationId);
      const active = memories.filter((m) => m.status !== "Archived");
      const byCategory: Record<string, number> = {};
      for (const m of active) bump(byCategory, m.category);

      const mostReferenced = [...active]
        .sort(
          (a, b) =>
            b.referenceCount - a.referenceCount ||
            b.updatedAt.localeCompare(a.updatedAt)
        )
        .slice(0, 5)
        .map((m) => ({
          id: m.id,
          title: m.title,
          referenceCount: m.referenceCount,
          category: m.category,
        }));

      return {
        newMemories: memories.filter((m) => daysAgo(m.createdAt, now, 7))
          .length,
        recentlyUpdated: memories.filter((m) => daysAgo(m.updatedAt, now, 7))
          .length,
        pendingValidation: memories.filter((m) => m.status === "Draft").length,
        published: memories.filter((m) => m.status === "Published").length,
        archived: memories.filter((m) => m.status === "Archived").length,
        byCategory: Object.freeze(byCategory),
        mostReferenced: Object.freeze(mostReferenced),
      };
    },

    dashboard(organizationId, now = new Date()) {
      const memories = listMemoriesForOrganization(organizationId);
      const summary = this.summarize(organizationId, now);
      return {
        memories,
        pendingValidation: Object.freeze(
          memories.filter((m) => m.status === "Draft")
        ),
        recentlyUpdated: Object.freeze(
          [...memories]
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .slice(0, 10)
        ),
        mostReferenced: Object.freeze(
          [...memories]
            .filter((m) => m.status !== "Archived")
            .sort((a, b) => b.referenceCount - a.referenceCount)
            .slice(0, 10)
        ),
        summary,
      };
    },
  };
}

export function getOrganizationalKnowledgeSummary(
  organizationId: string,
  now?: Date
): OrganizationalKnowledgeSummary {
  return createMemoryMetrics().summarize(organizationId, now);
}
