import {
  evaluateAllDecisionConditions,
} from "@/lib/platform/decision/scoring/framework";
import type {
  AppliedRule,
  CollectedEvidence,
  DecisionDefinition,
} from "@/lib/platform/decision/types";

export interface RuleEngineContext {
  definition: DecisionDefinition;
  inputs: Record<string, unknown>;
  evidence: CollectedEvidence;
}

export interface RuleEngineResult {
  rulesApplied: AppliedRule[];
  facts: Record<string, unknown>;
}

export interface RuleEngine {
  evaluate(context: RuleEngineContext): RuleEngineResult | Promise<RuleEngineResult>;
}

function buildFacts(
  inputs: Record<string, unknown>,
  evidence: CollectedEvidence
): Record<string, unknown> {
  const facts: Record<string, unknown> = { ...inputs };
  for (const item of evidence.items) {
    facts[item.key] = item.value;
  }
  return facts;
}

/** Default rule engine — evaluates registered decision rules against collected facts. */
export const defaultRuleEngine: RuleEngine = {
  evaluate(context) {
    const facts = buildFacts(context.inputs, context.evidence);
    const rulesApplied: AppliedRule[] = [];

    const sortedRules = [...context.definition.rules].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );

    for (const rule of sortedRules) {
      const matched = evaluateAllDecisionConditions(rule.conditions, facts);
      rulesApplied.push({
        ruleKey: rule.key,
        label: rule.label,
        matched,
        weight: rule.weight ?? (matched ? 50 : 0),
        outcomeKey: rule.outcomeKey,
        reason: matched
          ? `Rule "${rule.label}" matched`
          : rule.conditions?.length
            ? `Rule "${rule.label}" conditions not satisfied`
            : `Rule "${rule.label}" applied as fallback`,
      });
    }

    return { rulesApplied, facts };
  },
};

const RULE_ENGINES = new Map<string, RuleEngine>();

export function registerRuleEngine(key: string, engine: RuleEngine): void {
  RULE_ENGINES.set(key, engine);
}

export function getRuleEngine(key = "default"): RuleEngine {
  return RULE_ENGINES.get(key) ?? defaultRuleEngine;
}

export function evaluateDecisionRules(
  context: RuleEngineContext,
  engineKey = "default"
): RuleEngineResult | Promise<RuleEngineResult> {
  return getRuleEngine(engineKey).evaluate(context);
}
