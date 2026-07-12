/**
 * Executive Graph Analyzer — GraphSearch (Sprint 025).
 */

import type { GraphSearch as GraphSearchContract } from "@/lib/platform/intelligence/executive-graph/contracts";
import { incoming, outgoing } from "@/lib/platform/intelligence/executive-graph/model";
import type {
  Graph,
  GraphEdge,
  GraphNode,
  GraphSearchHit,
  GraphSearchRequest,
} from "@/lib/platform/intelligence/executive-graph/types";

/**
 * GraphSearch — neighborhood search and path find.
 */
export class GraphSearch implements GraphSearchContract {
  search(graph: Graph, request: GraphSearchRequest): GraphSearchHit[] {
    const query = (request.query ?? "").trim().toLowerCase();
    const limit = request.limit ?? 20;

    const hits: GraphSearchHit[] = [];

    for (const node of graph.nodes) {
      if (request.domain && node.domain !== request.domain) continue;
      if (request.kind && node.kind !== request.kind) continue;
      if (
        request.minCriticality !== undefined &&
        node.criticality < request.minCriticality
      ) {
        continue;
      }

      const matchedOn: string[] = [];
      if (!query) {
        matchedOn.push("all");
      } else {
        if (node.label.toLowerCase().includes(query)) matchedOn.push("label");
        if (node.key.toLowerCase().includes(query)) matchedOn.push("key");
        if (node.domain.toLowerCase().includes(query)) matchedOn.push("domain");
        if (String(node.status ?? "").toLowerCase().includes(query)) matchedOn.push("status");
      }

      if (matchedOn.length === 0) continue;

      hits.push({
        node,
        score: node.criticality + matchedOn.length * 0.05,
        matchedOn,
      });
    }

    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  neighborhood(
    graph: Graph,
    nodeId: string,
    depth = 1
  ): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodeIds = new Set<string>([nodeId]);
    const edgeIds = new Set<string>();
    let frontier = [nodeId];

    for (let d = 0; d < depth; d += 1) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const edge of [...outgoing(graph, id), ...incoming(graph, id)]) {
          edgeIds.add(edge.id);
          const other = edge.sourceId === id ? edge.targetId : edge.sourceId;
          if (!nodeIds.has(other)) {
            nodeIds.add(other);
            next.push(other);
          }
        }
      }
      frontier = next;
    }

    return {
      nodes: graph.nodes.filter((n) => nodeIds.has(n.id)),
      edges: graph.edges.filter((e) => edgeIds.has(e.id)),
    };
  }

  path(
    graph: Graph,
    fromId: string,
    toId: string,
    maxDepth = 6
  ): string[] | null {
    if (fromId === toId) return [fromId];

    const queue: string[][] = [[fromId]];
    const visited = new Set<string>([fromId]);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      if (current.length - 1 >= maxDepth) continue;
      const last = current[current.length - 1];
      for (const edge of outgoing(graph, last)) {
        if (visited.has(edge.targetId)) continue;
        const next = [...current, edge.targetId];
        if (edge.targetId === toId) return next;
        visited.add(edge.targetId);
        queue.push(next);
      }
    }

    return null;
  }
}
