import { newId, nowIso } from "../../ids";
import { getStatement, listDashboards, listVariances, upsertExport } from "../store";
import type { ExportFormat, ReportExport } from "../types";

function toCsv(rows: readonly Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]!);
  const header = keys.join(",");
  const body = rows
    .map((r) =>
      keys
        .map((k) => {
          const v = r[k];
          const s = v == null ? "" : String(v);
          return s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

export function exportReport(input: {
  organizationId: string;
  format: ExportFormat;
  sourceType: "statement" | "variance" | "dashboard";
  sourceId: string;
}): ReportExport {
  let payload: unknown = null;
  if (input.sourceType === "statement") {
    payload = getStatement(input.sourceId);
  } else if (input.sourceType === "variance") {
    payload = listVariances(input.organizationId).find(
      (v) => v.id === input.sourceId
    );
  } else {
    payload = listDashboards(input.organizationId).find(
      (d) => d.id === input.sourceId
    );
  }
  if (!payload) throw new Error("export source not found");

  let content: string;
  switch (input.format) {
    case "json":
    case "api":
      content = JSON.stringify(payload, null, 2);
      break;
    case "csv": {
      const lines =
        (payload as { lines?: readonly Record<string, unknown>[] }).lines ??
        (payload as { rows?: readonly Record<string, unknown>[] }).rows ??
        [];
      content = toCsv(lines as Record<string, unknown>[]);
      break;
    }
    case "excel":
      content = `EXCEL_PLACEHOLDER\n${JSON.stringify(payload)}`;
      break;
    case "pdf":
      content = `PDF_PLACEHOLDER\n${JSON.stringify(payload)}`;
      break;
    default:
      content = JSON.stringify(payload);
  }

  return upsertExport({
    id: newId("exp"),
    organizationId: input.organizationId,
    format: input.format,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    content,
    createdAt: nowIso(),
  });
}
