/**
 * Fact fixtures for Admissions Eligibility evaluation tests.
 * Not a Vitest suite — imported by tests/unit/jag-os.
 */

import {
  ACADEMY_ELIGIBILITY_FACT_PATHS,
  ACADEMY_ELIGIBILITY_MIN_AGE,
} from "@/packages/academy/decisions/admissions/rules";

export function eligibleFacts(
  overrides?: Record<string, unknown>
): Record<string, unknown> {
  return {
    application: { complete: true },
    documents: { requiredPresent: true },
    applicant: { age: ACADEMY_ELIGIBILITY_MIN_AGE + 5 },
    residency: { required: false, satisfied: false },
    program: { eligible: true, startMonth: 9 },
    ...flattenOverrides(overrides),
  };
}

export function eligibleFactsWithAugustWarning(): Record<string, unknown> {
  return eligibleFacts({
    program: { eligible: true, startMonth: 8 },
  });
}

export function incompleteApplicationFacts(): Record<string, unknown> {
  return eligibleFacts({
    application: { complete: false },
  });
}

export function missingDocumentsFacts(): Record<string, unknown> {
  return eligibleFacts({
    documents: { requiredPresent: false },
  });
}

export function tooYoungFacts(): Record<string, unknown> {
  return eligibleFacts({
    applicant: { age: ACADEMY_ELIGIBILITY_MIN_AGE - 1 },
  });
}

export function residencyFailedFacts(): Record<string, unknown> {
  return eligibleFacts({
    residency: { required: true, satisfied: false },
  });
}

export function residencyOkFacts(): Record<string, unknown> {
  return eligibleFacts({
    residency: { required: true, satisfied: true },
  });
}

export function programIneligibleFacts(): Record<string, unknown> {
  return eligibleFacts({
    program: { eligible: false, startMonth: 9 },
  });
}

/** Merge nested override objects shallowly onto the base shape. */
function flattenOverrides(
  overrides?: Record<string, unknown>
): Record<string, unknown> {
  if (!overrides) return {};
  return overrides;
}

export const ACADEMY_ELIGIBILITY_TEST_PATHS = ACADEMY_ELIGIBILITY_FACT_PATHS;
