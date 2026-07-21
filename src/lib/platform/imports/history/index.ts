import type { createAuthClient } from "@/lib/supabase/server-auth";
import { listImportHistory } from "../jobs";
import type { ImportJob } from "../types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getImportHistory(
  supabase: AuthClient,
  options?: { organizationId?: string | null; schoolId?: string | null; limit?: number }
): Promise<ImportJob[]> {
  return listImportHistory(supabase, options);
}

export function buildImportReportCsv(job: ImportJob): string {
  const lines = [
    "metric,value",
    `import_date,${job.startedAt}`,
    `completed_at,${job.completedAt ?? ""}`,
    `user,${job.importedByName ?? job.importedBy ?? ""}`,
    `filename,${job.fileName}`,
    `entity_type,${job.entityType}`,
    `rows,${job.counts.total}`,
    `imported,${job.counts.imported}`,
    `updated,${job.counts.updated}`,
    `skipped,${job.counts.skipped}`,
    `failed,${job.counts.failed}`,
    `warnings,${job.counts.warnings}`,
    `duration_ms,${job.durationMs ?? ""}`,
    `status,${job.status}`,
  ];
  return lines.join("\n");
}
