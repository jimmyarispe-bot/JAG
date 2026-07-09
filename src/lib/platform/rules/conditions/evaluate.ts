import type { RuleConditionDefinition } from "@/lib/platform/rules/types";

function resolveFieldValue(facts: Record<string, unknown>, field: string): unknown {
  const parts = field.split(".");
  let current: unknown = facts;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function compareValues(
  operator: RuleConditionDefinition["operator"],
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
      if (typeof left === "string" && typeof right === "string") return left.includes(right);
      if (Array.isArray(left)) return left.includes(right);
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

export function evaluateRuleCondition(
  condition: RuleConditionDefinition,
  facts: Record<string, unknown>
): boolean {
  const left = resolveFieldValue(facts, condition.field);
  const result = compareValues(condition.operator, left, condition.value);
  return condition.negate ? !result : result;
}

function evaluateConditionGroup(
  conditions: RuleConditionDefinition[],
  facts: Record<string, unknown>,
  logicGroup: string
): boolean {
  const group = conditions.filter((condition) => (condition.logicGroup ?? "default") === logicGroup);
  if (group.length === 0) return true;
  return group.every((condition) => evaluateRuleCondition(condition, facts));
}

/** Evaluate all condition groups — every group must pass (AND across groups). */
export function evaluateRuleConditions(
  conditions: RuleConditionDefinition[] | undefined,
  facts: Record<string, unknown>
): boolean {
  if (!conditions?.length) return true;

  const groups = new Set(conditions.map((condition) => condition.logicGroup ?? "default"));
  for (const group of groups) {
    if (!evaluateConditionGroup(conditions, facts, group)) {
      return false;
    }
  }
  return true;
}
