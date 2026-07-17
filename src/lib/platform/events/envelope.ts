import { EVENT_BUS_VERSION } from "@/lib/platform/events/version";
import type {
  EventMetadata,
  PlatformEventEnvelope,
  PublishEventInput,
} from "@/lib/platform/events/types";

let eventSequence = 0;

export function nextEventId(prefix = "evt"): string {
  eventSequence += 1;
  return `${prefix}_${Date.now()}_${eventSequence}`;
}

export function nextCorrelationId(prefix = "corr"): string {
  eventSequence += 1;
  return `${prefix}_${Date.now()}_${eventSequence}`;
}

export interface BuildEventEnvelopeInput extends PublishEventInput {
  definitionVersion: number;
  scope: "internal" | "external_webhook";
  dispatchMode: "sync" | "async";
}

/** Build a fully populated event envelope from publish input. */
export function buildEventEnvelope(input: BuildEventEnvelopeInput): PlatformEventEnvelope {
  const eventId = nextEventId();
  const correlationId = input.correlationId ?? nextCorrelationId();

  const metadata: EventMetadata = {
    ...input.metadata,
    deliveryMode: input.dispatchMode,
    scope: input.scope,
    busVersion: EVENT_BUS_VERSION,
    requestId: input.requestId ?? input.metadata?.requestId,
    applicationId: input.applicationId ?? input.metadata?.applicationId,
  };

  return {
    eventId,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    organizationId: input.organizationId ?? null,
    schoolId: input.schoolId ?? null,
    actorId: input.actorId ?? null,
    timestamp: new Date().toISOString(),
    payload: input.payload ?? {},
    metadata,
    version: input.definitionVersion,
    correlationId,
    causationId: input.causationId ?? null,
  };
}

export function resetEventEnvelopeSequence(): void {
  eventSequence = 0;
}
