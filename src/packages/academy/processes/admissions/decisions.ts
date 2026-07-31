/**
 * Admissions process — decision references (by id).
 * Real decision lives under src/packages/academy/decisions/.
 */

export {
  AcademyAdmissionsEligibilityDecision,
  ACADEMY_ADMISSIONS_ELIGIBILITY_DECISION_ID,
} from "@/packages/academy/decisions/admissions/definition";

import { AcademyAdmissionsEligibilityDecision } from "@/packages/academy/decisions/admissions/definition";
import { ACADEMY_ADMISSIONS_ELIGIBILITY_DECISION_ID } from "@/packages/academy/decisions/admissions/definition";

/** @deprecated Use AcademyAdmissionsEligibilityDecision — kept for Sprint 011 import paths. */
export const ACADEMY_ADMISSIONS_ELIGIBILITY_DECISION =
  AcademyAdmissionsEligibilityDecision;

export const ACADEMY_ADMISSIONS_DECISION_IDS = {
  eligibility: ACADEMY_ADMISSIONS_ELIGIBILITY_DECISION_ID,
} as const;

export const ACADEMY_ADMISSIONS_DECISION_DEFINITIONS = Object.freeze([
  AcademyAdmissionsEligibilityDecision,
]);

export const ACADEMY_ADMISSIONS_DECISION_DEFINITION_IDS = Object.freeze([
  ACADEMY_ADMISSIONS_ELIGIBILITY_DECISION_ID,
] as const);
