import { getNode, listEdges } from "@/lib/platform/graph/registry";
import type { GraphEdge, GraphEdgeType, GraphPath } from "@/lib/platform/graph/types";

export type TraversalDirection = "outgoing" | "incoming" | "both";

function edgesFrom(nodeId: string, types?: ReadonlySet<GraphEdgeType>): GraphEdge[] {
  return listEdges({ from: nodeId }).filter(
    (e) => !types || types.has(e.type)
  );
}

function edgesTo(nodeId: string, types?: ReadonlySet<GraphEdgeType>): GraphEdge[] {
  return listEdges({ to: nodeId }).filter(
    (e) => !types || types.has(e.type)
  );
}

/**
 * BFS walk collecting reachable node ids.
 */
export function walkReachable(
  startId: string,
  options?: {
    direction?: TraversalDirection;
    edgeTypes?: GraphEdgeType[];
    maxDepth?: number;
  }
): string[] {
  if (!getNode(startId)) return [];
  const direction = options?.direction ?? "outgoing";
  const typeSet = options?.edgeTypes
    ? new Set(options.edgeTypes)
    : undefined;
  const maxDepth = options?.maxDepth ?? Number.POSITIVE_INFINITY;

  const visited = new Set<string>([startId]);
  const queue: Array<{ id: string; depth: number }> = [
    { id: startId, depth: 0 },
  ];

  while (queue.length) {
    const current = queue.shift()!;
    if (current.depth >= maxDepth) continue;

    const nextEdges: GraphEdge[] = [];
    if (direction === "outgoing" || direction === "both") {
      nextEdges.push(...edgesFrom(current.id, typeSet));
    }
    if (direction === "incoming" || direction === "both") {
      nextEdges.push(...edgesTo(current.id, typeSet));
    }

    for (const edge of nextEdges) {
      const nextId =
        edge.from === current.id ? edge.to : edge.from;
      if (visited.has(nextId)) continue;
      if (!getNode(nextId)) continue;
      visited.add(nextId);
      queue.push({ id: nextId, depth: current.depth + 1 });
    }
  }

  return [...visited].filter((id) => id !== startId).sort();
}

/**
 * Shortest path via BFS (unweighted).
 */
export function findShortestPath(
  fromId: string,
  toId: string,
  options?: {
    direction?: TraversalDirection;
    edgeTypes?: GraphEdgeType[];
    maxDepth?: number;
  }
): GraphPath | null {
  if (!getNode(fromId) || !getNode(toId)) return null;
  if (fromId === toId) {
    return { nodes: [fromId], edges: [], length: 0 };
  }

  const direction = options?.direction ?? "outgoing";
  const typeSet = options?.edgeTypes
    ? new Set(options.edgeTypes)
    : undefined;
  const maxDepth = options?.maxDepth ?? 32;

  const parent = new Map<string, { nodeId: string; edgeId: string }>();
  const visited = new Set<string>([fromId]);
  const queue: Array<{ id: string; depth: number }> = [
    { id: fromId, depth: 0 },
  ];

  while (queue.length) {
    const current = queue.shift()!;
    if (current.depth >= maxDepth) continue;

    const nextEdges: GraphEdge[] = [];
    if (direction === "outgoing" || direction === "both") {
      nextEdges.push(...edgesFrom(current.id, typeSet));
    }
    if (direction === "incoming" || direction === "both") {
      nextEdges.push(...edgesTo(current.id, typeSet));
    }

    for (const edge of nextEdges) {
      const nextId = edge.from === current.id ? edge.to : edge.from;
      if (visited.has(nextId)) continue;
      if (!getNode(nextId)) continue;
      visited.add(nextId);
      parent.set(nextId, { nodeId: current.id, edgeId: edge.id });
      if (nextId === toId) {
        return reconstructPath(fromId, toId, parent);
      }
      queue.push({ id: nextId, depth: current.depth + 1 });
    }
  }

  return null;
}

function reconstructPath(
  fromId: string,
  toId: string,
  parent: Map<string, { nodeId: string; edgeId: string }>
): GraphPath {
  const nodes: string[] = [toId];
  const edges: string[] = [];
  let cursor = toId;
  while (cursor !== fromId) {
    const step = parent.get(cursor);
    if (!step) break;
    edges.unshift(step.edgeId);
    nodes.unshift(step.nodeId);
    cursor = step.nodeId;
  }
  return { nodes, edges, length: edges.length };
}

/**
 * Detect directed cycles among a subset of edge types.
 */
export function findDirectedCycles(
  edgeTypes?: GraphEdgeType[]
): string[][] {
  const typeSet = edgeTypes ? new Set(edgeTypes) : undefined;
  const adjacency = new Map<string, string[]>();

  for (const edge of listEdges()) {
    if (typeSet && !typeSet.has(edge.type)) continue;
    const list = adjacency.get(edge.from) ?? [];
    list.push(edge.to);
    adjacency.set(edge.from, list);
  }

  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  function dfs(node: string): void {
    if (visited.has(node)) return;
    if (visiting.has(node)) {
      const idx = stack.indexOf(node);
      if (idx >= 0) cycles.push(stack.slice(idx).concat(node));
      return;
    }
    visiting.add(node);
    stack.push(node);
    for (const next of adjacency.get(node) ?? []) {
      dfs(next);
    }
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }

  for (const node of adjacency.keys()) {
    dfs(node);
  }
  return cycles;
}
