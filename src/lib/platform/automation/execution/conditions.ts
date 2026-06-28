import { getConditionDefinition, getConditionEvaluator } from "@/lib/platform/automation/registry/condition-registry";
import type { AutomationExecutionContext } from "@/lib/platform/automation/engine-types";

/** Evaluate all conditions for an automation or step — all must pass (AND). */
export async function evaluateAutomationConditions(
  context: AutomationExecutionContext,
  conditionKeys: string[]
): Promise<boolean> {
  if (!conditionKeys.length) return true;

  for (const conditionKey of conditionKeys) {
    const definition = getConditionDefinition(conditionKey);
    if (!definition) return false;

    const evaluator = getConditionEvaluator(definition.conditionType);
    if (!evaluator) return false;

    const result = await evaluator(context, definition);
    if (!result) return false;
  }

  return true;
}
