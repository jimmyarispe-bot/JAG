import type { EventAuditEntry } from "@/lib/platform/events/types";
import { recordGraphEdges } from "@/lib/platform/intelligence-graph/persistence/records";
import type { RecordGraphEdgeInput } from "@/lib/platform/intelligence-graph/persistence/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { buildGraphNodeId } from "@/lib/platform/intelligence-graph/utils";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Persist graph edges when an event is recorded — Event Engine integration. */
export async function syncEventGraphEdges(
  supabase: AuthClient,
  entry: EventAuditEntry
): Promise<void> {
  const envelope = entry.envelope;
  const edges: RecordGraphEdgeInput[] = [
    {
      edgeType: "event.references",
      sourceNodeId: buildGraphNodeId("platform_event", "platform_event", entry.eventId),
      targetNodeId: buildGraphNodeId("entity", envelope.entityType, envelope.entityId),
      providerKey: "event",
      weight: 0.5,
      organizationId: envelope.organizationId,
      schoolId: envelope.schoolId,
      effectiveDate: entry.recordedAt,
      metadata: {
        eventType: entry.eventType,
        eventId: entry.eventId,
        domain: entry.domain,
      },
    },
  ];

  await recordGraphEdges(supabase, edges);
}
