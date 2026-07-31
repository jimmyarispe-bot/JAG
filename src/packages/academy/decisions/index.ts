/**
 * Academy decision definitions — package-owned, evaluated by JAG.
 */

export {
  AcademyAdmissionsEligibilityDecision,
  ACADEMY_ADMISSIONS_ELIGIBILITY_DECISION_ID,
  ACADEMY_ADMISSIONS_ELIGIBILITY_POLICIES,
  ACADEMY_ELIGIBILITY_OUTCOMES,
  ACADEMY_ELIGIBILITY_RULE_GROUPS,
  formatAdmissionsEligibilityExplanation,
  eligibleFacts,
  eligibleFactsWithAugustWarning,
  incompleteApplicationFacts,
  missingDocumentsFacts,
  tooYoungFacts,
  residencyFailedFacts,
  residencyOkFacts,
  programIneligibleFacts,
} from "@/packages/academy/decisions/admissions";

import { AcademyAdmissionsEligibilityDecision } from "@/packages/academy/decisions/admissions/definition";

export const ACADEMY_DECISION_DEFINITIONS = Object.freeze([
  AcademyAdmissionsEligibilityDecision,
]);

export const ACADEMY_DECISION_DEFINITION_IDS = Object.freeze([
  AcademyAdmissionsEligibilityDecision.id,
] as const);
