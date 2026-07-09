import type { PlatformEvidenceRecord } from "@/lib/platform/evidence/types";
import { getUlrCompetency } from "@/lib/platform/ulr/registry/registry";
import {
  PAJ_MASTERY_LEVELS,
  type PajEvidenceBundleResult,
  type PajMasteryLevel,
} from "@/lib/platform/paj/types";

const EDUCATOR_ROLES = new Set(["teacher", "system"]);

/** PA-L3-bundle rules — Doc 98 Part II · Doc 105 §5.2 */
export function evaluateEvidenceBundle(
  competencyKey: string,
  records: Array<Pick<PlatformEvidenceRecord, "evidence_type_key" | "evidence_confidence" | "captured_by_role">>
): PajEvidenceBundleResult {
  const competency = getUlrCompetency(competencyKey);
  const minEvidence = competency?.minimumEvidenceCount ?? 2;
  const issues: string[] = [];

  if (records.length < minEvidence) {
    issues.push(`Minimum evidence count ${minEvidence} not met (${records.length})`);
  }

  const evidenceTypes = new Set(records.map((r) => r.evidence_type_key));
  const minTypesMet = evidenceTypes.size >= 2;
  if (!minTypesMet) {
    issues.push("PA-L3-bundle requires at least 2 evidence types");
  }

  const educatorRecords = records.filter((r) => EDUCATOR_ROLES.has(r.captured_by_role));
  const educatorRequired = educatorRecords.length === 0;
  if (educatorRequired) {
    issues.push("At least one educator-sourced evidence record required");
  }

  const parentOnly =
    records.length > 0 &&
    records.every((r) => r.captured_by_role === "parent");

  const avgConfidence =
    records.length > 0 ?
      records.reduce((sum, r) => sum + r.evidence_confidence, 0) / records.length
    : 0;

  const confidenceMet = parentOnly ? avgConfidence <= 0.55 : avgConfidence >= 0.75;
  if (!confidenceMet && !parentOnly) {
    issues.push("Aggregate evidence confidence must be ≥ 0.75");
  }

  let suggestedLevel: PajMasteryLevel = PAJ_MASTERY_LEVELS.NOT_STARTED;
  if (records.length === 0) {
    suggestedLevel = PAJ_MASTERY_LEVELS.NOT_STARTED;
  } else if (records.length === 1) {
    suggestedLevel = PAJ_MASTERY_LEVELS.EMERGING;
  } else if (!minTypesMet || educatorRequired) {
    suggestedLevel = PAJ_MASTERY_LEVELS.DEVELOPING;
  } else if (confidenceMet && minTypesMet && records.length >= minEvidence) {
    suggestedLevel = PAJ_MASTERY_LEVELS.PROFICIENT;
  } else {
    suggestedLevel = PAJ_MASTERY_LEVELS.DEVELOPING;
  }

  return {
    ok: issues.length === 0 && suggestedLevel >= PAJ_MASTERY_LEVELS.PROFICIENT,
    suggestedLevel,
    educatorRequired,
    minTypesMet,
    confidenceMet,
    parentOnly,
    issues,
  };
}

export function canAdvanceFromCompetency(input: {
  masteryLevel: PajMasteryLevel;
  educatorConfirmed: boolean;
}): { ok: boolean; reason?: string } {
  if (input.masteryLevel < PAJ_MASTERY_LEVELS.PROFICIENT) {
    return { ok: false, reason: "PAJ-PA-1: mastery level 3 required before advance" };
  }
  if (!input.educatorConfirmed) {
    return { ok: false, reason: "Educator confirmation required before advance" };
  }
  return { ok: true };
}

export function resolveNextCompetencyKey(currentCompetencyKey: string): string | null {
  const competency = getUlrCompetency(currentCompetencyKey);
  return competency?.nextCompetencyKeys[0] ?? null;
}
