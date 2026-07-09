import { loadPersistedGraphEdges } from "@/lib/platform/intelligence-graph/persistence/records";
import { resolveGraphNode } from "@/lib/platform/intelligence-graph/resolver/node-resolver";
import type {
  GraphEdge,
  GraphNode,
  GraphProviderContext,
} from "@/lib/platform/intelligence-graph/types";

export interface GraphRelationshipQuery {
  nodeId: string;
  direction?: "outgoing" | "incoming" | "both";
  edgeTypes?: string[];
  providerKey?: string;
  limit?: number;
}

export interface GraphRelationshipResult {
  node: GraphNode | null;
  edges: GraphEdge[];
  relatedNodeIds: string[];
}

/** Query persisted and provider-resolved relationships for a graph node. */
export async function queryGraphRelationships(
  ctx: GraphProviderContext,
  query: GraphRelationshipQuery
): Promise<GraphRelationshipResult> {
  const node = await resolveGraphNode(ctx, { nodeId: query.nodeId });
  const edges = await loadPersistedGraphEdges(ctx.supabase, {
    nodeId: query.nodeId,
    direction: query.direction ?? "both",
    edgeTypes: query.edgeTypes,
    providerKey: query.providerKey,
    limit: query.limit ?? 100,
  });

  const relatedNodeIds = new Set<string>();
  for (const edge of edges) {
    if (edge.sourceNode === query.nodeId) relatedNodeIds.add(edge.targetNode);
    if (edge.targetNode === query.nodeId) relatedNodeIds.add(edge.sourceNode);
  }

  return {
    node,
    edges,
    relatedNodeIds: [...relatedNodeIds],
  };
}
