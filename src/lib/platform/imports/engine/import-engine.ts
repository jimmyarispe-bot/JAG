import type { createAuthClient } from "@/lib/supabase/server-auth";
import { resolveActorUserId } from "@/lib/platform/shared/context";
import { applyFamilyGrouping } from "../entities/student/family-intelligence";
import { loadStudentLookupContext } from "../entities/student/commit";
import { recognizeScholarship } from "../entities/student/scholarship-intelligence";
import {
  configureJobDestination,
  createImportJob,
  getImportJob,
  getImportRows,
  recordTransactionEntities,
  replaceMappedRows,
  updateImportJob,
} from "../jobs";
import { autoMapColumns, buildMappingsFromImporter } from "../mapping";
import { parseImportFile, type FileParseInput } from "../parsers";
import { buildImportPreview } from "../preview";
import { requireImporter } from "../registry";
import { buildErrorReportCsv, validateImportRows } from "../validation";
import type {
  FieldMapping,
  ImportCommitResult,
  ImportDestination,
  ImportEntityType,
  ImportJob,
  ImportPreview,
  ImportProgress,
  PreviewRow,
} from "../types";
import { EMPTY_COUNTS } from "../types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function uploadAndCreateJob(
  supabase: AuthClient,
  input: FileParseInput & {
    entityType: ImportEntityType;
    organizationId?: string | null;
    importedBy?: string | null;
  }
): Promise<{ job: ImportJob; rowCount: number; headers: string[] } | { error: string }> {
  try {
    const workbook = await parseImportFile(input);
    const created = await createImportJob(supabase, {
      entityType: input.entityType,
      sourceFormat: workbook.format,
      fileName: workbook.fileName,
      fileSizeBytes: workbook.fileSizeBytes,
      organizationId: input.organizationId,
      importedBy: input.importedBy,
      headers: workbook.primary.headers,
      rows: workbook.primary.rows,
      metadata: {
        sheetNames: workbook.sheets.map((s) => s.sheetName),
      },
    });
    if ("error" in created) return created;

    const job = await getImportJob(supabase, created.jobId);
    if (!job) return { error: "Job created but could not be reloaded" };
    return {
      job,
      rowCount: workbook.primary.rowCount,
      headers: workbook.primary.headers,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to parse upload" };
  }
}

export async function setDestination(
  supabase: AuthClient,
  jobId: string,
  destination: ImportDestination,
  organizationId?: string | null
): Promise<{ job: ImportJob } | { error: string }> {
  const result = await configureJobDestination(supabase, jobId, destination, organizationId);
  if (result.error) return { error: result.error };
  const job = await getImportJob(supabase, jobId);
  if (!job) return { error: "Job not found" };
  return { job };
}

export async function runAutoMapping(
  supabase: AuthClient,
  jobId: string,
  overrides?: FieldMapping[]
): Promise<{ mappings: FieldMapping[]; unmappedRequired: string[] } | { error: string }> {
  const job = await getImportJob(supabase, jobId);
  if (!job) return { error: "Job not found" };
  const importer = requireImporter(job.entityType);
  const rows = await getImportRows(supabase, jobId);
  const headers = rows[0] ? Object.keys(rows[0].raw) : ((job.metadata.headers as string[]) ?? []);
  // Prefer stored raw_headers via first row keys
  const sourceHeaders =
    headers.length > 0
      ? headers
      : importer.fields.map((f) => f.label);

  const mappings = buildMappingsFromImporter(importer, sourceHeaders, overrides);
  const unmappedRequired = importer.fields
    .filter((f) => f.required)
    .filter((f) => !mappings.some((m) => m.targetField === f.key && m.sourceField))
    .map((f) => f.key);

  await updateImportJob(supabase, jobId, {
    status: "mapped",
    mappings,
    metadata: { ...job.metadata, headers: sourceHeaders },
  });

  return { mappings, unmappedRequired };
}

export async function runValidation(
  supabase: AuthClient,
  jobId: string,
  mappings?: FieldMapping[]
): Promise<
  | {
      rowsValidated: number;
      valid: number;
      warnings: number;
      errors: number;
      errorReportCsv: string;
      familyGroups: number;
      scholarshipMatches: number;
      scholarshipUnknown: number;
    }
  | { error: string }
> {
  const job = await getImportJob(supabase, jobId);
  if (!job) return { error: "Job not found" };
  if (!job.schoolId) return { error: "Destination school is required before validation" };

  const importer = requireImporter(job.entityType);
  const rawRows = await getImportRows(supabase, jobId);
  const effectiveMappings = [...(mappings ?? job.mappings)];
  if (!effectiveMappings.length) {
    const headers = rawRows[0] ? Object.keys(rawRows[0].raw) : [];
    effectiveMappings.push(...autoMapColumns(headers, importer.fields));
  }

  const ctx = await loadStudentLookupContext(supabase, job.schoolId);
  let validated = validateImportRows({
    importer,
    rows: rawRows,
    mappings: effectiveMappings,
    destination: {
      schoolId: job.schoolId,
      campusId: job.campusId,
      program: job.program,
      schoolYearId: job.schoolYearId,
      importMode: job.importMode,
    },
    ctx,
  });

  const grouped = applyFamilyGrouping(validated);
  validated = grouped.rows;

  let scholarshipMatches = 0;
  let scholarshipUnknown = 0;
  for (const row of validated) {
    const raw = row.mapped.scholarship as string | undefined;
    if (!raw || !String(raw).trim()) continue;
    const match = recognizeScholarship(raw, ctx);
    if (match.known && match.code) scholarshipMatches += 1;
    else if (!match.known) scholarshipUnknown += 1;
  }

  await replaceMappedRows(supabase, validated);

  const counts = EMPTY_COUNTS();
  counts.total = validated.length;
  counts.valid = validated.filter((r) => r.status === "valid").length;
  counts.warnings = validated.filter((r) => r.status === "warning").length;
  counts.errors = validated.filter((r) => r.status === "error").length;

  await updateImportJob(supabase, jobId, {
    status: "validated",
    mappings: effectiveMappings,
    counts,
    metadata: {
      ...job.metadata,
      familyGroups: grouped.familyGroupCount,
      scholarshipMatches,
      scholarshipUnknown,
    },
  });

  return {
    rowsValidated: validated.length,
    valid: counts.valid,
    warnings: counts.warnings,
    errors: counts.errors,
    errorReportCsv: buildErrorReportCsv(validated),
    familyGroups: grouped.familyGroupCount,
    scholarshipMatches,
    scholarshipUnknown,
  };
}

export async function runPreview(
  supabase: AuthClient,
  jobId: string
): Promise<ImportPreview | { error: string }> {
  const job = await getImportJob(supabase, jobId);
  if (!job) return { error: "Job not found" };
  if (!job.schoolId) return { error: "Destination school is required" };

  const importer = requireImporter(job.entityType);
  const ctx = await loadStudentLookupContext(supabase, job.schoolId);
  const rows = await getImportRows(supabase, jobId);

  const preview = buildImportPreview({
    jobId,
    importer,
    rows,
    destination: {
      schoolId: job.schoolId,
      campusId: job.campusId,
      program: job.program,
      schoolYearId: job.schoolYearId,
      importMode: job.importMode,
    },
    ctx,
    familyGroupCount: Number(job.metadata.familyGroups ?? 0),
    scholarshipMatches: Number(job.metadata.scholarshipMatches ?? 0),
    scholarshipUnknown: Number(job.metadata.scholarshipUnknown ?? 0),
  });

  // Persist preview actions onto rows
  const byNumber = new Map(preview.rows.map((r) => [r.rowNumber, r]));
  const updated = rows.map((row) => {
    const p = byNumber.get(row.rowNumber);
    if (!p) return row;
    return {
      ...row,
      previewAction: p.action,
      targetEntityId: (p as PreviewRow & { targetEntityId?: string }).targetEntityId ?? row.targetEntityId,
      status:
        p.highlight === "new"
          ? ("new" as const)
          : p.highlight === "updated"
            ? ("update" as const)
            : p.highlight === "duplicate"
              ? ("duplicate" as const)
              : p.highlight === "skipped"
                ? ("skipped" as const)
                : row.status,
    };
  });
  await replaceMappedRows(supabase, updated);
  await updateImportJob(supabase, jobId, {
    status: "preview",
    counts: {
      ...job.counts,
      total: preview.summary.total,
      valid: preview.summary.valid,
      warnings: preview.summary.warnings,
      errors: preview.summary.errors,
      skipped: preview.summary.skipped,
    },
  });

  return preview;
}

export async function commitImport(
  supabase: AuthClient,
  jobId: string,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportCommitResult | { error: string }> {
  const job = await getImportJob(supabase, jobId);
  if (!job) return { error: "Job not found" };
  if (!job.schoolId) return { error: "Destination school is required" };

  const importer = requireImporter(job.entityType);
  if (!importer.commitRow) return { error: `Importer ${job.entityType} does not support commit` };

  const actorUserId = await resolveActorUserId(supabase);
  const ctx = await loadStudentLookupContext(supabase, job.schoolId);
  const rows = await getImportRows(supabase, jobId);
  const start = Date.now();

  await updateImportJob(supabase, jobId, { status: "importing" });

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const reportLines = ["row_number,status,action,entity_id,message"];

  // Sibling family cache within this job
  const familyCache = new Map<string, string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const action = row.previewAction ?? "create";
    const elapsed = Date.now() - start;
    const rate = (i + 1) / Math.max(elapsed, 1);
    const remaining = (rows.length - i - 1) / Math.max(rate, 0.0001);

    onProgress?.({
      jobId,
      status: "importing",
      processed: i,
      total: rows.length,
      percent: Math.round((i / Math.max(rows.length, 1)) * 100),
      estimatedRemainingMs: Math.round(remaining),
      message: `Importing row ${i + 1} of ${rows.length}`,
    });

    if (row.status === "error" || action === "skip") {
      skipped += 1;
      reportLines.push(`${row.rowNumber},skipped,${action},,`);
      continue;
    }

    // Inject cached family id for sibling groups
    if (row.familyGroupKey && familyCache.has(row.familyGroupKey)) {
      row.mapped._existing_family_id = familyCache.get(row.familyGroupKey);
    }

    const result = await importer.commitRow(
      row.mapped,
      {
        schoolId: job.schoolId,
        campusId: job.campusId,
        program: job.program,
        schoolYearId: job.schoolYearId,
        importMode: job.importMode,
      },
      action === "ask" ? "skip" : action,
      row.targetEntityId,
      { supabase, actorUserId, jobId }
    );

    void ctx;

    if (result.ok && result.action === "imported") imported += 1;
    else if (result.ok && result.action === "updated") updated += 1;
    else if (result.ok && result.action === "skipped") skipped += 1;
    else failed += 1;

    if (result.relatedEntities?.length) {
      await recordTransactionEntities(supabase, {
        jobId,
        rowId: row.id,
        entities: result.relatedEntities.map((e) => ({
          entityType: e.entityType,
          entityId: e.entityId,
          action: e.action === "linked" ? "linked" : e.action === "updated" ? "updated" : "created",
        })),
      });

      const familyCreated = result.relatedEntities.find((e) => e.entityType === "family");
      if (familyCreated && row.familyGroupKey) {
        familyCache.set(row.familyGroupKey, familyCreated.entityId);
      }
      if (result.entityId && row.familyGroupKey && result.relatedEntities.some((e) => e.entityType === "family")) {
        // already cached
      } else if (row.familyGroupKey && row.mapped._existing_family_id) {
        familyCache.set(row.familyGroupKey, String(row.mapped._existing_family_id));
      }
    }

    await supabase
      .from("platform_import_rows")
      .update({
        status: result.ok
          ? result.action === "imported"
            ? "imported"
            : result.action === "updated"
              ? "update"
              : result.action === "skipped"
                ? "skipped"
                : "failed"
          : "failed",
        target_entity_id: result.entityId ?? row.targetEntityId ?? null,
        issues: result.error
          ? [...row.issues, { severity: "error", code: "commit_failed", message: result.error, rowNumber: row.rowNumber }]
          : row.issues,
      })
      .eq("id", row.id);

    reportLines.push(
      `${row.rowNumber},${result.ok ? "ok" : "failed"},${result.action},${result.entityId ?? ""},"${(result.error ?? "").replace(/"/g, '""')}"`
    );
  }

  const durationMs = Date.now() - start;
  const counts = {
    ...job.counts,
    imported,
    updated,
    skipped,
    failed,
    total: rows.length,
  };

  await updateImportJob(supabase, jobId, {
    status: failed && !imported && !updated ? "failed" : "completed",
    counts,
    durationMs,
    completedAt: new Date().toISOString(),
  });

  onProgress?.({
    jobId,
    status: "completed",
    processed: rows.length,
    total: rows.length,
    percent: 100,
    estimatedRemainingMs: 0,
    message: "Import complete",
  });

  return {
    jobId,
    imported,
    updated,
    skipped,
    failed,
    warnings: job.counts.warnings,
    durationMs,
    reportCsv: reportLines.join("\n"),
  };
}
