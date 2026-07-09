import type {
  ListEvidenceRecordsFilters,
  PlatformEvidenceRecord,
} from "@/lib/platform/evidence/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getEvidenceRecordById(
  supabase: AuthClient,
  evidenceId: string
): Promise<PlatformEvidenceRecord | null> {
  const { data, error } = await supabase
    .from("platform_evidence_records")
    .select("*")
    .eq("id", evidenceId)
    .maybeSingle();

  if (error || !data) return null;
  return data as PlatformEvidenceRecord;
}

export async function listEvidenceRecords(
  supabase: AuthClient,
  filters: ListEvidenceRecordsFilters = {}
): Promise<PlatformEvidenceRecord[]> {
  let query = supabase
    .from("platform_evidence_records")
    .select("*")
    .order("captured_at", { ascending: false })
    .limit(filters.limit ?? 50);

  if (filters.studentId) query = query.eq("student_id", filters.studentId);
  if (filters.evidenceTypeKey) query = query.eq("evidence_type_key", filters.evidenceTypeKey);
  if (filters.competencyKey) query = query.contains("competency_keys", [filters.competencyKey]);
  if (filters.skillKey) query = query.contains("skill_keys", [filters.skillKey]);
  if (filters.schoolId) query = query.eq("school_id", filters.schoolId);
  if (filters.organizationId) query = query.eq("organization_id", filters.organizationId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.fromTimestamp) query = query.gte("captured_at", filters.fromTimestamp);
  if (filters.toTimestamp) query = query.lte("captured_at", filters.toTimestamp);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as PlatformEvidenceRecord[];
}

export async function getStudentEvidenceRecords(
  supabase: AuthClient,
  studentId: string,
  filters: Omit<ListEvidenceRecordsFilters, "studentId"> = {}
): Promise<PlatformEvidenceRecord[]> {
  return listEvidenceRecords(supabase, { ...filters, studentId });
}

/** Mark prior evidence superseded when a correction record is written. */
export async function markEvidenceSuperseded(
  supabase: AuthClient,
  evidenceId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("platform_evidence_records")
    .update({ status: "superseded" })
    .eq("id", evidenceId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
