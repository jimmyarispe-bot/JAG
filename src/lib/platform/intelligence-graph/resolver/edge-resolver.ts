import { getGraphEdgeDefinitionsByProvider } from "@/lib/platform/intelligence-graph/registry/edge-registry";
import { getAllGraphProviders, getGraphProvider } from "@/lib/platform/intelligence-graph/registry/node-registry";
import { resolveGraphNode } from "@/lib/platform/intelligence-graph/resolver/node-resolver";
import type {
  EdgeResolveOptions,
  GraphEdge,
  GraphNode,
  GraphProviderContext,
  GraphProviderKey,
} from "@/lib/platform/intelligence-graph/types";
import {
  dedupeGraphEdges,
  matchesEdgeFilter,
  normalizeFilterValues,
  parseGraphNodeId,
} from "@/lib/platform/intelligence-graph/utils";

export interface ResolveGraphEdgesInput {
  node: GraphNode;
  direction?: EdgeResolveOptions["direction"];
  edgeFilter?: EdgeResolveOptions["edgeFilter"];
  providerKeys?: GraphProviderKey | GraphProviderKey[];
}

/** Resolve all edges for a graph node by delegating to registered platform providers. */
export async function resolveGraphEdges(
  ctx: GraphProviderContext,
  input: ResolveGraphEdgesInput
): Promise<GraphEdge[]> {
  const providerKeys =
    normalizeFilterValues(input.providerKeys) ??
    normalizeFilterValues(input.edgeFilter?.providerKeys);

  const providers = providerKeys
    ? providerKeys
        .map((key) => getGraphProvider(key))
        .filter((provider): provider is NonNullable<typeof provider> => provider !== undefined)
    : getAllGraphProviders();

  const options: EdgeResolveOptions = {
    direction: input.direction ?? "both",
    edgeFilter: input.edgeFilter,
  };

  const edgeLists = await Promise.all(
    providers.map((provider) => provider.resolveEdges(ctx, input.node, options))
  );

  let edges = dedupeGraphEdges(edgeLists.flat());

  if (input.edgeFilter) {
    edges = edges.filter((edge) => matchesEdgeFilter(edge, input.edgeFilter));
  }

  return edges;
}

/** Resolve edges for a node by id — resolves the node first if needed. */
export async function resolveGraphEdgesByNodeId(
  ctx: GraphProviderContext,
  nodeId: string,
  options?: Omit<ResolveGraphEdgesInput, "node">
): Promise<{ node: GraphNode | null; edges: GraphEdge[] }> {
  const parsed = parseGraphNodeId(nodeId);
  if (!parsed) return { node: null, edges: [] };

  const node = await resolveGraphNode(ctx, { nodeId });
  if (!node) return { node: null, edges: [] };

  const edges = await resolveGraphEdges(ctx, { node, ...options });
  return { node, edges };
}

/** List edge type definitions available for a provider key. */
export function getProviderEdgeTypes(providerKey: GraphProviderKey): string[] {
  return getGraphEdgeDefinitionsByProvider(providerKey).map((def) => def.edgeType);
}
