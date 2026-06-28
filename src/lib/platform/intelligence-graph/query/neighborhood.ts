import { traverseGraph } from "@/lib/platform/intelligence-graph/traversal/traversal-engine";
import type {
  GraphNeighborhoodQuery,
  GraphNeighborhoodResult,
  GraphProviderContext,
} from "@/lib/platform/intelligence-graph/types";

/** Neighborhood Query API — nodes and edges within N hops of a center node. */
export async function queryGraphNeighborhood(
  ctx: GraphProviderContext,
  query: GraphNeighborhoodQuery
): Promise<GraphNeighborhoodResult> {
  const depth = query.depth ?? 1;

  const result = await traverseGraph(ctx, query.nodeId, {
    strategy: "breadth_first",
    maxDepth: depth,
    nodeFilter: query.nodeFilter,
    edgeFilter: query.edgeFilter,
    limit: query.limit,
  });

  return {
    centerNodeId: query.nodeId,
    depth,
    nodes: result.nodes,
    edges: result.edges,
    truncated: result.truncated,
  };
}
