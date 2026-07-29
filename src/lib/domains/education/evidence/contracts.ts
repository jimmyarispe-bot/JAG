/**
 * Education evidence contribution contracts — no storage or processing.
 */

import type { PublicationContributionInput } from "@/lib/jag/runtime";

/** Declared Education evidence source tokens. */
export const EDUCATION_EVIDENCE_SOURCES = [
  "education.enrollment",
  "education.attendance",
  "education.assessment",
  "education.progress",
  "education.communication",
] as const;

export type EducationEvidenceSource =
  (typeof EDUCATION_EVIDENCE_SOURCES)[number];

export interface EducationEvidenceContributionContract {
  id: string;
  sources: readonly EducationEvidenceSource[];
  supports?(input: PublicationContributionInput): boolean;
  /** Foundation: collect/publish deferred. */
  collect?(input: PublicationContributionInput): readonly never[];
  publish?(input: PublicationContributionInput): readonly never[];
}
