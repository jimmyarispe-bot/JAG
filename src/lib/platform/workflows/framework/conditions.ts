import type {
  WorkflowCondition,
  WorkflowConditionGroup,
  WorkflowConditionOperator,
} from "@/lib/platform/workflows/framework/types";

function isGroup(
  node: WorkflowCondition | WorkflowConditionGroup
): node is WorkflowConditionGroup {
  return "all" in node || "any" in node;
}

export function getFactValue(
  facts: Record<string, unknown>,
  path: string
): unknown {
  const parts = path.split(".").filter(Boolean);
  let current: unknown = facts;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function compare(
  op: WorkflowConditionOperator,
  left: unknown,
  right: unknown
): boolean {
  switch (op) {
    case "exists":
      return left !== undefined && left !== null;
    case "eq":
      return left === right;
    case "neq":
      return left !== right;
    case "gt":
      return typeof left === "number" && typeof right === "number" && left > right;
    case "gte":
      return typeof left === "number" && typeof right === "number" && left >= right;
    case "lt":
      return typeof left === "number" && typeof right === "number" && left < right;
    case "lte":
      return typeof left === "number" && typeof right === "number" && left <= right;
    case "in":
      return Array.isArray(right) && right.includes(left);
    default:
      return false;
  }
}

export function evaluateCondition(
  condition: WorkflowCondition,
  facts: Record<string, unknown>
): boolean {
  return compare(condition.op, getFactValue(facts, condition.path), condition.value);
}

export function evaluateConditions(
  group: WorkflowConditionGroup | undefined,
  facts: Record<string, unknown>
): boolean {
  if (!group) return true;
  const all = group.all ?? [];
  const any = group.any ?? [];
  if (all.length === 0 && any.length === 0) return true;

  const allOk =
    all.length === 0 ||
    all.every((node) =>
      isGroup(node) ? evaluateConditions(node, facts) : evaluateCondition(node, facts)
    );
  const anyOk =
    any.length === 0 ||
    any.some((node) =>
      isGroup(node) ? evaluateConditions(node, facts) : evaluateCondition(node, facts)
    );

  if (all.length > 0 && any.length > 0) return allOk && anyOk;
  if (all.length > 0) return allOk;
  return anyOk;
}
