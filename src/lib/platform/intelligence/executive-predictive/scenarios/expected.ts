import type { ScenarioKind } from "@/lib/platform/intelligence/executive-predictive/types";

export const EXPECTED_CASE_KIND: ScenarioKind = "expected";
export const EXPECTED_CASE_MAGNITUDE = 0;
export const EXPECTED_CASE_LABEL = "Expected case";

export function expectedCaseNarrative(period: string): string {
  return `Expected case for ${period}: trend continuation under stated assumptions if leadership takes no extraordinary action.`;
}
