import { getGraphRegistrySnapshot } from "@/lib/platform/intelligence-graph/registry/registry";
import { queryGraphNeighborhood } from "@/lib/platform/intelligence-graph/query/neighborhood";
import { resolveGraphNode } from "@/lib/platform/intelligence-graph/resolver/node-resolver";
import type {
  GraphProviderContext,
  GraphSnapshot,
  GraphSnapshotQuery,
} from "@/lib/platform/intelligence-graph/types";
import { dedupeGraphEdges, dedupeGraphNodes } from "@/lib/platform/intelligence-graph/utils";

/** Graph Snapshot API — materialize a subgraph around a root node at a point in time. */
export async function captureGraphSnapshot(
  ctx: GraphProviderContext,
  query: GraphSnapshotQuery
): Promise<GraphSnapshot> {
  const depth = query.depth ?? 2;
  const rootNode = await resolveGraphNode(ctx, { nodeId: query.rootNodeId });

  if (!rootNode) {
    return {
      rootNodeId: query.rootNodeId,
      depth,
      nodes: [],
      edges: [],
      providers: query.includeProviders ?? getGraphRegistrySnapshot().providers,
      capturedAt: new Date().toISOString(),
      truncated: false,
    };
  }

  const neighborhood = await queryGraphNeighborhood(ctx, {
    nodeId: query.rootNodeId,
    depth,
    nodeFilter: query.nodeFilter,
    edgeFilter: query.edgeFilter,
    limit: query.limit,
  });

  const providers =
    query.includeProviders ?? getGraphRegistrySnapshot().providers;

  return {
    rootNodeId: query.rootNodeId,
    depth,
    nodes: dedupeGraphNodes([rootNode, ...neighborhood.nodes]),
    edges: dedupeGraphEdges(neighborhood.edges),
    providers,
    capturedAt: new Date().toISOString(),
    truncated: neighborhood.truncated,
  };
}

/** Return registry metadata alongside a graph snapshot for diagnostics. */
export async function captureGraphSnapshotWithRegistry(
  ctx: GraphProviderContext,
  query: GraphSnapshotQuery
): Promise<GraphSnapshot & { registry: ReturnType<typeof getGraphRegistrySnapshot> }> {
  const snapshot = await captureGraphSnapshot(ctx, query);
  return {
    ...snapshot,
    registry: getGraphRegistrySnapshot(),
  };
}
