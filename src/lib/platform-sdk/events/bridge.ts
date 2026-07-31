/**
 * Event SDK bridge — publishes through existing Jag platform event bus.
 */

import {
  emitJagPlatformEvent,
  type JagEventSourceModule,
  type JagPlatformEvent,
} from "@/lib/jag-platform/events";
import type {
  EventEnvelope,
  EventPublisher,
  PlatformEvent,
} from "@/lib/platform-sdk/events/types";

export function toPlatformEvent(event: JagPlatformEvent): PlatformEvent {
  return {
    eventId: event.eventId,
    organizationId: event.organizationId,
    sourceModule: event.sourceModule,
    entityType: event.entityType,
    entityId: event.entityId,
    eventType: event.eventType,
    actor: event.actor,
    timestamp: event.timestamp,
    correlationId: event.correlationId,
    metadata: event.metadata,
  };
}

export function createSdkEventPublisher(): EventPublisher {
  return {
    publish(event) {
      emitJagPlatformEvent({
        organizationId: event.organizationId,
        sourceModule: event.sourceModule as JagEventSourceModule,
        entityType: event.entityType,
        entityId: event.entityId,
        eventType: event.eventType,
        actor: event.actor,
        correlationId: event.correlationId,
        metadata: event.metadata,
      });
    },
    publishEnvelope(envelope) {
      this.publish({
        ...envelope.event,
        metadata: {
          ...envelope.event.metadata,
          schemaVersion: envelope.schemaVersion,
          ...Object.fromEntries(
            Object.entries(envelope.payload as Record<string, unknown>).map(
              ([k, v]) => [k, String(v)]
            )
          ),
        },
      });
    },
  };
}

export type { EventEnvelope, PlatformEvent };
