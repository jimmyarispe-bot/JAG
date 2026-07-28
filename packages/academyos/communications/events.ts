/**
 * Communications events via frozen platform event bus.
 * PER-AOS-EVENT-SOURCE: sourceModule "platform" + academyos.communications.* types.
 */

import { emitJagPlatformEvent } from "@/lib/jag-platform/events";

export function emitCommunicationsEvent(input: {
  organizationId: string;
  entityType: string;
  entityId: string;
  eventType: string;
  actor: string;
  metadata?: Record<string, string>;
}): void {
  const eventType = input.eventType.startsWith("academyos.")
    ? input.eventType
    : `academyos.communications.${input.eventType}`;
  emitJagPlatformEvent({
    organizationId: input.organizationId,
    sourceModule: "platform",
    entityType: input.entityType,
    entityId: input.entityId,
    eventType,
    actor: input.actor,
    metadata: input.metadata ?? {},
  });
}
