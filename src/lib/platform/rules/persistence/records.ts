import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { RuleAuditEntry } from "@/lib/platform/rules/types";
import {
  rowToRuleAuditEntry,
  ruleAuditEntryToRow,
  type ListPlatformRuleEvaluationRecordsFilters,
  type PlatformRuleEvaluationRecordRow,
} from "@/lib/platform/rules/persistence/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function persistRuleAuditEntry(
  supabase: AuthClient,
  entry: RuleAuditEntry
): Promise<{ id: string | null; error?: string }> {
  const row = ruleAuditEntryToRow(entry);

  const { data, error } = await supabase
    .from("platform_rule_evaluation_records")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return { id: null, error: error.message };
  }

  return { id: (data as { id: string }).id };
}

export async function getPlatformRuleEvaluationRecordByEvaluationId(
  supabase: AuthClient,
  evaluationId: string
): Promise<PlatformRuleEvaluationRecordRow | null> {
  const { data, error } = await supabase
    .from("platform_rule_evaluation_records")
    .select("*")
    .eq("evaluation_id", evaluationId)
    .maybeSingle();

  if (error || !data) return null;
  return data as PlatformRuleEvaluationRecordRow;
}

export async function listPlatformRuleEvaluationRecords(
  supabase: AuthClient,
  filters: ListPlatformRuleEvaluationRecordsFilters = {}
): Promise<PlatformRuleEvaluationRecordRow[]> {
  let query = supabase
    .from("platform_rule_evaluation_records")
    .select("*")
    .order("evaluated_at", { ascending: false })
    .limit(filters.limit ?? 50);

  if (filters.evaluationId) query = query.eq("evaluation_id", filters.evaluationId);
  if (filters.ruleSetKey) query = query.eq("rule_set_key", filters.ruleSetKey);
  if (filters.domain) query = query.eq("domain", filters.domain);
  if (filters.entityType) query = query.eq("entity_type", filters.entityType);
  if (filters.entityId) query = query.eq("entity_id", filters.entityId);
  if (filters.schoolId) query = query.eq("school_id", filters.schoolId);
  if (filters.organizationId) query = query.eq("organization_id", filters.organizationId);
  if (filters.fromTimestamp) query = query.gte("evaluated_at", filters.fromTimestamp);
  if (filters.toTimestamp) query = query.lte("evaluated_at", filters.toTimestamp);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as PlatformRuleEvaluationRecordRow[];
}

export async function loadPersistedRuleAuditEntries(
  supabase: AuthClient,
  filters: ListPlatformRuleEvaluationRecordsFilters = {}
): Promise<RuleAuditEntry[]> {
  const rows = await listPlatformRuleEvaluationRecords(supabase, filters);
  return rows.map(rowToRuleAuditEntry);
}
