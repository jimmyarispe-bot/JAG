import type {
  AutomationCondition,
  AutomationConditionGroup,
  ConditionOperator,
  OperationalFacts,
} from "@/lib/platform/automation/operating/types";

function isGroup(
  node: AutomationCondition | AutomationConditionGroup
): node is AutomationConditionGroup {
  return "all" in node || "any" in node;
}

/** Resolve dotted paths against facts (supports subject.* aliases). */
export function getFactValue(
  facts: OperationalFacts,
  path: string
): unknown {
  const normalized = path.startsWith("application.")
    ? `subject.${path.slice("application.".length)}`
    : path;

  const parts = normalized.split(".").filter(Boolean);
  let current: unknown = facts;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function compare(op: ConditionOperator, left: unknown, right: unknown): boolean {
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
  condition: AutomationCondition,
  facts: OperationalFacts
): boolean {
  const left = getFactValue(facts, condition.path);
  return compare(condition.op, left, condition.value);
}

/** Deterministic, composable condition evaluation. */
export function evaluateConditions(
  group: AutomationConditionGroup,
  facts: OperationalFacts
): boolean {
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
