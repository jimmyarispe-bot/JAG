import { getAllGraphNodeDefinitions } from "@/lib/platform/intelligence-graph/registry/node-registry";
import { loadPersistedGraphEdges } from "@/lib/platform/intelligence-graph/persistence/records";
import type {
  EdgeResolveOptions,
  GraphEdge,
  GraphNode,
  GraphProvider,
  GraphProviderContext,
} from "@/lib/platform/intelligence-graph/types";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";

function resolveNodeType(entityType: string): string {
  const definition = getAllGraphNodeDefinitions().find(
    (def) => def.entityTypes?.includes(entityType) || def.entityTypes?.includes("*")
  );
  return definition?.nodeType ?? "entity";
}

/** Primary persisted graph provider — canonical edges from platform_graph_edges. */
export const persistedGraphProvider: GraphProvider = {
  providerKey: "persisted",

  async resolveNode(
    ctx: GraphProviderContext,
    entityType: string,
    entityId: string
  ): Promise<GraphNode | null> {
    if (!entityType || !entityId) return null;

    const nodeType = resolveNodeType(entityType);

    return {
      nodeId: buildGraphNodeId(nodeType, entityType, entityId),
      nodeType,
      entityType,
      entityId,
      organizationId: ctx.organizationId ?? null,
      schoolId: ctx.schoolId ?? null,
      metadata: {
        providerKey: "persisted",
        referenceOnly: true,
      },
    };
  },

  async resolveEdges(
    ctx: GraphProviderContext,
    node: GraphNode,
    options?: EdgeResolveOptions
  ): Promise<GraphEdge[]> {
    const direction = options?.direction ?? "both";
    const outgoing =
      direction === "incoming" ?
        []
      : await loadPersistedGraphEdges(ctx.supabase, {
          sourceNodeId: node.nodeId,
          limit: 200,
        });

    const incoming =
      direction === "outgoing" ?
        []
      : await loadPersistedGraphEdges(ctx.supabase, {
          targetNodeId: node.nodeId,
          limit: 200,
        });

    return [...outgoing, ...incoming];
  },
};
