import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { DecisionAuditEntry } from "@/lib/platform/decision/types";
import {
  decisionAuditEntryToRow,
  rowToDecisionAuditEntry,
  type ListPlatformDecisionRecordsFilters,
  type PlatformDecisionRecordRow,
} from "@/lib/platform/decision/persistence/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Persist a platform decision audit entry to the canonical decision store. */
export async function persistDecisionAuditEntry(
  supabase: AuthClient,
  entry: DecisionAuditEntry
): Promise<{ id: string | null; error?: string }> {
  const row = decisionAuditEntryToRow(entry);

  const { data, error } = await supabase
    .from("platform_decision_records")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return { id: null, error: error.message };
  }

  return { id: (data as { id: string }).id };
}

/** Load a single decision record by execution id. */
export async function getPlatformDecisionRecordByExecutionId(
  supabase: AuthClient,
  executionId: string
): Promise<PlatformDecisionRecordRow | null> {
  const { data, error } = await supabase
    .from("platform_decision_records")
    .select("*")
    .eq("execution_id", executionId)
    .maybeSingle();

  if (error || !data) return null;
  return data as PlatformDecisionRecordRow;
}

/** List persisted decision records with optional filters. */
export async function listPlatformDecisionRecords(
  supabase: AuthClient,
  filters: ListPlatformDecisionRecordsFilters = {}
): Promise<PlatformDecisionRecordRow[]> {
  let query = supabase
    .from("platform_decision_records")
    .select("*")
    .order("executed_at", { ascending: false })
    .limit(filters.limit ?? 50);

  if (filters.executionId) query = query.eq("execution_id", filters.executionId);
  if (filters.decisionType) query = query.eq("decision_type", filters.decisionType);
  if (filters.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters.entityId) query = query.eq("entity_id", filters.entityId);
  if (filters.schoolId) query = query.eq("school_id", filters.schoolId);
  if (filters.organizationId) query = query.eq("organization_id", filters.organizationId);
  if (filters.fromTimestamp) query = query.gte("executed_at", filters.fromTimestamp);
  if (filters.toTimestamp) query = query.lte("executed_at", filters.toTimestamp);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as PlatformDecisionRecordRow[];
}

/** Load audit entries from persistence (for graph providers and audit views). */
export async function loadPersistedDecisionAuditEntries(
  supabase: AuthClient,
  filters: ListPlatformDecisionRecordsFilters = {}
): Promise<DecisionAuditEntry[]> {
  const rows = await listPlatformDecisionRecords(supabase, filters);
  return rows.map(rowToDecisionAuditEntry);
}
