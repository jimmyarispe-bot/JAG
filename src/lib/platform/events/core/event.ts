/**
 * Sprint 024 — core event model (aliases + helpers).
 * Runtime envelope remains PlatformEventEnvelope for backward compatibility.
 */

import type {
  EventContext,
  EventEnvelope,
  EventMetadata,
  EventResult,
  PlatformEventEnvelope,
} from "@/lib/platform/events/types";

export type {
  Event,
  EventContext,
  EventEnvelope,
  EventMetadata,
  EventResult,
  PlatformEventEnvelope,
} from "@/lib/platform/events/types";

export function toEventContext(envelope: PlatformEventEnvelope): EventContext {
  return {
    organizationId: envelope.organizationId,
    schoolId: envelope.schoolId,
    actorId: envelope.actorId,
    applicationId:
      typeof envelope.metadata.applicationId === "string"
        ? envelope.metadata.applicationId
        : null,
    correlationId: envelope.correlationId,
    requestId:
      typeof envelope.metadata.requestId === "string"
        ? envelope.metadata.requestId
        : null,
    category: envelope.metadata.category ?? null,
  };
}

export function asEventEnvelope(envelope: PlatformEventEnvelope): EventEnvelope {
  return envelope;
}
