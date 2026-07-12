/**
 * Executive Graph Analyzer — GraphRepository (Sprint 025).
 *
 * In-memory store for latest graphs by scope. Swap later for persistence.
 */

import type { GraphRepository as GraphRepositoryContract } from "@/lib/platform/intelligence/executive-graph/contracts";
import type { Graph, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";

function scopeKey(scope?: Partial<GraphScope> | null): string {
  return [
    scope?.organizationId ?? "org:null",
    scope?.schoolId ?? "school:null",
    scope?.regionId ?? "region:null",
    scope?.campusId ?? "campus:null",
  ].join("|");
}

/**
 * GraphRepository — scoped in-memory graph persistence.
 */
export class GraphRepository implements GraphRepositoryContract {
  private readonly byId = new Map<string, Graph>();
  private readonly latestByScope = new Map<string, string>();

  save(graph: Graph): Graph {
    this.byId.set(graph.id, graph);
    this.latestByScope.set(scopeKey(graph.scope), graph.id);
    return graph;
  }

  get(graphId: string): Graph | null {
    return this.byId.get(graphId) ?? null;
  }

  getLatest(scope?: Partial<GraphScope>): Graph | null {
    if (scope) {
      const id = this.latestByScope.get(scopeKey(scope));
      return id ? (this.byId.get(id) ?? null) : null;
    }
    let latest: Graph | null = null;
    for (const graph of this.byId.values()) {
      if (!latest || graph.builtAt > latest.builtAt) {
        latest = graph;
      }
    }
    return latest;
  }

  list(scope?: Partial<GraphScope>): Graph[] {
    const graphs = Array.from(this.byId.values());
    if (!scope) return graphs;
    const key = scopeKey(scope);
    return graphs.filter((g) => scopeKey(g.scope) === key);
  }

  clear(): void {
    this.byId.clear();
    this.latestByScope.clear();
  }
}
