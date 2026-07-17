/**
 * Validation — structural checks on normalized records before persistence.
 */

import type {
  NormalizedRecord,
  ValidationIssue,
  ValidationResult,
} from "@/lib/platform/integrations/common/types";

export function validateNormalizedRecords(
  records: NormalizedRecord[],
  options: {
    requiredFields?: Record<string, string[]>;
  } = {}
): ValidationResult {
  const accepted: NormalizedRecord[] = [];
  const rejected: NormalizedRecord[] = [];
  const issues: ValidationIssue[] = [];

  for (const record of records) {
    const recordIssues: ValidationIssue[] = [];
    if (!record.externalId) {
      recordIssues.push({
        severity: "error",
        code: "missing_external_id",
        message: "externalId is required",
      });
    }
    if (!record.canonicalType) {
      recordIssues.push({
        severity: "error",
        code: "missing_canonical_type",
        message: "canonicalType is required",
      });
    }
    if (!record.scope?.organizationId) {
      recordIssues.push({
        severity: "error",
        code: "missing_org_scope",
        message: "organizationId scope is required",
      });
    }

    const required = options.requiredFields?.[record.canonicalType] ?? [];
    for (const field of required) {
      if (record.data[field] === undefined || record.data[field] === null || record.data[field] === "") {
        recordIssues.push({
          severity: "error",
          code: "missing_required_field",
          message: `Missing required field: ${field}`,
          field,
          externalId: record.externalId,
        });
      }
    }

    issues.push(...recordIssues);
    if (recordIssues.some((i) => i.severity === "error")) {
      rejected.push(record);
    } else {
      accepted.push(record);
    }
  }

  return {
    ok: rejected.length === 0,
    issues,
    accepted,
    rejected,
  };
}
