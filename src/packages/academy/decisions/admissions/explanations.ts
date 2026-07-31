/**
 * Admissions eligibility — explanation presentation helpers.
 * Formats Decision Engine explanations; does not evaluate decisions.
 */

import type { DecisionExplanation } from "@/jag/decisions";

export type EligibilityExplanationView = {
  readonly outcome: string;
  readonly reasons: readonly string[];
  readonly warnings: readonly string[];
  readonly informational: readonly string[];
};

/**
 * Project engine explanation into the package's display shape:
 * Eligible / reasons (✓) / warnings.
 */
export function formatAdmissionsEligibilityExplanation(
  explanation: DecisionExplanation
): EligibilityExplanationView {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const informational: string[] = [];

  for (const rule of explanation.contributingRules) {
    const text = rule.rationale ?? rule.ruleId;
    if (text.startsWith("Warning:")) {
      warnings.push(text.replace(/^Warning:\s*/, ""));
    } else if (text.startsWith("✓")) {
      reasons.push(text);
    } else if (text.startsWith("✗")) {
      reasons.push(text);
    } else {
      informational.push(text);
    }
  }

  // Deduplicate while preserving order
  const uniq = (items: string[]) => [...new Set(items)];

  return {
    outcome: explanation.outcome,
    reasons: uniq(reasons),
    warnings: uniq(warnings),
    informational: uniq(informational),
  };
}

/** Stable rationale strings for tests / docs. */
export const ACADEMY_ELIGIBILITY_RATIONALES = {
  applicationComplete: "✓ Application complete",
  documentsReceived: "✓ Required documents received",
  ageSatisfied: "✓ Age requirement satisfied",
  residencySatisfied: "✓ Residency requirement satisfied",
  applicationIncomplete: "✗ Application complete",
  documentsMissing: "✗ Required documents received",
  ageFailed: "✗ Age requirement satisfied",
  residencyFailed: "✗ Residency requirement satisfied",
  programFailed: "✗ Program eligibility satisfied",
  programAugust: "Warning: Program begins in August",
} as const;
