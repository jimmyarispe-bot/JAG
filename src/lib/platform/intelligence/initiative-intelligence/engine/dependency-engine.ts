/**
 * Dependency resolution across milestones and work items.
 */

import { flattenWorkItems } from "@/lib/platform/intelligence/initiative-intelligence/planning/milestones";
import type { Initiative, Milestone } from "@/lib/platform/intelligence/initiative-intelligence/types";

export interface DependencyIssue {
  id: string;
  kind: "missing_ref" | "cycle" | "blocked_by_incomplete";
  message: string;
}

export class DependencyEngine {
  resolve(initiative: Initiative): DependencyIssue[] {
    const issues: DependencyIssue[] = [];
    const milestoneIds = new Set(initiative.milestones.map((m) => m.id));
    const workIds = new Set(
      initiative.milestones.flatMap((m) => flattenWorkItems(m.workItems).map((w) => w.id))
    );

    for (const m of initiative.milestones) {
      for (const dep of m.dependsOn) {
        if (!milestoneIds.has(dep)) {
          issues.push({
            id: m.id,
            kind: "missing_ref",
            message: `Milestone ${m.title} depends on missing milestone ${dep}`,
          });
        }
      }
      for (const w of flattenWorkItems(m.workItems)) {
        for (const dep of w.dependsOn) {
          if (!workIds.has(dep) && !milestoneIds.has(dep)) {
            issues.push({
              id: w.id,
              kind: "missing_ref",
              message: `Work item ${w.title} depends on missing ref ${dep}`,
            });
          }
        }
      }
    }

    if (this.hasCycle(initiative.milestones)) {
      issues.push({
        id: initiative.id,
        kind: "cycle",
        message: "Milestone dependency cycle detected",
      });
    }

    for (const m of initiative.milestones) {
      const blockers = m.dependsOn
        .map((id) => initiative.milestones.find((x) => x.id === id))
        .filter((x): x is Milestone => x != null && x.status !== "done");
      if (blockers.length && m.status === "in_progress") {
        issues.push({
          id: m.id,
          kind: "blocked_by_incomplete",
          message: `Milestone ${m.title} is in progress while dependencies incomplete`,
        });
      }
    }

    return issues;
  }

  private hasCycle(milestones: Milestone[]): boolean {
    const graph = new Map(milestones.map((m) => [m.id, m.dependsOn]));
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const dfs = (id: string): boolean => {
      if (visiting.has(id)) return true;
      if (visited.has(id)) return false;
      visiting.add(id);
      for (const next of graph.get(id) ?? []) {
        if (dfs(next)) return true;
      }
      visiting.delete(id);
      visited.add(id);
      return false;
    };
    for (const id of graph.keys()) {
      if (dfs(id)) return true;
    }
    return false;
  }
}
