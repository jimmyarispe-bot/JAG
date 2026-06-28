import { getGraphNodeDefinition } from "@/lib/platform/intelligence-graph/registry/registry";
import { getAllGraphProviders, getGraphProvider } from "@/lib/platform/intelligence-graph/registry/node-registry";
import type {
  GraphNode,
  GraphProviderContext,
} from "@/lib/platform/intelligence-graph/types";
import { buildGraphNodeId, parseGraphNodeId } from "@/lib/platform/intelligence-graph/utils";

export interface ResolveGraphNodeInput {
  nodeId?: string;
  nodeType?: string;
  entityType?: string;
  entityId?: string;
}

/** Resolve a graph node by id or by type + entity coordinates. */
export async function resolveGraphNode(
  ctx: GraphProviderContext,
  input: ResolveGraphNodeInput
): Promise<GraphNode | null> {
  let nodeType = input.nodeType;
  let entityType = input.entityType;
  let entityId = input.entityId;

  if (input.nodeId) {
    const parsed = parseGraphNodeId(input.nodeId);
    if (!parsed) return null;
    nodeType = parsed.nodeType;
    entityType = parsed.entityType;
    entityId = parsed.entityId;
  }

  if (!nodeType || !entityType || !entityId) return null;

  const definition = getGraphNodeDefinition(nodeType);
  const providerKey = definition?.providerKey;

  if (providerKey) {
    const provider = getGraphProvider(providerKey);
    if (provider) {
      const node = await provider.resolveNode(ctx, entityType, entityId);
      if (node) return node;
    }
  }

  for (const provider of getAllGraphProviders()) {
    const node = await provider.resolveNode(ctx, entityType, entityId);
    if (node) return node;
  }

  if (nodeType === "entity") {
    return {
      nodeId: buildGraphNodeId(nodeType, entityType, entityId),
      nodeType,
      entityType,
      entityId,
      organizationId: ctx.organizationId ?? null,
      schoolId: ctx.schoolId ?? null,
      metadata: { resolved: "fallback" },
    };
  }

  return null;
}

/** Resolve multiple graph nodes in parallel. */
export async function resolveGraphNodes(
  ctx: GraphProviderContext,
  inputs: ResolveGraphNodeInput[]
): Promise<GraphNode[]> {
  const results = await Promise.all(inputs.map((input) => resolveGraphNode(ctx, input)));
  return results.filter((node): node is GraphNode => node !== null);
}
