import type {
  DecisionDefinition,
  DecisionExplanation,
  DecisionReason,
} from "@/jag/decisions/contracts/definitions";
import type { PolicyEvaluation } from "@/jag/decisions/policies/evaluate-policy";

export function buildExplanation(input: {
  definition: DecisionDefinition;
  evaluations: readonly PolicyEvaluation[];
  outcome: string;
  defaultApplied: boolean;
  selectedPolicyId?: string;
  selectedRuleId?: string;
}): DecisionExplanation {
  const contributingRules = input.evaluations.flatMap((ev) =>
    ev.matched.map((m) => ({
      policyId: m.policyId,
      ruleId: m.rule.id,
      outcome: m.rule.outcome,
      rationale: m.rule.rationale,
      priority: m.rule.priority,
    }))
  );

  const unmetConditions = input.evaluations.flatMap((ev) =>
    ev.unmet.flatMap((u) =>
      u.conditions.map((c) => ({
        policyId: u.policyId,
        ruleId: u.ruleId,
        path: c.path,
        operator: c.operator,
        expected: c.expected,
        actual: c.actual,
      }))
    )
  );

  const rationaleChain: DecisionReason[] = [];
  rationaleChain.push({
    code: "decision.start",
    message: `Evaluating decision "${input.definition.id}"`,
  });

  for (const ev of input.evaluations) {
    rationaleChain.push({
      code: "policy.evaluated",
      message: `Policy "${ev.policyId}" evaluated (${ev.rulesEvaluated} rules)`,
      policyId: ev.policyId,
    });
    if (ev.selected) {
      rationaleChain.push({
        code: "rule.matched",
        message:
          ev.selected.rule.rationale ??
          `Rule "${ev.selected.rule.id}" matched → ${ev.selected.rule.outcome}`,
        policyId: ev.selected.policyId,
        ruleId: ev.selected.rule.id,
      });
    }
  }

  if (input.defaultApplied) {
    rationaleChain.push({
      code: "outcome.default",
      message: `No rule matched; applying defaultOutcome "${input.outcome}"`,
    });
  } else {
    rationaleChain.push({
      code: "outcome.selected",
      message: `Selected outcome "${input.outcome}"`,
      policyId: input.selectedPolicyId,
      ruleId: input.selectedRuleId,
    });
  }

  const matchedCount = contributingRules.length;
  const confidence =
    matchedCount === 0
      ? { score: 0.5, basis: "default_outcome" }
      : {
          score: Math.min(1, 0.6 + matchedCount * 0.1),
          basis: "rule_matches",
        };

  return {
    outcome: input.outcome,
    defaultApplied: input.defaultApplied,
    contributingRules,
    unmetConditions,
    rationaleChain,
    confidence,
  };
}
