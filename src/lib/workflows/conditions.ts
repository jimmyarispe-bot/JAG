import type { ConditionGroup, ConditionRule, WorkflowEventContext } from "./types";

function getFactValue(
  ctx: WorkflowEventContext,
  field: string
): unknown {
  const facts = ctx.facts ?? {};
  const payload = ctx.payload ?? {};

  switch (field) {
    case "student_status":
      return facts.student_status ?? payload.studentStatus ?? payload.status;
    case "school_id":
      return ctx.schoolId ?? facts.school_id ?? payload.schoolId;
    case "program":
      return facts.program ?? payload.program;
    case "grade":
      return facts.grade ?? facts.grade_level ?? payload.grade ?? payload.gradeLevel;
    case "scholarship":
      return facts.scholarship ?? payload.scholarship;
    case "balance":
      return facts.balance ?? payload.balance;
    case "attendance_pct":
      return facts.attendance_pct ?? payload.attendancePct;
    case "tags":
      return facts.tags ?? payload.tags;
    case "family_status":
      return facts.family_status ?? payload.familyStatus ?? payload.status;
    case "guardian_exists":
      return facts.guardian_exists ?? payload.guardianExists;
    case "communication_preference":
      return (
        facts.communication_preference ??
        payload.communicationPreference ??
        payload.preferred_communication_method
      );
    case "event_type":
      return ctx.eventType ?? facts.eventType;
    default:
      return facts[field] ?? payload[field];
  }
}

export function evaluateConditionRule(
  rule: ConditionRule,
  ctx: WorkflowEventContext
): boolean {
  const actual = getFactValue(ctx, rule.field);
  const expected = rule.value;

  switch (rule.operator) {
    case "exists":
      return actual != null && actual !== "";
    case "not_exists":
      return actual == null || actual === "";
    case "equals":
      return String(actual ?? "") === String(expected ?? "");
    case "not_equals":
      return String(actual ?? "") !== String(expected ?? "");
    case "contains":
      if (Array.isArray(actual)) return actual.map(String).includes(String(expected));
      return String(actual ?? "").toLowerCase().includes(String(expected ?? "").toLowerCase());
    case "in": {
      const list = Array.isArray(expected) ? expected : String(expected ?? "").split(",");
      return list.map(String).includes(String(actual ?? ""));
    }
    case "gt":
      return Number(actual) > Number(expected);
    case "gte":
      return Number(actual) >= Number(expected);
    case "lt":
      return Number(actual) < Number(expected);
    case "lte":
      return Number(actual) <= Number(expected);
    default:
      return false;
  }
}

export function evaluateConditionGroup(
  group: ConditionGroup,
  ctx: WorkflowEventContext
): boolean {
  const ruleResults = group.rules.map((r) => evaluateConditionRule(r, ctx));
  const nestedResults = (group.groups ?? []).map((g) => evaluateConditionGroup(g, ctx));
  const all = [...ruleResults, ...nestedResults];

  if (all.length === 0) return true;
  if (group.op === "OR") return all.some(Boolean);
  return all.every(Boolean);
}

/** Evaluate all top-level groups (implicit AND between groups). */
export function evaluateConditionGroups(
  groups: ConditionGroup[] | undefined,
  ctx: WorkflowEventContext
): boolean {
  if (!groups?.length) return true;
  return groups.every((g) => evaluateConditionGroup(g, ctx));
}
