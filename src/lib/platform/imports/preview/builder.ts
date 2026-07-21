import type {
  EntityImporter,
  ImportDestination,
  ImportLookupContext,
  ImportPreview,
  ImportRow,
  PreviewRow,
} from "../types";
import { EMPTY_COUNTS } from "../types";

export function buildImportPreview(input: {
  jobId: string;
  importer: EntityImporter;
  rows: ImportRow[];
  destination: ImportDestination;
  ctx: ImportLookupContext;
  familyGroupCount?: number;
  scholarshipMatches?: number;
  scholarshipUnknown?: number;
}): ImportPreview {
  const counts = EMPTY_COUNTS();
  counts.total = input.rows.length;

  const previewRows: PreviewRow[] = input.rows.map((row) => {
    if (row.status === "error") {
      counts.errors += 1;
      return {
        rowNumber: row.rowNumber,
        mapped: row.mapped,
        status: "error",
        action: "skip",
        issues: row.issues,
        highlight: "error",
      };
    }

    const resolved = input.importer.resolvePreviewAction
      ? input.importer.resolvePreviewAction(row.mapped, input.ctx, input.destination)
      : { action: "create" as const, highlight: "new" as const };

    let action = resolved.action;
    let highlight = resolved.highlight;

    if (input.destination.importMode === "create_only" && action === "update") {
      action = "skip";
      highlight = "skipped";
    }
    if (input.destination.importMode === "skip_duplicates" && action === "update") {
      action = "skip";
      highlight = "duplicate";
    }
    if (input.destination.importMode === "update_existing" && action === "create") {
      // still allow creates when no match; updates when matched
    }
    if (input.destination.importMode === "ask_during_preview" && action === "update") {
      action = "ask";
      highlight = "duplicate";
    }

    if (row.status === "warning") counts.warnings += 1;
    else counts.valid += 1;

    if (action === "skip") counts.skipped += 1;

    return {
      rowNumber: row.rowNumber,
      mapped: row.mapped,
      status: row.status === "warning" ? "warning" : action === "update" ? "update" : action === "skip" ? "skipped" : "new",
      action,
      issues: row.issues,
      highlight,
      ...(resolved.targetEntityId ? { targetEntityId: resolved.targetEntityId } : {}),
    } as PreviewRow & { targetEntityId?: string };
  });

  return {
    jobId: input.jobId,
    rows: previewRows,
    summary: {
      ...counts,
      familyGroups: input.familyGroupCount ?? 0,
      scholarshipMatches: input.scholarshipMatches ?? 0,
      scholarshipUnknown: input.scholarshipUnknown ?? 0,
    },
  };
}
