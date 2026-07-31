import type {
  DecisionCondition,
  DecisionConditionOperator,
} from "@/jag/decisions/contracts/definitions";
import { readFactPath } from "@/jag/decisions/context/facts";

export type ConditionEval = {
  readonly matched: boolean;
  readonly path: string;
  readonly operator: DecisionConditionOperator;
  readonly expected?: unknown;
  readonly actual?: unknown;
};

function compareNumbers(a: unknown, b: unknown): number | null {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b);
  }
  return null;
}

export function evaluateCondition(
  condition: DecisionCondition,
  facts: Readonly<Record<string, unknown>>
): ConditionEval {
  const actual = readFactPath(facts, condition.path);
  const expected = condition.value;
  const base = {
    path: condition.path,
    operator: condition.operator,
    expected,
    actual,
  };

  switch (condition.operator) {
    case "exists":
      return { ...base, matched: actual !== undefined && actual !== null };
    case "not_exists":
      return { ...base, matched: actual === undefined || actual === null };
    case "truthy":
      return { ...base, matched: Boolean(actual) };
    case "falsy":
      return { ...base, matched: !actual };
    case "eq":
      return { ...base, matched: Object.is(actual, expected) };
    case "neq":
      return { ...base, matched: !Object.is(actual, expected) };
    case "gt": {
      const c = compareNumbers(actual, expected);
      return { ...base, matched: c != null && c > 0 };
    }
    case "gte": {
      const c = compareNumbers(actual, expected);
      return { ...base, matched: c != null && c >= 0 };
    }
    case "lt": {
      const c = compareNumbers(actual, expected);
      return { ...base, matched: c != null && c < 0 };
    }
    case "lte": {
      const c = compareNumbers(actual, expected);
      return { ...base, matched: c != null && c <= 0 };
    }
    case "in": {
      const list = Array.isArray(expected) ? expected : [];
      return { ...base, matched: list.some((v) => Object.is(v, actual)) };
    }
    case "not_in": {
      const list = Array.isArray(expected) ? expected : [];
      return { ...base, matched: !list.some((v) => Object.is(v, actual)) };
    }
    default:
      return { ...base, matched: false };
  }
}

export function evaluateAllConditions(
  conditions: readonly DecisionCondition[],
  facts: Readonly<Record<string, unknown>>
): { matched: boolean; results: ConditionEval[] } {
  const results = conditions.map((c) => evaluateCondition(c, facts));
  return {
    matched: results.every((r) => r.matched),
    results,
  };
}
