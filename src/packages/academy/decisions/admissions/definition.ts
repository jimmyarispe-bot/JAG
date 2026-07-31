/**
 * AcademyAdmissionsEligibilityDecision — real package decision definition.
 * Packages define; JAG Decision Engine evaluates.
 */

import type { DecisionDefinition } from "@/jag/decisions";
import { ACADEMY_APPLICATION_ID, ACADEMY_PACKAGE_VERSION } from "@/packages/academy/package";
import { ACADEMY_ADMISSIONS_ELIGIBILITY_POLICIES } from "@/packages/academy/decisions/admissions/policies";
import {
  ACADEMY_ELIGIBILITY_FACT_PATHS,
  ACADEMY_ELIGIBILITY_MIN_AGE,
  ACADEMY_ELIGIBILITY_OUTCOMES,
  ACADEMY_ELIGIBILITY_RULE_GROUPS,
} from "@/packages/academy/decisions/admissions/rules";

export const ACADEMY_ADMISSIONS_ELIGIBILITY_DECISION_ID =
  "academy.decision.admissions.eligibility" as const;

/**
 * Executable admissions eligibility decision.
 * Same id as the Sprint 011 placeholder so the Admissions process keeps resolving by id.
 */
export const AcademyAdmissionsEligibilityDecision: DecisionDefinition =
  Object.freeze({
    id: ACADEMY_ADMISSIONS_ELIGIBILITY_DECISION_ID,
    applicationId: ACADEMY_APPLICATION_ID,
    version: ACADEMY_PACKAGE_VERSION,
    label: "Academy Admissions Eligibility",
    description:
      "Determines whether an applicant is eligible for admission based on application completeness, documents, age, residency (when required), and program eligibility.",
    defaultOutcome: ACADEMY_ELIGIBILITY_OUTCOMES.undetermined,
    policies: ACADEMY_ADMISSIONS_ELIGIBILITY_POLICIES,
    metadata: Object.freeze({
      decisionKind: "admissions.eligibility",
      ruleGroups: Object.freeze([
        ACADEMY_ELIGIBILITY_RULE_GROUPS.required,
        ACADEMY_ELIGIBILITY_RULE_GROUPS.optional,
        ACADEMY_ELIGIBILITY_RULE_GROUPS.warnings,
        ACADEMY_ELIGIBILITY_RULE_GROUPS.informational,
      ]),
      inputs: Object.freeze([
        Object.freeze({
          path: ACADEMY_ELIGIBILITY_FACT_PATHS.applicationComplete,
          type: "boolean",
          required: true,
        }),
        Object.freeze({
          path: ACADEMY_ELIGIBILITY_FACT_PATHS.documentsRequiredPresent,
          type: "boolean",
          required: true,
        }),
        Object.freeze({
          path: ACADEMY_ELIGIBILITY_FACT_PATHS.applicantAge,
          type: "number",
          required: true,
          min: ACADEMY_ELIGIBILITY_MIN_AGE,
        }),
        Object.freeze({
          path: ACADEMY_ELIGIBILITY_FACT_PATHS.residencyRequired,
          type: "boolean",
          required: false,
        }),
        Object.freeze({
          path: ACADEMY_ELIGIBILITY_FACT_PATHS.residencySatisfied,
          type: "boolean",
          required: false,
        }),
        Object.freeze({
          path: ACADEMY_ELIGIBILITY_FACT_PATHS.programEligible,
          type: "boolean",
          required: true,
        }),
        Object.freeze({
          path: ACADEMY_ELIGIBILITY_FACT_PATHS.programStartMonth,
          type: "number",
          required: false,
        }),
      ]),
      outputs: Object.freeze([
        Object.freeze({
          path: "outcome",
          values: Object.freeze([
            ACADEMY_ELIGIBILITY_OUTCOMES.eligible,
            ACADEMY_ELIGIBILITY_OUTCOMES.ineligible,
            ACADEMY_ELIGIBILITY_OUTCOMES.undetermined,
          ]),
        }),
        Object.freeze({
          path: "explanation",
          type: "DecisionExplanation",
        }),
      ]),
      explanationModel: "structured-rationale",
    }),
    extensions: Object.freeze({
      processDefinitionIds: Object.freeze([
        "academy.process.admissions",
      ] as const),
      formDefinitionIds: Object.freeze([
        "academyos.inquiry.create",
        "academyos.application.create",
      ] as const),
      entityTypeIds: Object.freeze([
        "Inquiry",
        "Application",
        "Student",
      ] as const),
    }),
  });
