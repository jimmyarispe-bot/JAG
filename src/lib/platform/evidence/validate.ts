import { isKnownEvidenceType } from "@/lib/platform/evidence/catalog";
import type { RecordEvidenceInput } from "@/lib/platform/evidence/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidScore(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

export function validateRecordEvidenceInput(
  input: RecordEvidenceInput
): { ok: true } | { ok: false; error: string } {
  if (!input.evidenceTypeKey?.trim()) {
    return { ok: false, error: "Evidence records require evidenceTypeKey" };
  }

  if (!isKnownEvidenceType(input.evidenceTypeKey)) {
    return { ok: false, error: `Unknown evidence type: ${input.evidenceTypeKey}` };
  }

  if (!input.studentId?.trim() || !UUID_RE.test(input.studentId)) {
    return { ok: false, error: "Evidence records require a valid studentId UUID" };
  }

  const skillKeys = input.skillKeys ?? [];
  const competencyKeys = input.competencyKeys ?? [];
  if (skillKeys.length === 0 && competencyKeys.length === 0) {
    return {
      ok: false,
      error: "Evidence records require at least one skillKey or competencyKey",
    };
  }

  if (!input.capturedByRole) {
    return { ok: false, error: "Evidence records require capturedByRole" };
  }

  if (!isValidScore(input.evidenceConfidence)) {
    return { ok: false, error: "evidenceConfidence must be between 0 and 1" };
  }

  if (!isValidScore(input.evidenceQuality)) {
    return { ok: false, error: "evidenceQuality must be between 0 and 1" };
  }

  if (!input.schoolId && !input.organizationId) {
    return { ok: false, error: "Evidence records require schoolId or organizationId" };
  }

  if (input.schoolId && !UUID_RE.test(input.schoolId)) {
    return { ok: false, error: "Evidence records require a valid schoolId UUID" };
  }

  if (input.organizationId && !UUID_RE.test(input.organizationId)) {
    return { ok: false, error: "Evidence records require a valid organizationId UUID" };
  }

  if (input.capturedByUserId && !UUID_RE.test(input.capturedByUserId)) {
    return { ok: false, error: "Evidence records require a valid capturedByUserId UUID" };
  }

  if (input.supersedesEvidenceId && !UUID_RE.test(input.supersedesEvidenceId)) {
    return { ok: false, error: "Evidence records require a valid supersedesEvidenceId UUID" };
  }

  return { ok: true };
}
