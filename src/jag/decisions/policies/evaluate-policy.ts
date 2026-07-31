import type {
  DecisionConflictStrategy,
  DecisionPolicy,
  DecisionRule,
} from "@/jag/decisions/contracts/definitions";
import {
  evaluateAllConditions,
  type ConditionEval,
} from "@/jag/decisions/policies/conditions";

export type MatchedRule = {
  readonly policyId: string;
  readonly rule: DecisionRule;
};

export type PolicyEvaluation = {
  readonly policyId: string;
  readonly matched: MatchedRule[];
  readonly unmet: Array<{
    policyId: string;
    ruleId: string;
    conditions: ConditionEval[];
  }>;
  readonly rulesEvaluated: number;
  readonly selected: MatchedRule | null;
};

function sortRules(
  rules: readonly DecisionRule[],
  strategy: DecisionConflictStrategy
): DecisionRule[] {
  const copy = [...rules];
  if (strategy === "highest_priority" || strategy === "deny_overrides" || strategy === "permit_overrides") {
    return copy.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  }
  // first_match / last_match: stable by priority desc then id for determinism
  return copy.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
}

function selectByStrategy(
  matched: MatchedRule[],
  strategy: DecisionConflictStrategy
): MatchedRule | null {
  if (matched.length === 0) return null;
  switch (strategy) {
    case "first_match":
      return matched[0]!;
    case "last_match":
      return matched[matched.length - 1]!;
    case "highest_priority":
      return [...matched].sort(
        (a, b) =>
          b.rule.priority - a.rule.priority ||
          a.rule.id.localeCompare(b.rule.id)
      )[0]!;
    case "deny_overrides": {
      const deny = matched.find((m) => m.rule.outcome === "deny");
      return deny ?? matched[0]!;
    }
    case "permit_overrides": {
      const permit = matched.find((m) => m.rule.outcome === "permit");
      return permit ?? matched[0]!;
    }
    default:
      return matched[0]!;
  }
}

export function evaluatePolicy(
  policy: DecisionPolicy,
  facts: Readonly<Record<string, unknown>>
): PolicyEvaluation {
  if (policy.enabled === false) {
    return {
      policyId: policy.id,
      matched: [],
      unmet: [],
      rulesEvaluated: 0,
      selected: null,
    };
  }

  const strategy = policy.conflictStrategy ?? "first_match";
  const rules = sortRules(policy.rules, strategy);
  const matched: MatchedRule[] = [];
  const unmet: PolicyEvaluation["unmet"] = [];
  let rulesEvaluated = 0;

  for (const rule of rules) {
    rulesEvaluated += 1;
    const cond = evaluateAllConditions(rule.conditions, facts);
    if (cond.matched) {
      matched.push({ policyId: policy.id, rule });
      if (rule.onMatch !== "continue" && strategy === "first_match") {
        break;
      }
    } else {
      unmet.push({
        policyId: policy.id,
        ruleId: rule.id,
        conditions: cond.results.filter((r) => !r.matched),
      });
    }
  }

  return {
    policyId: policy.id,
    matched,
    unmet,
    rulesEvaluated,
    selected: selectByStrategy(matched, strategy),
  };
}

/** Policies ordered by precedence descending, then id. */
export function orderPolicies(
  policies: readonly DecisionPolicy[]
): DecisionPolicy[] {
  return [...policies].sort(
    (a, b) => b.precedence - a.precedence || a.id.localeCompare(b.id)
  );
}
