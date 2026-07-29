/**
 * Education twin publication contracts — no twin engine.
 */

import type { PublicationContributionInput } from "@/lib/jag/runtime";

export const EDUCATION_TWIN_ENTITY_TYPES = [
  "education.student",
  "education.class",
  "education.enrollment",
  "education.program",
] as const;

export type EducationTwinEntityType =
  (typeof EDUCATION_TWIN_ENTITY_TYPES)[number];

export interface EducationTwinContributionContract {
  id: string;
  entityTypes: readonly EducationTwinEntityType[];
  supports?(input: PublicationContributionInput): boolean;
  publish?(input: PublicationContributionInput): readonly never[];
}
