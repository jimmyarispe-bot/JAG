import type { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  FieldMapping,
  ImportDestination,
  ImportEntityType,
  ImportJob,
  ImportJobCounts,
  ImportJobStatus,
  ImportMode,
  ImportRow,
  ImportRowStatus,
  ImportSourceFormat,
  ValidationIssue,
} from "../types";
import { EMPTY_COUNTS } from "../types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

interface JobRow {
  id: string;
  entity_type: string;
  status: string;
  source_format: string;
  file_name: string;
  file_size_bytes: number;
  organization_id: string | null;
  school_id: string | null;
  campus_id: string | null;
  program: string | null;
  school_year_id: string | null;
  import_mode: string;
  mappings: FieldMapping[] | null;
  counts: ImportJobCounts | null;
  duration_ms: number | null;
  imported_by: string | null;
  started_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown> | null;
  raw_headers: string[] | null;
}

interface RecordRow {
  id: string;
  job_id: string;
  row_number: number;
  raw_data: Record<string, string>;
  mapped_data: Record<string, unknown> | null;
  status: string;
  issues: ValidationIssue[] | null;
  preview_action: string | null;
  target_entity_id: string | null;
  family_group_key: string | null;
}

function mapJob(row: JobRow, importedByName?: string | null): ImportJob {
  return {
    id: row.id,
    entityType: row.entity_type as ImportEntityType,
    status: row.status as ImportJobStatus,
    sourceFormat: row.source_format as ImportSourceFormat,
    fileName: row.file_name,
    fileSizeBytes: row.file_size_bytes,
    organizationId: row.organization_id,
    schoolId: row.school_id,
    campusId: row.campus_id,
    program: row.program,
    schoolYearId: row.school_year_id,
    importMode: (row.import_mode as ImportMode) || "create_only",
    mappings: row.mappings ?? [],
    counts: row.counts ?? EMPTY_COUNTS(),
    durationMs: row.duration_ms,
    importedBy: row.imported_by,
    importedByName: importedByName ?? null,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    metadata: row.metadata ?? {},
  };
}

function mapRecord(row: RecordRow): ImportRow {
  return {
    id: row.id,
    jobId: row.job_id,
    rowNumber: row.row_number,
    raw: row.raw_data ?? {},
    mapped: row.mapped_data ?? {},
    status: row.status as ImportRowStatus,
    issues: row.issues ?? [],
    previewAction: (row.preview_action as ImportRow["previewAction"]) ?? undefined,
    targetEntityId: row.target_entity_id,
    familyGroupKey: row.family_group_key,
  };
}

export async function createImportJob(
  supabase: AuthClient,
  input: {
    entityType: ImportEntityType;
    sourceFormat: ImportSourceFormat;
    fileName: string;
    fileSizeBytes: number;
    organizationId?: string | null;
    importedBy?: string | null;
    headers: string[];
    rows: Record<string, string>[];
    metadata?: Record<string, unknown>;
  }
): Promise<{ jobId: string } | { error: string }> {
  const { data: job, error } = await supabase
    .from("platform_import_jobs")
    .insert({
      entity_type: input.entityType,
      status: "uploaded",
      source_format: input.sourceFormat,
      file_name: input.fileName,
      file_size_bytes: input.fileSizeBytes,
      organization_id: input.organizationId ?? null,
      imported_by: input.importedBy ?? null,
      counts: { ...EMPTY_COUNTS(), total: input.rows.length },
      raw_headers: input.headers,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();

  if (error || !job) return { error: error?.message ?? "Unable to create import job" };

  if (input.rows.length) {
    const records = input.rows.map((raw, index) => ({
      job_id: job.id,
      row_number: index + 1,
      raw_data: raw,
      status: "pending",
      issues: [],
    }));

    // Chunk inserts to avoid payload limits
    const chunkSize = 200;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      const { error: insertError } = await supabase.from("platform_import_rows").insert(chunk);
      if (insertError) return { error: insertError.message };
    }
  }

  return { jobId: job.id };
}

export async function getImportJob(
  supabase: AuthClient,
  jobId: string
): Promise<ImportJob | null> {
  const { data } = await supabase
    .from("platform_import_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (!data) return null;
  return mapJob(data as JobRow);
}

export async function updateImportJob(
  supabase: AuthClient,
  jobId: string,
  patch: Partial<{
    status: ImportJobStatus;
    schoolId: string | null;
    campusId: string | null;
    program: string | null;
    schoolYearId: string | null;
    importMode: ImportMode;
    organizationId: string | null;
    mappings: FieldMapping[];
    counts: ImportJobCounts;
    durationMs: number | null;
    completedAt: string | null;
    metadata: Record<string, unknown>;
  }>
): Promise<{ error?: string }> {
  const payload: Record<string, unknown> = {};
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.schoolId !== undefined) payload.school_id = patch.schoolId;
  if (patch.campusId !== undefined) payload.campus_id = patch.campusId;
  if (patch.program !== undefined) payload.program = patch.program;
  if (patch.schoolYearId !== undefined) payload.school_year_id = patch.schoolYearId;
  if (patch.importMode !== undefined) payload.import_mode = patch.importMode;
  if (patch.organizationId !== undefined) payload.organization_id = patch.organizationId;
  if (patch.mappings !== undefined) payload.mappings = patch.mappings;
  if (patch.counts !== undefined) payload.counts = patch.counts;
  if (patch.durationMs !== undefined) payload.duration_ms = patch.durationMs;
  if (patch.completedAt !== undefined) payload.completed_at = patch.completedAt;
  if (patch.metadata !== undefined) payload.metadata = patch.metadata;

  const { error } = await supabase.from("platform_import_jobs").update(payload).eq("id", jobId);
  return error ? { error: error.message } : {};
}

export async function configureJobDestination(
  supabase: AuthClient,
  jobId: string,
  destination: ImportDestination,
  organizationId?: string | null
) {
  return updateImportJob(supabase, jobId, {
    status: "configured",
    schoolId: destination.schoolId,
    campusId: destination.campusId ?? null,
    program: destination.program ?? null,
    schoolYearId: destination.schoolYearId ?? null,
    importMode: destination.importMode,
    organizationId: organizationId ?? null,
  });
}

export async function getImportRows(
  supabase: AuthClient,
  jobId: string
): Promise<ImportRow[]> {
  const { data } = await supabase
    .from("platform_import_rows")
    .select("*")
    .eq("job_id", jobId)
    .order("row_number");
  return (data ?? []).map((row) => mapRecord(row as RecordRow));
}

export async function replaceMappedRows(
  supabase: AuthClient,
  rows: ImportRow[]
): Promise<{ error?: string }> {
  for (const row of rows) {
    const { error } = await supabase
      .from("platform_import_rows")
      .update({
        mapped_data: row.mapped,
        status: row.status,
        issues: row.issues,
        preview_action: row.previewAction ?? null,
        target_entity_id: row.targetEntityId ?? null,
        family_group_key: row.familyGroupKey ?? null,
      })
      .eq("id", row.id);
    if (error) return { error: error.message };
  }
  return {};
}

export async function listImportHistory(
  supabase: AuthClient,
  options: { organizationId?: string | null; schoolId?: string | null; limit?: number } = {}
): Promise<ImportJob[]> {
  let query = supabase
    .from("platform_import_jobs")
    .select("*, users:imported_by(full_name)")
    .order("started_at", { ascending: false })
    .limit(options.limit ?? 50);

  if (options.organizationId) query = query.eq("organization_id", options.organizationId);
  if (options.schoolId) query = query.eq("school_id", options.schoolId);

  const { data } = await query;
  return (data ?? []).map((row) => {
    const users = (row as { users?: { full_name?: string } | null }).users;
    return mapJob(row as JobRow, users?.full_name ?? null);
  });
}

export async function recordTransactionEntities(
  supabase: AuthClient,
  input: {
    jobId: string;
    rowId?: string | null;
    entities: Array<{ entityType: string; entityId: string; action: string }>;
  }
): Promise<void> {
  if (!input.entities.length) return;
  await supabase.from("platform_import_transactions").insert(
    input.entities.map((entity) => ({
      job_id: input.jobId,
      row_id: input.rowId ?? null,
      entity_type: entity.entityType,
      entity_id: entity.entityId,
      action: entity.action,
    }))
  );
}

export async function getJobTransactions(
  supabase: AuthClient,
  jobId: string
): Promise<Array<{ id: string; entity_type: string; entity_id: string; action: string; rolled_back: boolean }>> {
  const { data } = await supabase
    .from("platform_import_transactions")
    .select("id, entity_type, entity_id, action, rolled_back")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Array<{
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    rolled_back: boolean;
  }>;
}

export async function markTransactionsRolledBack(
  supabase: AuthClient,
  transactionIds: string[]
): Promise<void> {
  if (!transactionIds.length) return;
  await supabase
    .from("platform_import_transactions")
    .update({ rolled_back: true, rolled_back_at: new Date().toISOString() })
    .in("id", transactionIds);
}
