import { getEventAuditEntries } from "@/lib/platform/events/audit/audit";
import { loadPersistedEventAuditEntries } from "@/lib/platform/events/persistence/records";
import type {
  EdgeResolveOptions,
  GraphEdge,
  GraphNode,
  GraphProvider,
  GraphProviderContext,
  GraphSearchQuery,
} from "@/lib/platform/intelligence-graph/types";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";
import { loadPersistedGraphEdges } from "@/lib/platform/intelligence-graph/persistence/records";

async function loadEventEntriesForEntity(
  ctx: GraphProviderContext,
  entityType: string,
  entityId: string
) {
  const persisted = await loadPersistedEventAuditEntries(ctx.supabase, {
    entityType,
    entityId,
    limit: 100,
  });
  if (persisted.length > 0) return persisted;

  return getEventAuditEntries().filter(
    (entry) =>
      entry.envelope.entityType === entityType && entry.envelope.entityId === entityId
  );
}

/** Graph provider backed by the Event Engine — links platform events to referenced entities. */
export const eventGraphProvider: GraphProvider = {
  providerKey: "event",

  async resolveNode(
    ctx: GraphProviderContext,
    entityType: string,
    entityId: string
  ): Promise<GraphNode | null> {
    if (entityType !== "platform_event" || !entityId) return null;

    const persisted = await loadPersistedEventAuditEntries(ctx.supabase, {
      eventId: entityId,
      limit: 1,
    });
    const entry = persisted[0] ?? getEventAuditEntries({ eventId: entityId })[0];

    return {
      nodeId: buildGraphNodeId("platform_event", entityType, entityId),
      nodeType: "platform_event",
      entityType,
      entityId,
      organizationId: entry?.envelope.organizationId ?? ctx.organizationId ?? null,
      schoolId: entry?.envelope.schoolId ?? ctx.schoolId ?? null,
      metadata: {
        providerKey: "event",
        eventType: entry?.eventType,
        summary: entry?.summary,
      },
    };
  },

  async resolveEdges(
    ctx: GraphProviderContext,
    node: GraphNode,
    options?: EdgeResolveOptions
  ): Promise<GraphEdge[]> {
    const persistedEdges = await loadPersistedGraphEdges(ctx.supabase, {
      nodeId: node.nodeId,
      direction: options?.direction ?? "both",
      providerKey: "event",
      limit: 200,
    });

    if (node.nodeType === "entity") {
      const entries = await loadEventEntriesForEntity(ctx, node.entityType, node.entityId);

      const derived = entries.map((entry) => ({
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

      return [...persistedEdges, ...derived];
    }

    if (node.nodeType === "platform_event") {
      const persisted = await loadPersistedEventAuditEntries(ctx.supabase, {
        eventId: node.entityId,
        limit: 1,
      });
      const entry = persisted[0] ?? getEventAuditEntries({ eventId: node.entityId })[0];
      if (!entry) return persistedEdges;

      return [
        ...persistedEdges,
        {
          edgeType: "event.references",
          sourceNode: node.nodeId,
          targetNode: buildGraphNodeId(
            "entity",
            entry.envelope.entityType,
            entry.envelope.entityId
          ),
          direction: "directed" as const,
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

    return persistedEdges;
  },

  async searchNodes(ctx: GraphProviderContext, query: GraphSearchQuery): Promise<GraphNode[]> {
    const needle = query.query.toLowerCase();
    if (!needle) return [];

    const persisted = await loadPersistedEventAuditEntries(ctx.supabase, { limit: query.limit ?? 20 });
    const entries =
      persisted.length > 0 ?
        persisted
      : getEventAuditEntries().slice(0, query.limit ?? 20);

    return entries
      .filter(
        (entry) =>
          entry.eventType.toLowerCase().includes(needle) ||
          entry.summary.toLowerCase().includes(needle)
      )
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
