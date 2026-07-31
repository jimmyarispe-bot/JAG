/**
 * Admissions eligibility — declarative policies (data-driven).
 */

import type { DecisionPolicy } from "@/jag/decisions";
import {
  ACADEMY_ELIGIBILITY_RULE_GROUPS,
  RULE_AGE_OK,
  RULE_AGE_TOO_YOUNG,
  RULE_APPLICATION_INCOMPLETE,
  RULE_DOCUMENTS_MISSING,
  RULE_DOCUMENTS_OK,
  RULE_ELIGIBLE,
  RULE_PROGRAM_INELIGIBLE,
  RULE_PROGRAM_STARTS_AUGUST,
  RULE_RESIDENCY_OK_OPTIONAL,
  RULE_RESIDENCY_UNSATISFIED,
} from "@/packages/academy/decisions/admissions/rules";

/** Higher precedence = evaluated earlier for outcome selection. */
export const ACADEMY_ADMISSIONS_ELIGIBILITY_POLICIES: readonly DecisionPolicy[] =
  Object.freeze([
    Object.freeze({
      id: "policy.required.application",
      label: "Required application complete",
      description: "Application must be marked complete",
      precedence: 500,
      groupId: ACADEMY_ELIGIBILITY_RULE_GROUPS.required,
      conflictStrategy: "first_match" as const,
      rules: Object.freeze([RULE_APPLICATION_INCOMPLETE]),
    }),
    Object.freeze({
      id: "policy.required.documents",
      label: "Required documents present",
      description: "Required admissions documents must be present",
      precedence: 490,
      groupId: ACADEMY_ELIGIBILITY_RULE_GROUPS.required,
      conflictStrategy: "first_match" as const,
      rules: Object.freeze([RULE_DOCUMENTS_MISSING]),
    }),
    Object.freeze({
      id: "policy.required.age",
      label: "Student age requirements",
      description: "Applicant must meet minimum age",
      precedence: 480,
      groupId: ACADEMY_ELIGIBILITY_RULE_GROUPS.required,
      conflictStrategy: "first_match" as const,
      rules: Object.freeze([RULE_AGE_TOO_YOUNG]),
    }),
    Object.freeze({
      id: "policy.required.residency",
      label: "Residency requirements",
      description: "When residency is required, it must be satisfied",
      precedence: 470,
      groupId: ACADEMY_ELIGIBILITY_RULE_GROUPS.required,
      conflictStrategy: "first_match" as const,
      rules: Object.freeze([RULE_RESIDENCY_UNSATISFIED]),
    }),
    Object.freeze({
      id: "policy.required.program",
      label: "Program eligibility",
      description: "Applicant must be eligible for the selected program",
      precedence: 460,
      groupId: ACADEMY_ELIGIBILITY_RULE_GROUPS.required,
      conflictStrategy: "first_match" as const,
      rules: Object.freeze([RULE_PROGRAM_INELIGIBLE]),
    }),
    Object.freeze({
      id: "policy.required.eligible",
      label: "Eligibility granted",
      description: "All required gates satisfied",
      precedence: 200,
      groupId: ACADEMY_ELIGIBILITY_RULE_GROUPS.required,
      conflictStrategy: "first_match" as const,
      rules: Object.freeze([RULE_ELIGIBLE]),
    }),
    Object.freeze({
      id: "policy.informational.checks",
      label: "Informational eligibility checks",
      description: "Positive checkmarks for explanation surface",
      precedence: 100,
      groupId: ACADEMY_ELIGIBILITY_RULE_GROUPS.informational,
      conflictStrategy: "first_match" as const,
      rules: Object.freeze([RULE_DOCUMENTS_OK, RULE_AGE_OK]),
    }),
    Object.freeze({
      id: "policy.optional.residency",
      label: "Optional residency confirmation",
      description: "Surfaces residency satisfaction when applicable",
      precedence: 90,
      groupId: ACADEMY_ELIGIBILITY_RULE_GROUPS.optional,
      conflictStrategy: "first_match" as const,
      rules: Object.freeze([RULE_RESIDENCY_OK_OPTIONAL]),
    }),
    Object.freeze({
      id: "policy.warnings.program_calendar",
      label: "Program calendar warnings",
      description: "Non-blocking warnings about program start",
      precedence: 50,
      groupId: ACADEMY_ELIGIBILITY_RULE_GROUPS.warnings,
      conflictStrategy: "first_match" as const,
      rules: Object.freeze([RULE_PROGRAM_STARTS_AUGUST]),
    }),
  ]);
