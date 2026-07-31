export {
  AcademyAdmissionsEligibilityDecision,
  ACADEMY_ADMISSIONS_ELIGIBILITY_DECISION_ID,
} from "@/packages/academy/decisions/admissions/definition";
export { ACADEMY_ADMISSIONS_ELIGIBILITY_POLICIES } from "@/packages/academy/decisions/admissions/policies";
export {
  ACADEMY_ELIGIBILITY_FACT_PATHS,
  ACADEMY_ELIGIBILITY_MIN_AGE,
  ACADEMY_ELIGIBILITY_OUTCOMES,
  ACADEMY_ELIGIBILITY_RULE_GROUPS,
} from "@/packages/academy/decisions/admissions/rules";
export {
  formatAdmissionsEligibilityExplanation,
  ACADEMY_ELIGIBILITY_RATIONALES,
  type EligibilityExplanationView,
} from "@/packages/academy/decisions/admissions/explanations";
export {
  eligibleFacts,
  eligibleFactsWithAugustWarning,
  incompleteApplicationFacts,
  missingDocumentsFacts,
  tooYoungFacts,
  residencyFailedFacts,
  residencyOkFacts,
  programIneligibleFacts,
} from "@/packages/academy/decisions/admissions/tests";
