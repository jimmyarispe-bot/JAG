/**
 * DependencyService — blocks / blocked_by / depends_on / parent / child.
 */

import { randomUUID } from "node:crypto";
import {
  getWorkItem,
  listDependenciesForOrganization,
  upsertDependency,
  upsertWorkItem,
} from "@/lib/work/store";
import { createExecutionTimeline } from "@/lib/work/timeline";
import type { DependencyKind, JagDependency } from "@/lib/work/types";

const INVERSE: Partial<Record<DependencyKind, DependencyKind>> = {
  blocks: "blocked_by",
  blocked_by: "blocks",
  parent: "child",
  child: "parent",
  depends_on: "depends_on",
};

export type DependencyService = {
  add(input: {
    organizationId: string;
    fromWorkItemId: string;
    toWorkItemId: string;
    kind: DependencyKind;
    createdBy: string;
  }): JagDependency | { error: string };
  list(organizationId: string, workItemId?: string): readonly JagDependency[];
  /** True if work item has unresolved blockers (incoming blocks / depends_on). */
  isBlocked(organizationId: string, workItemId: string): boolean;
  /** Enforce: cannot start In Progress when blocked by incomplete items. */
  canTransitionTo(
    organizationId: string,
    workItemId: string,
    toStatus: string
  ): { readonly ok: true } | { readonly ok: false; readonly error: string };
};

export function createDependencyService(): DependencyService {
  const timeline = createExecutionTimeline();

  return {
    add(input) {
      if (input.fromWorkItemId === input.toWorkItemId) {
        return { error: "A work item cannot depend on itself." };
      }
      const from = getWorkItem(input.organizationId, input.fromWorkItemId);
      const to = getWorkItem(input.organizationId, input.toWorkItemId);
      if (!from || !to) return { error: "Work item not found." };

      const existing = listDependenciesForOrganization(
        input.organizationId
      ).find(
        (d) =>
          d.fromWorkItemId === input.fromWorkItemId &&
          d.toWorkItemId === input.toWorkItemId &&
          d.kind === input.kind
      );
      if (existing) return existing;

      // Cycle check for parent/depends_on chains
      if (input.kind === "depends_on" || input.kind === "parent") {
        const visiting = new Set<string>([input.fromWorkItemId]);
        let cursor = input.toWorkItemId;
        let guard = 0;
        while (cursor && guard < 50) {
          if (visiting.has(cursor)) {
            return { error: "Dependency cycle detected." };
          }
          visiting.add(cursor);
          const next = listDependenciesForOrganization(
            input.organizationId,
            cursor
          ).find(
            (d) =>
              d.fromWorkItemId === cursor &&
              (d.kind === "depends_on" || d.kind === "parent")
          );
          cursor = next?.toWorkItemId ?? "";
          guard += 1;
        }
      }

      const now = new Date().toISOString();
      const dep: JagDependency = {
        id: randomUUID(),
        organizationId: input.organizationId,
        fromWorkItemId: input.fromWorkItemId,
        toWorkItemId: input.toWorkItemId,
        kind: input.kind,
        createdAt: now,
        createdBy: input.createdBy,
      };
      upsertDependency(dep);

      const inverse = INVERSE[input.kind];
      if (inverse && inverse !== input.kind) {
        const invExisting = listDependenciesForOrganization(
          input.organizationId
        ).find(
          (d) =>
            d.fromWorkItemId === input.toWorkItemId &&
            d.toWorkItemId === input.fromWorkItemId &&
            d.kind === inverse
        );
        if (!invExisting) {
          upsertDependency({
            id: randomUUID(),
            organizationId: input.organizationId,
            fromWorkItemId: input.toWorkItemId,
            toWorkItemId: input.fromWorkItemId,
            kind: inverse,
            createdAt: now,
            createdBy: input.createdBy,
          });
        }
      }

      if (input.kind === "parent") {
        upsertWorkItem({
          ...to,
          parentWorkItemId: from.id,
          updatedAt: now,
        });
      }

      timeline.record({
        organizationId: input.organizationId,
        entityType: "work_item",
        entityId: input.fromWorkItemId,
        kind: "dependency_added",
        actor: input.createdBy,
        message: `${input.kind} → ${to.title}`,
        metadata: {
          toWorkItemId: input.toWorkItemId,
          kind: input.kind,
        },
      });

      return dep;
    },

    list: listDependenciesForOrganization,

    isBlocked(organizationId, workItemId) {
      const deps = listDependenciesForOrganization(organizationId, workItemId);
      for (const d of deps) {
        if (d.toWorkItemId !== workItemId && d.fromWorkItemId !== workItemId) {
          continue;
        }
        // Incoming: something blocks this item
        if (
          d.kind === "blocked_by" &&
          d.fromWorkItemId === workItemId
        ) {
          const blocker = getWorkItem(organizationId, d.toWorkItemId);
          if (
            blocker &&
            blocker.status !== "Completed" &&
            blocker.status !== "Archived"
          ) {
            return true;
          }
        }
        if (d.kind === "blocks" && d.toWorkItemId === workItemId) {
          const blocker = getWorkItem(organizationId, d.fromWorkItemId);
          if (
            blocker &&
            blocker.status !== "Completed" &&
            blocker.status !== "Archived"
          ) {
            return true;
          }
        }
        if (d.kind === "depends_on" && d.fromWorkItemId === workItemId) {
          const dep = getWorkItem(organizationId, d.toWorkItemId);
          if (
            dep &&
            dep.status !== "Completed" &&
            dep.status !== "Archived"
          ) {
            return true;
          }
        }
      }
      return false;
    },

    canTransitionTo(organizationId, workItemId, toStatus) {
      if (
        toStatus === "In Progress" ||
        toStatus === "Review" ||
        toStatus === "Completed"
      ) {
        if (this.isBlocked(organizationId, workItemId)) {
          return {
            ok: false,
            error:
              "Work item is blocked by incomplete dependencies and cannot advance.",
          };
        }
      }
      return { ok: true };
    },
  };
}
