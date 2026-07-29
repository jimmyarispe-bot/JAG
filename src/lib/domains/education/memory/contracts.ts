/**
 * Education memory contribution contracts — no persistence.
 */

import type { PublicationContributionInput } from "@/lib/jag/runtime";

export const EDUCATION_MEMORY_KINDS = [
  "education.outcome",
  "education.intervention",
  "education.note",
  "education.milestone",
] as const;

export type EducationMemoryKind = (typeof EDUCATION_MEMORY_KINDS)[number];

export interface EducationMemoryContributionContract {
  id: string;
  kinds: readonly EducationMemoryKind[];
  supports?(input: PublicationContributionInput): boolean;
  publish?(input: PublicationContributionInput): readonly never[];
}
