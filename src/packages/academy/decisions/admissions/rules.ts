/**
 * Admissions eligibility — declarative rule atoms (Decision Engine).
 * No execution logic.
 */

import type { DecisionRule } from "@/jag/decisions";

/** Rule group kinds (documentation / filtering via policy.groupId). */
export const ACADEMY_ELIGIBILITY_RULE_GROUPS = {
  required: "required",
  optional: "optional",
  warnings: "warnings",
  informational: "informational",
} as const;

export const ACADEMY_ELIGIBILITY_OUTCOMES = {
  eligible: "eligible",
  ineligible: "ineligible",
  undetermined: "undetermined",
} as const;

/** Facts expected by eligibility rules (documented inputs). */
export const ACADEMY_ELIGIBILITY_FACT_PATHS = {
  applicationComplete: "application.complete",
  documentsRequiredPresent: "documents.requiredPresent",
  applicantAge: "applicant.age",
  residencyRequired: "residency.required",
  residencySatisfied: "residency.satisfied",
  programEligible: "program.eligible",
  programStartMonth: "program.startMonth",
} as const;

export const ACADEMY_ELIGIBILITY_MIN_AGE = 5;

export const RULE_APPLICATION_INCOMPLETE: DecisionRule = Object.freeze({
  id: "rule.required.application_incomplete",
  label: "Application incomplete",
  priority: 100,
  outcome: ACADEMY_ELIGIBILITY_OUTCOMES.ineligible,
  rationale: "✗ Application complete",
  conditions: Object.freeze([
    Object.freeze({
      path: ACADEMY_ELIGIBILITY_FACT_PATHS.applicationComplete,
      operator: "falsy" as const,
    }),
  ]),
});

export const RULE_DOCUMENTS_MISSING: DecisionRule = Object.freeze({
  id: "rule.required.documents_missing",
  label: "Required documents missing",
  priority: 100,
  outcome: ACADEMY_ELIGIBILITY_OUTCOMES.ineligible,
  rationale: "✗ Required documents received",
  conditions: Object.freeze([
    Object.freeze({
      path: ACADEMY_ELIGIBILITY_FACT_PATHS.documentsRequiredPresent,
      operator: "falsy" as const,
    }),
  ]),
});

export const RULE_AGE_TOO_YOUNG: DecisionRule = Object.freeze({
  id: "rule.required.age_too_young",
  label: "Applicant below minimum age",
  priority: 100,
  outcome: ACADEMY_ELIGIBILITY_OUTCOMES.ineligible,
  rationale: "✗ Age requirement satisfied",
  conditions: Object.freeze([
    Object.freeze({
      path: ACADEMY_ELIGIBILITY_FACT_PATHS.applicantAge,
      operator: "exists" as const,
    }),
    Object.freeze({
      path: ACADEMY_ELIGIBILITY_FACT_PATHS.applicantAge,
      operator: "lt" as const,
      value: ACADEMY_ELIGIBILITY_MIN_AGE,
    }),
  ]),
});

export const RULE_RESIDENCY_UNSATISFIED: DecisionRule = Object.freeze({
  id: "rule.required.residency_unsatisfied",
  label: "Residency requirement not met",
  priority: 100,
  outcome: ACADEMY_ELIGIBILITY_OUTCOMES.ineligible,
  rationale: "✗ Residency requirement satisfied",
  conditions: Object.freeze([
    Object.freeze({
      path: ACADEMY_ELIGIBILITY_FACT_PATHS.residencyRequired,
      operator: "truthy" as const,
    }),
    Object.freeze({
      path: ACADEMY_ELIGIBILITY_FACT_PATHS.residencySatisfied,
      operator: "falsy" as const,
    }),
  ]),
});

export const RULE_PROGRAM_INELIGIBLE: DecisionRule = Object.freeze({
  id: "rule.required.program_ineligible",
  label: "Program eligibility not met",
  priority: 100,
  outcome: ACADEMY_ELIGIBILITY_OUTCOMES.ineligible,
  rationale: "✗ Program eligibility satisfied",
  conditions: Object.freeze([
    Object.freeze({
      path: ACADEMY_ELIGIBILITY_FACT_PATHS.programEligible,
      operator: "falsy" as const,
    }),
  ]),
});

/** Positive eligibility — all required gates pass. */
export const RULE_ELIGIBLE: DecisionRule = Object.freeze({
  id: "rule.required.eligible",
  label: "Eligible for admission",
  priority: 50,
  outcome: ACADEMY_ELIGIBILITY_OUTCOMES.eligible,
  rationale: "✓ Application complete",
  onMatch: "continue" as const,
  conditions: Object.freeze([
    Object.freeze({
      path: ACADEMY_ELIGIBILITY_FACT_PATHS.applicationComplete,
      operator: "truthy" as const,
    }),
    Object.freeze({
      path: ACADEMY_ELIGIBILITY_FACT_PATHS.documentsRequiredPresent,
      operator: "truthy" as const,
    }),
    Object.freeze({
      path: ACADEMY_ELIGIBILITY_FACT_PATHS.applicantAge,
      operator: "gte" as const,
      value: ACADEMY_ELIGIBILITY_MIN_AGE,
    }),
    Object.freeze({
      path: ACADEMY_ELIGIBILITY_FACT_PATHS.programEligible,
      operator: "truthy" as const,
    }),
  ]),
});

export const RULE_DOCUMENTS_OK: DecisionRule = Object.freeze({
  id: "rule.informational.documents_ok",
  label: "Required documents present",
  priority: 40,
  outcome: ACADEMY_ELIGIBILITY_OUTCOMES.eligible,
  rationale: "✓ Required documents received",
  onMatch: "continue" as const,
  conditions: Object.freeze([
    Object.freeze({
      path: ACADEMY_ELIGIBILITY_FACT_PATHS.documentsRequiredPresent,
      operator: "truthy" as const,
    }),
  ]),
});

export const RULE_AGE_OK: DecisionRule = Object.freeze({
  id: "rule.informational.age_ok",
  label: "Age requirement satisfied",
  priority: 30,
  outcome: ACADEMY_ELIGIBILITY_OUTCOMES.eligible,
  rationale: "✓ Age requirement satisfied",
  onMatch: "continue" as const,
  conditions: Object.freeze([
    Object.freeze({
      path: ACADEMY_ELIGIBILITY_FACT_PATHS.applicantAge,
      operator: "gte" as const,
      value: ACADEMY_ELIGIBILITY_MIN_AGE,
    }),
  ]),
});

export const RULE_RESIDENCY_OK_OPTIONAL: DecisionRule = Object.freeze({
  id: "rule.optional.residency_ok",
  label: "Residency satisfied when required",
  priority: 20,
  outcome: ACADEMY_ELIGIBILITY_OUTCOMES.eligible,
  rationale: "✓ Residency requirement satisfied",
  onMatch: "continue" as const,
  conditions: Object.freeze([
    Object.freeze({
      path: ACADEMY_ELIGIBILITY_FACT_PATHS.residencyRequired,
      operator: "truthy" as const,
    }),
    Object.freeze({
      path: ACADEMY_ELIGIBILITY_FACT_PATHS.residencySatisfied,
      operator: "truthy" as const,
    }),
  ]),
});

export const RULE_PROGRAM_STARTS_AUGUST: DecisionRule = Object.freeze({
  id: "rule.warnings.program_starts_august",
  label: "Program begins in August",
  priority: 10,
  outcome: ACADEMY_ELIGIBILITY_OUTCOMES.eligible,
  rationale: "Warning: Program begins in August",
  onMatch: "continue" as const,
  conditions: Object.freeze([
    Object.freeze({
      path: ACADEMY_ELIGIBILITY_FACT_PATHS.programStartMonth,
      operator: "eq" as const,
      value: 8,
    }),
  ]),
});
