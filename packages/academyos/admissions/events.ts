/**
 * Admissions events via frozen platform event bus.
 *
 * PER-AOS-EVENT-SOURCE: JagEventSourceModule has no "academyos" value.
 * Workaround: sourceModule "platform" + eventType "academyos.*".
 */

import { emitJagPlatformEvent } from "@/lib/jag-platform/events";

export function emitAdmissionsEvent(input: {
  organizationId: string;
  entityType: string;
  entityId: string;
  eventType: string;
  actor: string;
  metadata?: Record<string, string>;
}): void {
  emitJagPlatformEvent({
    organizationId: input.organizationId,
    sourceModule: "platform",
    entityType: input.entityType,
    entityId: input.entityId,
    eventType: input.eventType.startsWith("academyos.")
      ? input.eventType
      : `academyos.${input.eventType}`,
    actor: input.actor,
    metadata: input.metadata ?? {},
  });
}
