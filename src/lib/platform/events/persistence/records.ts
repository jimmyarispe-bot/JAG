import type { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  EventAuditEntry,
  PlatformEventEnvelope,
} from "@/lib/platform/events/types";
import {
  eventAuditEntryToRow,
  rowToEventAuditEntry,
  type ListPlatformEventRecordsFilters,
  type PlatformEventRecordRow,
} from "@/lib/platform/events/persistence/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Persist a platform event audit entry to the canonical event store. */
export async function persistEventAuditEntry(
  supabase: AuthClient,
  entry: EventAuditEntry
): Promise<{ id: string | null; error?: string }> {
  const row = eventAuditEntryToRow(entry);

  const { data, error } = await supabase
    .from("platform_event_records")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return { id: null, error: error.message };
  }

  return { id: (data as { id: string }).id };
}

/** Load a single event record by platform event id. */
export async function getPlatformEventRecordByEventId(
  supabase: AuthClient,
  eventId: string
): Promise<PlatformEventRecordRow | null> {
  const { data, error } = await supabase
    .from("platform_event_records")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error || !data) return null;
  return data as PlatformEventRecordRow;
}

/** List persisted event records with optional filters. */
export async function listPlatformEventRecords(
  supabase: AuthClient,
  filters: ListPlatformEventRecordsFilters = {}
): Promise<PlatformEventRecordRow[]> {
  let query = supabase
    .from("platform_event_records")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(filters.limit ?? 50);

  if (filters.eventId) query = query.eq("event_id", filters.eventId);
  if (filters.eventType) query = query.eq("event_type", filters.eventType);
  if (filters.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters.entityId) query = query.eq("entity_id", filters.entityId);
  if (filters.correlationId) query = query.eq("correlation_id", filters.correlationId);
  if (filters.schoolId) query = query.eq("school_id", filters.schoolId);
  if (filters.organizationId) query = query.eq("organization_id", filters.organizationId);
  if (filters.fromTimestamp) query = query.gte("occurred_at", filters.fromTimestamp);
  if (filters.toTimestamp) query = query.lte("occurred_at", filters.toTimestamp);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as PlatformEventRecordRow[];
}

/** Load audit entries from persistence (for replay and graph providers). */
export async function loadPersistedEventAuditEntries(
  supabase: AuthClient,
  filters: ListPlatformEventRecordsFilters = {}
): Promise<EventAuditEntry[]> {
  const rows = await listPlatformEventRecords(supabase, filters);
  return rows.map(rowToEventAuditEntry);
}

/** Load canonical envelopes from persistence for replay. */
export async function loadPersistedEventEnvelopes(
  supabase: AuthClient,
  filters: ListPlatformEventRecordsFilters = {}
): Promise<PlatformEventEnvelope[]> {
  const rows = await listPlatformEventRecords(supabase, filters);
  return rows.map((row) => row.envelope);
}
