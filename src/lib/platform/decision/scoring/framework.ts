import type {
  AppliedRule,
  DecisionConditionDefinition,
  DecisionConditionOperator,
  DecisionDefinition,
  ScoredOutcome,
  ScoringResult,
} from "@/lib/platform/decision/types";

function resolveFieldValue(
  facts: Record<string, unknown>,
  field: string
): unknown {
  const parts = field.split(".");
  let current: unknown = facts;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function compareValues(
  operator: DecisionConditionOperator,
  left: unknown,
  right: unknown
): boolean {
  switch (operator) {
    case "equals":
      return left === right;
    case "not_equals":
      return left !== right;
    case "greater_than":
      return typeof left === "number" && typeof right === "number" && left > right;
    case "less_than":
      return typeof left === "number" && typeof right === "number" && left < right;
    case "contains":
      if (typeof left === "string" && typeof right === "string") {
        return left.includes(right);
      }
      if (Array.isArray(left)) {
        return left.includes(right);
      }
      return false;
    case "in":
      return Array.isArray(right) && right.includes(left);
    case "not_in":
      return Array.isArray(right) && !right.includes(left);
    case "exists":
      return left !== undefined && left !== null;
    case "not_exists":
      return left === undefined || left === null;
    default:
      return false;
  }
}

export function evaluateDecisionCondition(
  condition: DecisionConditionDefinition,
  facts: Record<string, unknown>
): boolean {
  const left = resolveFieldValue(facts, condition.field);
  const result = compareValues(condition.operator, left, condition.value);
  return condition.negate ? !result : result;
}

export function evaluateDecisionConditionGroup(
  conditions: DecisionConditionDefinition[],
  facts: Record<string, unknown>,
  logicGroup = "default"
): boolean {
  const group = conditions.filter((c) => (c.logicGroup ?? "default") === logicGroup);
  if (group.length === 0) return true;
  return group.every((condition) => evaluateDecisionCondition(condition, facts));
}

export function evaluateAllDecisionConditions(
  conditions: DecisionConditionDefinition[] | undefined,
  facts: Record<string, unknown>
): boolean {
  if (!conditions?.length) return true;

  const groups = new Set(conditions.map((c) => c.logicGroup ?? "default"));
  for (const group of groups) {
    if (!evaluateDecisionConditionGroup(conditions, facts, group)) {
      return false;
    }
  }
  return true;
}

export interface ScoreOutcomesInput {
  definition: DecisionDefinition;
  rulesApplied: AppliedRule[];
  outcomeAdjustments?: Record<string, number>;
}

/** Rank recommendation outcomes from rule weights and profile weights. */
export function scoreDecisionOutcomes(input: ScoreOutcomesInput): ScoringResult {
  const { definition, rulesApplied, outcomeAdjustments = {} } = input;
  const profileWeights = definition.scoringProfile?.outcomeWeights ?? {};
  const scoreMap = new Map<string, Record<string, number>>();

  for (const option of definition.recommendationOptions) {
    scoreMap.set(option.outcomeKey, { base: 0, rules: 0, profile: profileWeights[option.outcomeKey] ?? 1, adjustment: outcomeAdjustments[option.outcomeKey] ?? 0 });
  }

  for (const rule of rulesApplied) {
    if (!rule.matched || !rule.outcomeKey) continue;
    const components = scoreMap.get(rule.outcomeKey);
    if (components) {
      components.rules += rule.weight;
    }
  }

  const rankedOutcomes: ScoredOutcome[] = [];

  for (const [outcomeKey, components] of scoreMap) {
    const score =
      components.rules * components.profile +
      components.adjustment +
      (components.rules === 0 ? components.base : 0);
    rankedOutcomes.push({ outcomeKey, score, components });
  }

  rankedOutcomes.sort((a, b) => b.score - a.score);

  const minimumScore = definition.scoringProfile?.minimumScore ?? 0;
  const viable = rankedOutcomes.filter((outcome) => outcome.score >= minimumScore);
  const primaryOutcomeKey =
    viable[0]?.outcomeKey ??
    rankedOutcomes[0]?.outcomeKey ??
    definition.recommendationOptions[0]?.outcomeKey ??
    "unknown";

  return { rankedOutcomes, primaryOutcomeKey };
}
