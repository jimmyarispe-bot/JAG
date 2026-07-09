import type {
  EventAuditEntry,
  EventHandlerResult,
  PlatformEventEnvelope,
} from "@/lib/platform/events/types";

export interface PlatformEventRecordRow {
  id: string;
  event_id: string;
  audit_id: string | null;
  event_type: string;
  domain: string;
  dispatch_mode: "sync" | "async";
  scope: "internal" | "external_webhook";
  entity_type: string;
  entity_id: string;
  organization_id: string | null;
  school_id: string | null;
  actor_user_id: string | null;
  correlation_id: string;
  causation_id: string | null;
  envelope_version: number;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  envelope: PlatformEventEnvelope;
  subscriber_results: EventHandlerResult[];
  summary: string;
  occurred_at: string;
  recorded_at: string;
}

export interface PersistEventAuditInput {
  entry: EventAuditEntry;
}

export interface ListPlatformEventRecordsFilters {
  eventId?: string;
  eventType?: string;
  entityType?: string;
  entityId?: string;
  correlationId?: string;
  schoolId?: string;
  organizationId?: string;
  fromTimestamp?: string;
  toTimestamp?: string;
  limit?: number;
}

export function eventAuditEntryToRow(entry: EventAuditEntry): Omit<PlatformEventRecordRow, "id" | "recorded_at"> {
  const envelope = entry.envelope;
  return {
    event_id: entry.eventId,
    audit_id: entry.auditId,
    event_type: entry.eventType,
    domain: entry.domain,
    dispatch_mode: entry.dispatchMode,
    scope: entry.scope,
    entity_type: envelope.entityType,
    entity_id: envelope.entityId,
    organization_id: coerceUuid(envelope.organizationId),
    school_id: coerceUuid(envelope.schoolId),
    actor_user_id: coerceUuid(envelope.actorId),
    correlation_id: envelope.correlationId,
    causation_id: envelope.causationId,
    envelope_version: envelope.version,
    payload: envelope.payload,
    metadata: {
      ...(entry.metadata ?? {}),
      ...(envelope.metadata ?? {}),
    },
    envelope,
    subscriber_results: entry.subscriberResults,
    summary: entry.summary,
    occurred_at: envelope.timestamp,
  };
}

export function rowToEventAuditEntry(row: PlatformEventRecordRow): EventAuditEntry {
  return {
    auditId: row.audit_id ?? `evta_db_${row.id}`,
    eventId: row.event_id,
    eventType: row.event_type,
    domain: row.domain,
    dispatchMode: row.dispatch_mode,
    scope: row.scope,
    envelope: row.envelope,
    subscriberResults: row.subscriber_results ?? [],
    summary: row.summary,
    recordedAt: row.recorded_at,
    metadata: row.metadata,
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function coerceUuid(value: string | null | undefined): string | null {
  if (!value) return null;
  return UUID_RE.test(value) ? value : null;
}
