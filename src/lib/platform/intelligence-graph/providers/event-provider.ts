import { getEventAuditEntries } from "@/lib/platform/events/audit/audit";
import type {
  EdgeResolveOptions,
  GraphEdge,
  GraphNode,
  GraphProvider,
  GraphProviderContext,
  GraphSearchQuery,
} from "@/lib/platform/intelligence-graph/types";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";

/** Graph provider backed by the Event Engine — links platform events to referenced entities. */
export const eventGraphProvider: GraphProvider = {
  providerKey: "event",

  async resolveNode(
    _ctx: GraphProviderContext,
    entityType: string,
    entityId: string
  ): Promise<GraphNode | null> {
    if (entityType !== "platform_event" || !entityId) return null;

    return {
      nodeId: buildGraphNodeId("platform_event", entityType, entityId),
      nodeType: "platform_event",
      entityType,
      entityId,
      organizationId: null,
      schoolId: null,
      metadata: { providerKey: "event" },
    };
  },

  async resolveEdges(
    ctx: GraphProviderContext,
    node: GraphNode,
    _options?: EdgeResolveOptions
  ): Promise<GraphEdge[]> {
    if (node.nodeType === "entity") {
      const entries = getEventAuditEntries().filter(
        (entry) =>
          entry.envelope.entityType === node.entityType &&
          entry.envelope.entityId === node.entityId
      );

      return entries.map((entry) => ({
        edgeType: "event.references",
        sourceNode: buildGraphNodeId("platform_event", "platform_event", entry.eventId),
        targetNode: node.nodeId,
        direction: "directed" as const,
        weight: 0.5,
        effectiveDate: entry.recordedAt,
        endDate: null,
        metadata: {
          providerKey: "event",
          eventType: entry.eventType,
          eventId: entry.eventId,
          domain: entry.domain,
        },
      }));
    }

    if (node.nodeType === "platform_event") {
      const entry = getEventAuditEntries().find((e) => e.eventId === node.entityId);
      if (!entry) return [];

      return [
        {
          edgeType: "event.references",
          sourceNode: node.nodeId,
          targetNode: buildGraphNodeId(
            "entity",
            entry.envelope.entityType,
            entry.envelope.entityId
          ),
          direction: "directed",
          weight: 0.5,
          effectiveDate: entry.recordedAt,
          endDate: null,
          metadata: {
            providerKey: "event",
            eventType: entry.eventType,
            organizationId: entry.envelope.organizationId,
            schoolId: entry.envelope.schoolId,
          },
        },
      ];
    }

    return [];
  },

  async searchNodes(_ctx: GraphProviderContext, query: GraphSearchQuery): Promise<GraphNode[]> {
    const needle = query.query.toLowerCase();
    if (!needle) return [];

    return getEventAuditEntries()
      .filter(
        (entry) =>
          entry.eventType.toLowerCase().includes(needle) ||
          entry.summary.toLowerCase().includes(needle)
      )
      .slice(0, query.limit ?? 20)
      .map((entry) => ({
        nodeId: buildGraphNodeId("platform_event", "platform_event", entry.eventId),
        nodeType: "platform_event",
        entityType: "platform_event",
        entityId: entry.eventId,
        organizationId: entry.envelope.organizationId,
        schoolId: entry.envelope.schoolId,
        metadata: {
          providerKey: "event",
          eventType: entry.eventType,
          summary: entry.summary,
          subjectEntityType: entry.envelope.entityType,
          subjectEntityId: entry.envelope.entityId,
        },
      }));
  },
};
