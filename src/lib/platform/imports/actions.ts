"use server";

import { revalidatePath } from "next/cache";
import { getCampuses } from "@/lib/admissions/queries";
import { PROGRAMS } from "@/lib/constants/programs";
import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import { getSchools, getSchoolYears } from "@/lib/students/queries";
import { createAuthClient } from "@/lib/supabase/server-auth";
import {
  assertCanImportStudents,
  assertSchoolImportAccess,
  requireStudentImportAccess,
} from "./access";
import "./bootstrap";
import { getImportRows } from "./jobs";
import { ImportService } from "./service";
import type { FieldMapping, ImportEntityType, ImportMode, WizardStepKey } from "./types";
import { buildErrorReportCsv } from "./validation";

async function gate(schoolId?: string | null) {
  const access = await requireStudentImportAccess();
  if (!access.ok) return { ok: false as const, error: access.error };
  if (schoolId) {
    const schoolGate = assertSchoolImportAccess(access.ctx, schoolId);
    if (!schoolGate.ok) return { ok: false as const, error: schoolGate.error };
  }
  return { ok: true as const, ctx: access.ctx };
}

/**
 * Resolve a caller-supplied entity type against the import registry.
 * Falls back to "student" so existing callers are unaffected.
 */
function resolveEntityType(value: unknown): ImportEntityType {
  if (typeof value !== "string" || !value.trim()) return "student";
  const importer = ImportService.getImporter(value as ImportEntityType);
  return importer ? (value as ImportEntityType) : "student";
}

export async function getStudentImportPageData(entityTypeInput?: string) {
  const entityType = resolveEntityType(entityTypeInput);
  const access = await requireStudentImportAccess();
  if (!access.ok) return { ok: false as const, error: access.error };

  const [schools, campuses, schoolYears, history] = await Promise.all([
    getSchools(),
    getCampuses(),
    getSchoolYears(),
    (async () => {
      const supabase = await createAuthClient();
      const accessible = access.ctx.hasUnrestrictedSchoolAccess
        ? null
        : access.ctx.accessibleSchoolIds[0] ?? null;
      return ImportService.history(supabase, {
        schoolId: accessible,
        limit: 25,
      });
    })(),
  ]);

  const scopedHistory = history.filter((job) => job.entityType === entityType);

  const scopedSchools = access.ctx.hasUnrestrictedSchoolAccess
    ? schools
    : schools.filter((s) => access.ctx.accessibleSchoolIds.includes(s.id));

  return {
    ok: true as const,
    schools: scopedSchools,
    campuses,
    schoolYears,
    programs: PROGRAMS.map((p) => ({ value: p.value, label: p.label })),
    history: scopedHistory,
    templates: ImportService.listTemplates(entityType),
    canRollback: assertCanImportStudents(access.ctx).ok,
    entityType,
  };
}

export async function uploadStudentImportFile(formData: FormData) {
  const access = await gate();
  if (!access.ok) return { ok: false as const, error: access.error };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false as const, error: "No file uploaded" };

  const entityType = resolveEntityType(formData.get("entity_type"));

  const fileName = file.name;
  const fileSizeBytes = file.size;
  const lower = fileName.toLowerCase();
  const isExcel = lower.endsWith(".xlsx") || lower.endsWith(".xls");

  let text: string | undefined;
  let base64: string | undefined;

  if (isExcel) {
    const buffer = Buffer.from(await file.arrayBuffer());
    base64 = buffer.toString("base64");
  } else {
    text = await file.text();
  }

  const supabase = await createAuthClient();
  const actorUserId = await resolveActorUserId(supabase);

  const result = await ImportService.upload(supabase, {
    entityType,
    fileName,
    fileSizeBytes,
    text,
    base64,
    importedBy: actorUserId,
  });

  if ("error" in result) return { ok: false as const, error: result.error };

  return {
    ok: true as const,
    jobId: result.job.id,
    fileName: result.job.fileName,
    fileSizeBytes: result.job.fileSizeBytes,
    rowCount: result.rowCount,
    headers: result.headers,
    sourceFormat: result.job.sourceFormat,
    nextStep: "destination" as WizardStepKey,
  };
}

export async function configureStudentImportDestination(input: {
  jobId: string;
  schoolId: string;
  campusId?: string | null;
  program?: string | null;
  schoolYearId?: string | null;
  importMode: ImportMode;
}) {
  const access = await gate(input.schoolId);
  if (!access.ok) return { ok: false as const, error: access.error };

  const supabase = await createAuthClient();
  const schoolCtx = await resolveSchoolContext(supabase, input.schoolId);

  const result = await ImportService.configureDestination(
    supabase,
    input.jobId,
    {
      schoolId: input.schoolId,
      campusId: input.campusId ?? null,
      program: input.program ?? null,
      schoolYearId: input.schoolYearId ?? null,
      importMode: input.importMode,
    },
    schoolCtx?.organizationId
  );

  if ("error" in result) return { ok: false as const, error: result.error };
  return { ok: true as const, jobId: result.job.id, nextStep: "mapping" as WizardStepKey };
}

export async function mapStudentImportColumns(input: {
  jobId: string;
  mappings?: FieldMapping[];
}) {
  const access = await gate();
  if (!access.ok) return { ok: false as const, error: access.error };

  const supabase = await createAuthClient();
  const job = await ImportService.getJob(supabase, input.jobId);
  if (!job) return { ok: false as const, error: "Job not found" };
  if (job.schoolId) {
    const schoolGate = assertSchoolImportAccess(access.ctx, job.schoolId);
    if (!schoolGate.ok) return { ok: false as const, error: schoolGate.error };
  }

  const result = await ImportService.mapColumns(supabase, input.jobId, input.mappings);
  if ("error" in result) return { ok: false as const, error: result.error };

  const importer = ImportService.requireImporter(job.entityType);
  return {
    ok: true as const,
    mappings: result.mappings,
    unmappedRequired: result.unmappedRequired,
    fields: importer.fields,
    nextStep: "validation" as WizardStepKey,
  };
}

export async function validateStudentImport(input: {
  jobId: string;
  mappings?: FieldMapping[];
}) {
  const access = await gate();
  if (!access.ok) return { ok: false as const, error: access.error };

  const supabase = await createAuthClient();
  const job = await ImportService.getJob(supabase, input.jobId);
  if (!job?.schoolId) {
    return { ok: false as const, error: "Configure destination before validation" };
  }
  const schoolGate = assertSchoolImportAccess(access.ctx, job.schoolId);
  if (!schoolGate.ok) return { ok: false as const, error: schoolGate.error };

  const result = await ImportService.validate(supabase, input.jobId, input.mappings);
  if ("error" in result) return { ok: false as const, error: result.error };

  return { ok: true as const, ...result, nextStep: "preview" as WizardStepKey };
}

export async function previewStudentImport(input: { jobId: string }) {
  const access = await gate();
  if (!access.ok) return { ok: false as const, error: access.error };

  const supabase = await createAuthClient();
  const job = await ImportService.getJob(supabase, input.jobId);
  if (!job?.schoolId) return { ok: false as const, error: "Job not found" };
  const schoolGate = assertSchoolImportAccess(access.ctx, job.schoolId);
  if (!schoolGate.ok) return { ok: false as const, error: schoolGate.error };

  const result = await ImportService.preview(supabase, input.jobId);
  if ("error" in result) return { ok: false as const, error: result.error };
  return { ok: true as const, preview: result, nextStep: "import" as WizardStepKey };
}

export async function commitStudentImport(input: { jobId: string }) {
  const access = await gate();
  if (!access.ok) return { ok: false as const, error: access.error };

  const supabase = await createAuthClient();
  const job = await ImportService.getJob(supabase, input.jobId);
  if (!job?.schoolId) return { ok: false as const, error: "Job not found" };
  const schoolGate = assertSchoolImportAccess(access.ctx, job.schoolId);
  if (!schoolGate.ok) return { ok: false as const, error: schoolGate.error };

  const result = await ImportService.commit(supabase, input.jobId);
  if ("error" in result) return { ok: false as const, error: result.error };

  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/students/import");
  if (job.entityType === "admissions_lead") {
    revalidatePath("/dashboard/admissions");
    revalidatePath("/dashboard/admissions/import");
  }
  return { ok: true as const, ...result, nextStep: "results" as WizardStepKey };
}

export async function rollbackStudentImport(input: { jobId: string }) {
  const access = await gate();
  if (!access.ok) return { ok: false as const, error: access.error };

  const supabase = await createAuthClient();
  const job = await ImportService.getJob(supabase, input.jobId);
  if (job?.schoolId) {
    const schoolGate = assertSchoolImportAccess(access.ctx, job.schoolId);
    if (!schoolGate.ok) return { ok: false as const, error: schoolGate.error };
  }

  const result = await ImportService.rollback(supabase, input.jobId);
  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/students/import");
  return { ok: true as const, ...result };
}

export async function downloadStudentImportTemplate(templateId: string) {
  const access = await gate();
  if (!access.ok) return { ok: false as const, error: access.error };
  const file = ImportService.downloadTemplateCsv(templateId);
  if (!file) return { ok: false as const, error: "Template not found" };
  return { ok: true as const, ...file };
}

export async function downloadStudentImportErrorReport(jobId: string) {
  const access = await gate();
  if (!access.ok) return { ok: false as const, error: access.error };
  const supabase = await createAuthClient();
  const rows = await getImportRows(supabase, jobId);
  return {
    ok: true as const,
    csv: buildErrorReportCsv(rows),
    fileName: `import-errors-${jobId.slice(0, 8)}.csv`,
  };
}

export async function downloadStudentImportReport(jobId: string) {
  const access = await gate();
  if (!access.ok) return { ok: false as const, error: access.error };
  const supabase = await createAuthClient();
  const job = await ImportService.getJob(supabase, jobId);
  if (!job) return { ok: false as const, error: "Job not found" };
  return {
    ok: true as const,
    csv: ImportService.buildImportReportCsv(job),
    fileName: `import-report-${jobId.slice(0, 8)}.csv`,
  };
}
