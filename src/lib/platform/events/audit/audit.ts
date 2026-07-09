import type {
  EventAuditEntry,
  EventHandlerResult,
  PlatformEventEnvelope,
} from "@/lib/platform/events/types";

let auditSequence = 0;

/** Build an event audit entry — persistence is delegated to consuming modules. */
export function buildEventAuditEntry(
  envelope: PlatformEventEnvelope,
  input: {
    domain: string;
    dispatchMode: "sync" | "async";
    scope: "internal" | "external_webhook";
    subscriberResults: EventHandlerResult[];
    summary: string;
    metadata?: Record<string, unknown>;
  }
): EventAuditEntry {
  auditSequence += 1;
  return {
    auditId: `evta_${Date.now()}_${auditSequence}`,
    eventId: envelope.eventId,
    eventType: envelope.eventType,
    domain: input.domain,
    dispatchMode: input.dispatchMode,
    scope: input.scope,
    envelope,
    subscriberResults: input.subscriberResults,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    metadata: input.metadata,
  };
}

/** In-memory audit buffer — canonical persistence via platform_event_records (Wave 1). */
const EVENT_AUDIT_BUFFER: EventAuditEntry[] = [];

export function recordEventAuditEntry(entry: EventAuditEntry): void {
  EVENT_AUDIT_BUFFER.push(entry);
}

export function getEventAuditEntries(filters?: {
  eventId?: string;
  eventType?: string;
  correlationId?: string;
}): EventAuditEntry[] {
  let entries = [...EVENT_AUDIT_BUFFER];

  if (filters?.eventId) {
    entries = entries.filter((entry) => entry.eventId === filters.eventId);
  }
  if (filters?.eventType) {
    entries = entries.filter((entry) => entry.eventType === filters.eventType);
  }
  if (filters?.correlationId) {
    entries = entries.filter(
      (entry) => entry.envelope.correlationId === filters.correlationId
    );
  }

  return entries;
}

export function clearEventAuditBuffer(): void {
  EVENT_AUDIT_BUFFER.length = 0;
  auditSequence = 0;
}

/** All envelopes recorded in the audit buffer — used by replay interface. */
export function getAuditedEventEnvelopes(): PlatformEventEnvelope[] {
  return EVENT_AUDIT_BUFFER.map((entry) => entry.envelope);
}
