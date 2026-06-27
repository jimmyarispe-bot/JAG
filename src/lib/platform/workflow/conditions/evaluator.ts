import type {
  WorkflowConditionDefinition,
  WorkflowConditionOperator,
} from "@/lib/platform/workflow/types";

export type WorkflowConditionEvaluator = (
  condition: WorkflowConditionDefinition,
  facts: Record<string, unknown>
) => boolean;

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
  operator: WorkflowConditionOperator,
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

/** Evaluate a single condition against runtime facts. */
export function evaluateWorkflowCondition(
  condition: WorkflowConditionDefinition,
  facts: Record<string, unknown>
): boolean {
  const left = resolveFieldValue(facts, condition.field);
  const result = compareValues(condition.operator, left, condition.value);
  return condition.negate ? !result : result;
}

/** Evaluate all conditions in a group — all must pass (AND within group). */
export function evaluateWorkflowConditionGroup(
  conditions: WorkflowConditionDefinition[],
  facts: Record<string, unknown>,
  logicGroup = "default"
): boolean {
  const group = conditions.filter((c) => (c.logicGroup ?? "default") === logicGroup);
  if (group.length === 0) return true;
  return group.every((condition) => evaluateWorkflowCondition(condition, facts));
}

/** Evaluate all condition groups — every group must pass (AND across groups). */
export function evaluateAllWorkflowConditions(
  conditions: WorkflowConditionDefinition[] | undefined,
  facts: Record<string, unknown>
): boolean {
  if (!conditions?.length) return true;

  const groups = new Set(conditions.map((c) => c.logicGroup ?? "default"));
  for (const group of groups) {
    if (!evaluateWorkflowConditionGroup(conditions, facts, group)) {
      return false;
    }
  }
  return true;
}

const CUSTOM_EVALUATORS = new Map<string, WorkflowConditionEvaluator>();

export function registerWorkflowConditionEvaluator(
  conditionKey: string,
  evaluator: WorkflowConditionEvaluator
): void {
  CUSTOM_EVALUATORS.set(conditionKey, evaluator);
}

export function evaluateWorkflowConditionWithRegistry(
  condition: WorkflowConditionDefinition,
  facts: Record<string, unknown>
): boolean {
  const custom = CUSTOM_EVALUATORS.get(condition.key);
  if (custom) {
    const result = custom(condition, facts);
    return condition.negate ? !result : result;
  }
  return evaluateWorkflowCondition(condition, facts);
}
