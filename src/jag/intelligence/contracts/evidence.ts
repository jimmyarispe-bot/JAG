/**
 * Evidence — grounded reference into the organizational model.
 */

import type { OrganizationalEvidenceKind } from "@/jag/intelligence/evidence/reference-kinds";

export type EvidenceReference = {
  readonly kind: OrganizationalEvidenceKind;
  /** Stable id of the referenced organizational artifact. */
  readonly refId: string;
  readonly label?: string;
  readonly path?: string;
};

export type Evidence = {
  readonly id: string;
  readonly summary: string;
  readonly references: readonly EvidenceReference[];
  readonly collectedAt?: string;
  readonly sourceCapabilityIds?: readonly string[];
};

/** Structural shape only — organizational kind policy is enforced by validators. */
export function isEvidenceReference(value: unknown): value is EvidenceReference {
  if (!value || typeof value !== "object") return false;
  const v = value as EvidenceReference;
  return (
    typeof v.kind === "string" &&
    v.kind.length > 0 &&
    typeof v.refId === "string" &&
    v.refId.length > 0
  );
}

export function isEvidence(value: unknown): value is Evidence {
  if (!value || typeof value !== "object") return false;
  const v = value as Evidence;
  return (
    typeof v.id === "string" &&
    v.id.length > 0 &&
    typeof v.summary === "string" &&
    Array.isArray(v.references) &&
    v.references.length > 0 &&
    v.references.every(isEvidenceReference)
  );
}
