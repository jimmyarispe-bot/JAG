/**
 * Canonical entity validator — structural checks only (no provider rules).
 */

import type { RecordValidator } from "@/lib/platform/integrations/contracts";
import type { CanonicalEntity } from "@/lib/platform/integrations/types";

export class CanonicalRecordValidator implements RecordValidator {
  validate(entity: CanonicalEntity): {
    ok: boolean;
    issues: readonly { code: string; message: string }[];
  } {
    const issues: { code: string; message: string }[] = [];
    if (!entity.externalId?.trim()) {
      issues.push({ code: "MISSING_EXTERNAL_ID", message: "externalId is required" });
    }
    if (!entity.canonicalType?.trim()) {
      issues.push({ code: "MISSING_CANONICAL_TYPE", message: "canonicalType is required" });
    }
    if (!entity.sourceSystem?.trim()) {
      issues.push({ code: "MISSING_SOURCE_SYSTEM", message: "sourceSystem is required" });
    }
    if (!entity.data || typeof entity.data !== "object") {
      issues.push({ code: "INVALID_DATA", message: "data must be an object" });
    }
    return { ok: issues.length === 0, issues };
  }
}

export function createRecordValidator(): CanonicalRecordValidator {
  return new CanonicalRecordValidator();
}
