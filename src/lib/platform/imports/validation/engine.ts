import type {
  EntityImporter,
  FieldMapping,
  ImportDestination,
  ImportLookupContext,
  ImportRow,
  ValidationIssue,
} from "../types";
import { mapRecord } from "../mapping";

function isBlank(value: unknown): boolean {
  return value == null || String(value).trim() === "";
}

function parseFlexibleDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  // MM/DD/YYYY or M/D/YYYY
  const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const mm = us[1].padStart(2, "0");
    const dd = us[2].padStart(2, "0");
    return `${us[3]}-${mm}-${dd}`;
  }
  // MM-DD-YYYY
  const dashed = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashed) {
    const mm = dashed[1].padStart(2, "0");
    const dd = dashed[2].padStart(2, "0");
    return `${dashed[3]}-${mm}-${dd}`;
  }
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }
  return null;
}

export function validateRequiredFields(
  mapped: Record<string, unknown>,
  mappings: FieldMapping[],
  rowNumber: number
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const mapping of mappings.filter((m) => m.required)) {
    if (isBlank(mapped[mapping.targetField])) {
      issues.push({
        severity: "error",
        code: "required_field",
        message: `Required field missing: ${mapping.targetField}`,
        fieldName: mapping.targetField,
        rowNumber,
        resolutionHint: `Map a source column to ${mapping.targetField}`,
      });
    }
  }
  return issues;
}

export function validateDateField(
  mapped: Record<string, unknown>,
  fieldName: string,
  rowNumber: number
): ValidationIssue[] {
  const raw = mapped[fieldName];
  if (isBlank(raw)) return [];
  const parsed = parseFlexibleDate(String(raw));
  if (!parsed) {
    return [
      {
        severity: "error",
        code: "invalid_date",
        message: `Invalid date format for ${fieldName}: "${raw}"`,
        fieldName,
        rowNumber,
        resolutionHint: "Use YYYY-MM-DD or MM/DD/YYYY",
      },
    ];
  }
  mapped[fieldName] = parsed;
  return [];
}

export function validateEmailField(
  mapped: Record<string, unknown>,
  fieldName: string,
  rowNumber: number
): ValidationIssue[] {
  const raw = mapped[fieldName];
  if (isBlank(raw)) return [];
  const email = String(raw).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return [
      {
        severity: "error",
        code: "invalid_email",
        message: `Invalid email for ${fieldName}: "${email}"`,
        fieldName,
        rowNumber,
      },
    ];
  }
  mapped[fieldName] = email.toLowerCase();
  return [];
}

export function validateImportRows(input: {
  importer: EntityImporter;
  rows: Array<{ id: string; jobId: string; rowNumber: number; raw: Record<string, string> }>;
  mappings: FieldMapping[];
  destination: ImportDestination;
  ctx: ImportLookupContext;
}): ImportRow[] {
  const fileEmails = new Map<string, number>();
  const fileStudentKeys = new Map<string, number>();

  return input.rows.map((row) => {
    const mapped = mapRecord(row.raw, input.mappings);
    const issues: ValidationIssue[] = [
      ...validateRequiredFields(mapped, input.mappings, row.rowNumber),
      ...validateDateField(mapped, "date_of_birth", row.rowNumber),
      ...validateEmailField(mapped, "parent_email", row.rowNumber),
    ];

    // File-level duplicate email
    const parentEmail = String(mapped.parent_email ?? "").trim().toLowerCase();
    if (parentEmail) {
      if (fileEmails.has(parentEmail)) {
        issues.push({
          severity: "warning",
          code: "duplicate_email_in_file",
          message: `Duplicate parent email also used on row ${fileEmails.get(parentEmail)}`,
          fieldName: "parent_email",
          rowNumber: row.rowNumber,
        });
      } else {
        fileEmails.set(parentEmail, row.rowNumber);
      }
    }

    // File-level duplicate student
    const studentKey = [
      String(mapped.first_name ?? "").trim().toLowerCase(),
      String(mapped.last_name ?? "").trim().toLowerCase(),
      String(mapped.date_of_birth ?? "").trim(),
    ].join("|");
    if (studentKey !== "||") {
      if (fileStudentKeys.has(studentKey)) {
        issues.push({
          severity: "warning",
          code: "duplicate_student_in_file",
          message: `Possible duplicate student also on row ${fileStudentKeys.get(studentKey)}`,
          rowNumber: row.rowNumber,
        });
      } else {
        fileStudentKeys.set(studentKey, row.rowNumber);
      }
    }

    if (input.importer.validateRow) {
      issues.push(
        ...input.importer.validateRow(mapped, input.ctx, input.destination, row.rowNumber)
      );
    }

    const hasError = issues.some((i) => i.severity === "error");
    const hasWarning = issues.some((i) => i.severity === "warning");

    return {
      id: row.id,
      jobId: row.jobId,
      rowNumber: row.rowNumber,
      raw: row.raw,
      mapped,
      status: hasError ? "error" : hasWarning ? "warning" : "valid",
      issues,
    };
  });
}

export function buildErrorReportCsv(rows: ImportRow[]): string {
  const lines = ["row_number,severity,code,field,message"];
  for (const row of rows) {
    for (const issue of row.issues) {
      if (issue.severity === "info") continue;
      const cells = [
        String(row.rowNumber),
        issue.severity,
        issue.code,
        issue.fieldName ?? "",
        `"${issue.message.replace(/"/g, '""')}"`,
      ];
      lines.push(cells.join(","));
    }
  }
  return lines.join("\n");
}
