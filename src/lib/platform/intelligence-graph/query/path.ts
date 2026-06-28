import { resolveGraphEdges } from "@/lib/platform/intelligence-graph/resolver/edge-resolver";
import { resolveGraphNode } from "@/lib/platform/intelligence-graph/resolver/node-resolver";
import type {
  GraphEdge,
  GraphNode,
  GraphPathQuery,
  GraphPathResult,
  GraphProviderContext,
} from "@/lib/platform/intelligence-graph/types";
import {
  matchesEdgeFilter,
  matchesNodeFilter,
} from "@/lib/platform/intelligence-graph/utils";

/** Path Query API — shortest path between two nodes using unweighted BFS. */
export async function queryGraphPath(
  ctx: GraphProviderContext,
  query: GraphPathQuery
): Promise<GraphPathResult> {
  const maxDepth = query.maxDepth ?? 10;
  const sourceNode = await resolveGraphNode(ctx, { nodeId: query.sourceNodeId });
  const targetNode = await resolveGraphNode(ctx, { nodeId: query.targetNodeId });

  if (!sourceNode || !targetNode) {
    return {
      found: false,
      sourceNodeId: query.sourceNodeId,
      targetNodeId: query.targetNodeId,
      path: [],
      edges: [],
      totalWeight: 0,
    };
  }

  if (query.sourceNodeId === query.targetNodeId) {
    return {
      found: true,
      sourceNodeId: query.sourceNodeId,
      targetNodeId: query.targetNodeId,
      path: [sourceNode],
      edges: [],
      totalWeight: 0,
    };
  }

  const queue: GraphNode[] = [sourceNode];
  const visited = new Set<string>([sourceNode.nodeId]);
  const parentNode = new Map<string, string>();
  const parentEdge = new Map<string, GraphEdge>();
  const depthByNode = new Map<string, number>([[sourceNode.nodeId, 0]]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const depth = depthByNode.get(current.nodeId) ?? 0;

    if (depth >= maxDepth) continue;

    const edges = await resolveGraphEdges(ctx, {
      node: current,
      edgeFilter: query.edgeFilter,
    });

    const filteredEdges = query.edgeFilter
      ? edges.filter((edge) => matchesEdgeFilter(edge, query.edgeFilter))
      : edges;

    for (const edge of filteredEdges) {
      const neighborId =
        edge.sourceNode === current.nodeId ? edge.targetNode : edge.sourceNode;

      if (visited.has(neighborId)) continue;

      const neighbor = await resolveGraphNode(ctx, { nodeId: neighborId });
      if (!neighbor) continue;
      if (!matchesNodeFilter(neighbor, query.nodeFilter)) continue;

      visited.add(neighborId);
      parentNode.set(neighborId, current.nodeId);
      parentEdge.set(neighborId, edge);
      depthByNode.set(neighborId, depth + 1);
      queue.push(neighbor);

      if (neighborId === query.targetNodeId) {
        const path: GraphNode[] = [];
        const pathEdges: GraphEdge[] = [];
        let cursor: string | undefined = neighborId;
        let totalWeight = 0;

        while (cursor) {
          const node = await resolveGraphNode(ctx, { nodeId: cursor });
          if (node) path.unshift(node);
          const edge = parentEdge.get(cursor);
          if (edge) {
            pathEdges.unshift(edge);
            totalWeight += edge.weight;
          }
          cursor = parentNode.get(cursor);
        }

        return {
          found: true,
          sourceNodeId: query.sourceNodeId,
          targetNodeId: query.targetNodeId,
          path,
          edges: pathEdges,
          totalWeight,
        };
      }
    }
  }

  return {
    found: false,
    sourceNodeId: query.sourceNodeId,
    targetNodeId: query.targetNodeId,
    path: [],
    edges: [],
    totalWeight: 0,
  };
}
