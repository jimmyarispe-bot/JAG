import { getEntityActivity } from "@/lib/platform/activity/query";
import type {
  EdgeResolveOptions,
  GraphEdge,
  GraphNode,
  GraphProvider,
  GraphProviderContext,
  GraphSearchQuery,
} from "@/lib/platform/intelligence-graph/types";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";

/** Graph provider backed by the Activity Engine — links activity events to entities. */
export const activityGraphProvider: GraphProvider = {
  providerKey: "activity",

  async resolveNode(
    _ctx: GraphProviderContext,
    entityType: string,
    entityId: string
  ): Promise<GraphNode | null> {
    if (entityType !== "activity_event" || !entityId) return null;

    return {
      nodeId: buildGraphNodeId("activity_event", entityType, entityId),
      nodeType: "activity_event",
      entityType,
      entityId,
      organizationId: null,
      schoolId: null,
      metadata: { providerKey: "activity" },
    };
  },

  async resolveEdges(
    ctx: GraphProviderContext,
    node: GraphNode,
    _options?: EdgeResolveOptions
  ): Promise<GraphEdge[]> {
    if (node.nodeType === "entity") {
      const activities = await getEntityActivity(ctx.supabase, node.entityType, node.entityId, {
        limit: 50,
      });

      return activities.map((activity) => ({
        edgeType: "activity.linked_to",
        sourceNode: buildGraphNodeId("activity_event", "activity_event", activity.id),
        targetNode: node.nodeId,
        direction: "directed" as const,
        weight: 0.5,
        effectiveDate: activity.occurred_at,
        endDate: null,
        metadata: {
          providerKey: "activity",
          eventType: activity.event_type,
          activityId: activity.id,
          title: activity.title,
        },
      }));
    }

    if (node.nodeType === "activity_event") {
      const { data } = await ctx.supabase
        .from("platform_activity_events")
        .select("*")
        .eq("id", node.entityId)
        .maybeSingle();

      if (!data) return [];

      return [
        {
          edgeType: "activity.linked_to",
          sourceNode: node.nodeId,
          targetNode: buildGraphNodeId("entity", data.entity_type, data.entity_id),
          direction: "directed",
          weight: 0.5,
          effectiveDate: data.occurred_at,
          endDate: null,
          metadata: {
            providerKey: "activity",
            eventType: data.event_type,
            activityId: data.id,
          },
        },
      ];
    }

    return [];
  },

  async searchNodes(ctx: GraphProviderContext, query: GraphSearchQuery): Promise<GraphNode[]> {
    const needle = query.query.toLowerCase();
    if (!needle) return [];

    let q = ctx.supabase
      .from("platform_activity_events")
      .select("id, entity_type, entity_id, organization_id, school_id, title, event_type")
      .ilike("title", `%${needle}%`)
      .limit(query.limit ?? 20);

    if (query.organizationId) q = q.eq("organization_id", query.organizationId);

    const { data } = await q;

    return (data ?? []).map((row) => ({
      nodeId: buildGraphNodeId("activity_event", "activity_event", row.id),
      nodeType: "activity_event",
      entityType: "activity_event",
      entityId: row.id,
      organizationId: row.organization_id,
      schoolId: row.school_id,
      metadata: {
        providerKey: "activity",
        title: row.title,
        eventType: row.event_type,
        subjectEntityType: row.entity_type,
        subjectEntityId: row.entity_id,
      },
    }));
  },
};
