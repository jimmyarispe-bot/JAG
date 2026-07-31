import { getNode, listEdges, listNodes } from "@/lib/platform/graph/registry";
import {
  findShortestPath,
  walkReachable,
  type TraversalDirection,
} from "@/lib/platform/graph/traversal";
import type {
  DependencyReport,
  GraphEdgeType,
  GraphNeighbor,
  GraphPath,
  GraphStats,
} from "@/lib/platform/graph/types";

export function directNeighbors(
  nodeId: string,
  options?: {
    direction?: TraversalDirection;
    edgeTypes?: GraphEdgeType[];
  }
): GraphNeighbor[] {
  const node = getNode(nodeId);
  if (!node) return [];

  const direction = options?.direction ?? "both";
  const typeSet = options?.edgeTypes
    ? new Set(options.edgeTypes)
    : undefined;
  const out: GraphNeighbor[] = [];

  if (direction === "outgoing" || direction === "both") {
    for (const edge of listEdges({ from: nodeId })) {
      if (typeSet && !typeSet.has(edge.type)) continue;
      const target = getNode(edge.to);
      if (!target) continue;
      out.push({ edge, node: target, direction: "outgoing" });
    }
  }

  if (direction === "incoming" || direction === "both") {
    for (const edge of listEdges({ to: nodeId })) {
      if (typeSet && !typeSet.has(edge.type)) continue;
      const source = getNode(edge.from);
      if (!source) continue;
      out.push({ edge, node: source, direction: "incoming" });
    }
  }

  return out.sort((a, b) => a.node.id.localeCompare(b.node.id));
}

/** Upstream = nodes that reach this node (incoming walk). */
export function upstreamDependencies(
  nodeId: string,
  options?: { edgeTypes?: GraphEdgeType[]; maxDepth?: number }
): string[] {
  return walkReachable(nodeId, {
    direction: "incoming",
    edgeTypes: options?.edgeTypes,
    maxDepth: options?.maxDepth,
  });
}

/** Downstream = nodes this node reaches (outgoing walk). */
export function downstreamImpact(
  nodeId: string,
  options?: { edgeTypes?: GraphEdgeType[]; maxDepth?: number }
): string[] {
  return walkReachable(nodeId, {
    direction: "outgoing",
    edgeTypes: options?.edgeTypes,
    maxDepth: options?.maxDepth,
  });
}

/** Transitive closure of reachable nodes in the chosen direction. */
export function transitiveClosure(
  nodeId: string,
  options?: {
    direction?: TraversalDirection;
    edgeTypes?: GraphEdgeType[];
    maxDepth?: number;
  }
): string[] {
  return walkReachable(nodeId, {
    direction: options?.direction ?? "outgoing",
    edgeTypes: options?.edgeTypes,
    maxDepth: options?.maxDepth,
  });
}

export function shortestRelationshipPath(
  fromId: string,
  toId: string,
  options?: {
    direction?: TraversalDirection;
    edgeTypes?: GraphEdgeType[];
    maxDepth?: number;
  }
): GraphPath | null {
  return findShortestPath(fromId, toId, options);
}

export function dependencyReport(nodeId: string): DependencyReport | null {
  if (!getNode(nodeId)) return null;
  return {
    nodeId,
    upstream: upstreamDependencies(nodeId),
    downstream: downstreamImpact(nodeId),
    directNeighbors: directNeighbors(nodeId),
  };
}

/**
 * If an application node is disabled, what breaks (downstream of OWNS/ENABLES)?
 */
export function impactIfApplicationDisabled(applicationKey: string): string[] {
  const nodeId = `application:${applicationKey}`;
  if (!getNode(nodeId)) return [];
  return downstreamImpact(nodeId);
}

/**
 * Downstream impact of a schema change.
 */
export function impactOfSchemaChange(schemaKey: string): string[] {
  const nodeId = `schema:${schemaKey}`;
  if (!getNode(nodeId)) return [];
  return downstreamImpact(nodeId);
}

export function graphStats(): GraphStats {
  const byKind: Record<string, number> = {};
  const byEdgeType: Record<string, number> = {};
  for (const node of listNodes()) {
    byKind[node.kind] = (byKind[node.kind] ?? 0) + 1;
  }
  for (const edge of listEdges()) {
    byEdgeType[edge.type] = (byEdgeType[edge.type] ?? 0) + 1;
  }
  return {
    nodes: listNodes().length,
    edges: listEdges().length,
    byKind,
    byEdgeType,
  };
}
