/**
 * Lightweight graph reasoning — neighborhood and simple paths.
 */

import type { UnifiedGraphSnapshot } from "@/lib/platform/knowledge-graph/graph-store/store";
import type { UnifiedGraphNode } from "@/lib/platform/knowledge-graph/entities/types";
import type { UnifiedGraphEdge } from "@/lib/platform/knowledge-graph/relationships/types";

export function getNeighborhood(
  graph: UnifiedGraphSnapshot,
  nodeId: string,
  depth = 1
): { nodes: UnifiedGraphNode[]; edges: UnifiedGraphEdge[] } {
  const nodeIds = new Set<string>([nodeId]);
  let frontier = new Set<string>([nodeId]);

  for (let d = 0; d < depth; d++) {
    const next = new Set<string>();
    for (const edge of graph.edges) {
      if (frontier.has(edge.from) && !nodeIds.has(edge.to)) {
        next.add(edge.to);
        nodeIds.add(edge.to);
      }
      if (frontier.has(edge.to) && !nodeIds.has(edge.from)) {
        next.add(edge.from);
        nodeIds.add(edge.from);
      }
    }
    frontier = next;
  }

  const nodes = graph.nodes.filter((n) => nodeIds.has(n.id));
  const edges = graph.edges.filter(
    (e) => nodeIds.has(e.from) && nodeIds.has(e.to)
  );
  return { nodes, edges };
}

export function findShortestPath(
  graph: UnifiedGraphSnapshot,
  fromId: string,
  toId: string
): string[] | null {
  if (fromId === toId) return [fromId];
  const adj = new Map<string, string[]>();
  for (const e of graph.edges) {
    adj.set(e.from, [...(adj.get(e.from) ?? []), e.to]);
    adj.set(e.to, [...(adj.get(e.to) ?? []), e.from]);
  }
  const queue = [fromId];
  const prev = new Map<string, string | null>([[fromId, null]]);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const next of adj.get(cur) ?? []) {
      if (prev.has(next)) continue;
      prev.set(next, cur);
      if (next === toId) {
        const path: string[] = [];
        let walk: string | null = toId;
        while (walk != null) {
          path.unshift(walk);
          walk = prev.get(walk) ?? null;
        }
        return path;
      }
      queue.push(next);
    }
  }
  return null;
}
