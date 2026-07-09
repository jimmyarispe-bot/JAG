import type { RuleEvaluationResult, RuleExplanation } from "@/lib/platform/rules/types";

function collectFactsUsed(facts: Record<string, unknown>): string[] {
  return Object.keys(facts)
    .sort()
    .slice(0, 12)
    .map((key) => `${key}=${JSON.stringify(facts[key])}`);
}

export function buildRuleExplanation(result: RuleEvaluationResult): RuleExplanation {
  const matchedRuleSummary = result.matchedRules.map(
    (rule) => `${rule.label}: ${rule.reason} → ${rule.outcomeKey}`
  );

  const unmatchedRuleSummary = result.rulesEvaluated
    .filter((rule) => !rule.matched)
    .map((rule) => `${rule.label}: ${rule.reason}`);

  const primaryReason =
    result.primaryOutcome ?
      `Primary outcome "${result.primaryOutcome.label}" (${result.primaryOutcome.outcomeKey}) selected via ${result.evaluationMode} evaluation`
    : "No rules matched — no primary outcome";

  const summary =
    result.primaryOutcome ?
      `${result.ruleSetKey}: ${result.primaryOutcome.label}`
    : `${result.ruleSetKey}: no matching outcome`;

  return {
    summary,
    matchedRuleSummary,
    unmatchedRuleSummary,
    primaryReason,
    factsUsed: collectFactsUsed(result.facts),
  };
}
