import { evaluateRuleConditions } from "@/lib/platform/rules/conditions/evaluate";
import { getOutcomeFromSet } from "@/lib/platform/rules/registry/registry";
import type {
  EvaluatedRule,
  RuleEvaluationMode,
  RuleEvaluationResult,
  RuleOutcome,
  RuleSetDefinition,
} from "@/lib/platform/rules/types";
import { RULES_ENGINE_VERSION } from "@/lib/platform/rules/version";

export interface RuleEvaluatorContext {
  definition: RuleSetDefinition;
  facts: Record<string, unknown>;
  evaluationId: string;
}

function evaluateSingleRule(
  definition: RuleSetDefinition,
  rule: RuleSetDefinition["rules"][number],
  facts: Record<string, unknown>
): EvaluatedRule {
  const matched = evaluateRuleConditions(rule.conditions, facts);
  const sortOrder = rule.sortOrder ?? 0;
  const weight = rule.weight ?? (matched ? 50 : 0);

  let reason: string;
  if (matched) {
    reason =
      rule.conditions?.length ?
        `Rule "${rule.label}" matched all conditions`
      : `Rule "${rule.label}" applied as unconditional match`;
  } else {
    reason =
      rule.conditions?.length ?
        `Rule "${rule.label}" conditions not satisfied`
      : `Rule "${rule.label}" did not match`;
  }

  return {
    ruleKey: rule.ruleKey,
    label: rule.label,
    matched,
    outcomeKey: rule.outcomeKey,
    weight,
    sortOrder,
    reason,
  };
}

function buildOutcome(
  definition: RuleSetDefinition,
  outcomeKey: string,
  score?: number
): RuleOutcome | null {
  const outcomeDef = getOutcomeFromSet(definition, outcomeKey);
  if (!outcomeDef) return null;

  return {
    outcomeKey: outcomeDef.outcomeKey,
    label: outcomeDef.label,
    description: outcomeDef.description,
    effects: outcomeDef.effects,
    score,
    metadata: outcomeDef.metadata,
  };
}

function resolveFirstMatch(
  definition: RuleSetDefinition,
  evaluated: EvaluatedRule[]
): RuleOutcome | null {
  const matched = evaluated
    .filter((rule) => rule.matched)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const primary = matched[0];
  if (!primary) return null;
  return buildOutcome(definition, primary.outcomeKey);
}

function resolveAllMatch(
  definition: RuleSetDefinition,
  evaluated: EvaluatedRule[]
): RuleOutcome[] {
  return evaluated
    .filter((rule) => rule.matched)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((rule) => buildOutcome(definition, rule.outcomeKey))
    .filter((outcome): outcome is RuleOutcome => outcome !== null);
}

function resolveWeighted(
  definition: RuleSetDefinition,
  evaluated: EvaluatedRule[]
): RuleOutcome | null {
  const scoreMap = new Map<string, number>();

  for (const rule of evaluated) {
    if (!rule.matched) continue;
    scoreMap.set(rule.outcomeKey, (scoreMap.get(rule.outcomeKey) ?? 0) + rule.weight);
  }

  let bestKey: string | null = null;
  let bestScore = -1;
  for (const [outcomeKey, score] of scoreMap) {
    if (score > bestScore) {
      bestScore = score;
      bestKey = outcomeKey;
    }
  }

  if (!bestKey) return null;
  return buildOutcome(definition, bestKey, bestScore);
}

export function evaluateRulesForSet(context: RuleEvaluatorContext): RuleEvaluationResult {
  const { definition, facts, evaluationId } = context;
  const evaluatedAt = new Date().toISOString();

  const sortedRules = [...definition.rules].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  const rulesEvaluated = sortedRules.map((rule) => evaluateSingleRule(definition, rule, facts));
  const matchedRules = rulesEvaluated.filter((rule) => rule.matched);

  let primaryOutcome: RuleOutcome | null = null;
  let allOutcomes: RuleOutcome[] = [];

  switch (definition.evaluationMode as RuleEvaluationMode) {
    case "all_match":
      allOutcomes = resolveAllMatch(definition, rulesEvaluated);
      primaryOutcome = allOutcomes[0] ?? null;
      break;
    case "weighted":
      primaryOutcome = resolveWeighted(definition, rulesEvaluated);
      allOutcomes = primaryOutcome ? [primaryOutcome] : [];
      break;
    case "first_match":
    default:
      primaryOutcome = resolveFirstMatch(definition, rulesEvaluated);
      allOutcomes = primaryOutcome ? [primaryOutcome] : [];
      break;
  }

  return {
    evaluationId,
    ruleSetKey: definition.ruleSetKey,
    domain: definition.domain,
    evaluationMode: definition.evaluationMode,
    facts,
    rulesEvaluated,
    matchedRules,
    primaryOutcome,
    allOutcomes,
    explanation: {
      summary: "",
      matchedRuleSummary: [],
      unmatchedRuleSummary: [],
      primaryReason: "",
      factsUsed: [],
    },
    evaluatedAt,
    engineVersion: RULES_ENGINE_VERSION,
  };
}
