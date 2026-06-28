import { getEntityTags } from "@/lib/platform/tags/query";
import type {
  EdgeResolveOptions,
  GraphEdge,
  GraphNode,
  GraphProvider,
  GraphProviderContext,
  GraphSearchQuery,
} from "@/lib/platform/intelligence-graph/types";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";

/** Graph provider backed by the Tag Engine — links tags to entities they are applied to. */
export const tagGraphProvider: GraphProvider = {
  providerKey: "tag",

  async resolveNode(
    _ctx: GraphProviderContext,
    entityType: string,
    entityId: string
  ): Promise<GraphNode | null> {
    if (entityType !== "tag" || !entityId) return null;

    return {
      nodeId: buildGraphNodeId("tag", entityType, entityId),
      nodeType: "tag",
      entityType,
      entityId,
      organizationId: null,
      schoolId: null,
      metadata: { providerKey: "tag" },
    };
  },

  async resolveEdges(
    ctx: GraphProviderContext,
    node: GraphNode,
    _options?: EdgeResolveOptions
  ): Promise<GraphEdge[]> {
    if (node.nodeType === "entity") {
      const tags = await getEntityTags(ctx.supabase, node.entityType, node.entityId);

      return tags.map((entityTag) => ({
        edgeType: "tag.applied_to",
        sourceNode: buildGraphNodeId("tag", "tag", entityTag.tag_id),
        targetNode: node.nodeId,
        direction: "directed" as const,
        weight: 0.25,
        effectiveDate: entityTag.applied_at,
        endDate: entityTag.expires_at,
        metadata: {
          providerKey: "tag",
          tagId: entityTag.tag_id,
          slug: entityTag.platform_tags?.slug,
          label: entityTag.platform_tags?.label,
        },
      }));
    }

    if (node.nodeType === "tag") {
      const { data } = await ctx.supabase
        .from("platform_entity_tags")
        .select("entity_type, entity_id, applied_at, expires_at, organization_id")
        .eq("tag_id", node.entityId)
        .limit(50);

      return (data ?? []).map((row) => ({
        edgeType: "tag.applied_to",
        sourceNode: node.nodeId,
        targetNode: buildGraphNodeId("entity", row.entity_type, row.entity_id),
        direction: "directed",
        weight: 0.25,
        effectiveDate: row.applied_at,
        endDate: row.expires_at,
        metadata: {
          providerKey: "tag",
          tagId: node.entityId,
          organizationId: row.organization_id,
        },
      }));
    }

    return [];
  },

  async searchNodes(ctx: GraphProviderContext, query: GraphSearchQuery): Promise<GraphNode[]> {
    const needle = query.query.toLowerCase();
    if (!needle || !query.organizationId) return [];

    const { data } = await ctx.supabase
      .from("platform_tags")
      .select("id, organization_id, slug, label")
      .eq("organization_id", query.organizationId)
      .or(`label.ilike.%${needle}%,slug.ilike.%${needle}%`)
      .limit(query.limit ?? 20);

    return (data ?? []).map((row) => ({
      nodeId: buildGraphNodeId("tag", "tag", row.id),
      nodeType: "tag",
      entityType: "tag",
      entityId: row.id,
      organizationId: row.organization_id,
      schoolId: null,
      metadata: {
        providerKey: "tag",
        slug: row.slug,
        label: row.label,
      },
    }));
  },
};
