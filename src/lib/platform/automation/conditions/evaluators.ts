import type {
  AutomationConditionEvaluator,
  AutomationExecutionContext,
  ConditionDefinition,
} from "@/lib/platform/automation/engine-types";
import { registerConditionEvaluator } from "@/lib/platform/automation/registry/condition-registry";
import type { AutomationConditionType } from "@/lib/platform/automation/engine-types";

const permissionCheckEvaluator: AutomationConditionEvaluator = (context, condition) => {
  const required = String(condition.config?.permission ?? "");
  const permissions = (context.facts.permissions as string[] | undefined) ?? [];
  if (!required) return true;
  return permissions.includes(required) || context.facts.hasPermission === true;
};

const entityStateEvaluator: AutomationConditionEvaluator = (context, condition) => {
  const field = String(condition.config?.field ?? "status");
  const expected = condition.config?.value;
  const actual = context.facts[field] ?? context.payload[field];
  return actual === expected;
};

const workflowStateEvaluator: AutomationConditionEvaluator = (context, condition) => {
  const expected = condition.config?.stateKey ?? condition.config?.value;
  const actual = context.facts.currentStateKey ?? context.payload.currentStateKey;
  if (!expected) return true;
  return actual === expected;
};

const decisionResultEvaluator: AutomationConditionEvaluator = (context, condition) => {
  const expected = condition.config?.outcomeKey ?? condition.config?.value;
  const actual = context.facts.outcomeKey ?? context.payload.outcomeKey;
  if (!expected) return Boolean(actual);
  return actual === expected;
};

const relationshipExistsEvaluator: AutomationConditionEvaluator = async (context, condition) => {
  if (context.facts.hasRelationship === true) return true;
  const supabase = context.supabase;
  if (!supabase || !context.entityType || !context.entityId) return false;

  const relationshipType = String(condition.config?.relationshipType ?? "");
  let query = supabase
    .from("platform_relationships")
    .select("id", { head: true, count: "exact" })
    .eq("from_entity_type", context.entityType)
    .eq("from_entity_id", context.entityId)
    .eq("status", "active");

  if (relationshipType) query = query.eq("relationship_type", relationshipType);

  const { count } = await query;
  return (count ?? 0) > 0;
};

const tagExistsEvaluator: AutomationConditionEvaluator = async (context, condition) => {
  if (context.facts.hasTag === true) return true;
  const supabase = context.supabase;
  if (!supabase || !context.entityType || !context.entityId) return false;

  const tagSlug = String(condition.config?.tagSlug ?? "");
  if (context.facts.tagSlug === tagSlug || context.payload.tagSlug === tagSlug) return true;

  const { count } = await supabase
    .from("platform_entity_tags")
    .select("id", { head: true, count: "exact" })
    .eq("entity_type", context.entityType)
    .eq("entity_id", context.entityId);

  return (count ?? 0) > 0;
};

const timeWindowEvaluator: AutomationConditionEvaluator = (_context, condition) => {
  const startHour = Number(condition.config?.startHour ?? 0);
  const endHour = Number(condition.config?.endHour ?? 24);
  const hour = new Date().getHours();
  return hour >= startHour && hour < endHour;
};

export const DEFAULT_CONDITION_EVALUATORS: Record<
  AutomationConditionType,
  AutomationConditionEvaluator
> = {
  permission_check: permissionCheckEvaluator,
  entity_state: entityStateEvaluator,
  workflow_state: workflowStateEvaluator,
  decision_result: decisionResultEvaluator,
  relationship_exists: relationshipExistsEvaluator,
  tag_exists: tagExistsEvaluator,
  time_window: timeWindowEvaluator,
};

export function registerDefaultAutomationConditionEvaluators(): void {
  for (const [conditionType, evaluator] of Object.entries(DEFAULT_CONDITION_EVALUATORS)) {
    registerConditionEvaluator(conditionType as AutomationConditionType, evaluator);
  }
}
