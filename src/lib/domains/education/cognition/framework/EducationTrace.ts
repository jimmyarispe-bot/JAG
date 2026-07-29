/**
 * Standardized constitutional trace for Education intelligence.
 */

export const EDUCATION_CONSTITUTIONAL_LAWS = [
  "LAW_1_JAG_IS_THE_PRODUCT",
  "LAW_3_INTELLIGENCE_BEFORE_INTERFACES",
  "LAW_7_EVIDENCE_REQUIRED",
] as const;

export interface EducationConstitutionalTrace {
  domainPackageId: "education";
  contributorId: string;
  laws: readonly string[];
  rationale: string;
}

export function createEducationTrace(input: {
  contributorId: string;
  rationale: string;
  laws?: readonly string[];
}): EducationConstitutionalTrace {
  return {
    domainPackageId: "education",
    contributorId: input.contributorId,
    laws: input.laws ?? EDUCATION_CONSTITUTIONAL_LAWS,
    rationale: input.rationale,
  };
}
