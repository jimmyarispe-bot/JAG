import { getActionDefinition, getActionHandler } from "@/lib/platform/automation/registry/action-registry";
import type {
  AutomationActionResult,
  AutomationExecutionContext,
  AutomationStepDefinition,
} from "@/lib/platform/automation/engine-types";

/** Action Dispatcher — routes step actions to registered action handlers. */
export async function dispatchAutomationAction(
  context: AutomationExecutionContext,
  step: AutomationStepDefinition
): Promise<AutomationActionResult> {
  const action = getActionDefinition(step.actionKey);
  if (!action) {
    return {
      actionKey: step.actionKey,
      actionType: "create_task",
      stepKey: step.stepKey,
      success: false,
      error: `Unknown action key: ${step.actionKey}`,
    };
  }

  if (context.metadata.dryRun === true) {
    return {
      actionKey: action.actionKey,
      actionType: action.actionType,
      stepKey: step.stepKey,
      success: true,
      skipped: true,
      auditSummary: `Dry run — would execute ${action.actionType}`,
    };
  }

  if (action.status === "stub") {
    return {
      actionKey: action.actionKey,
      actionType: action.actionType,
      stepKey: step.stepKey,
      success: false,
      error: `Action "${action.actionKey}" (${action.actionType}) is a stub — not implemented in Phase 1`,
    };
  }

  const handler = getActionHandler(action.actionType);
  if (!handler) {
    return {
      actionKey: action.actionKey,
      actionType: action.actionType,
      stepKey: step.stepKey,
      success: false,
      error: `No handler registered for action type "${action.actionType}"`,
    };
  }

  return handler(context, action, step);
}

export async function dispatchAutomationActions(
  context: AutomationExecutionContext,
  steps: AutomationStepDefinition[]
): Promise<AutomationActionResult[]> {
  const sorted = [...steps].sort((a, b) => a.sortOrder - b.sortOrder);
  const results: AutomationActionResult[] = [];

  for (const step of sorted) {
    results.push(await dispatchAutomationAction(context, step));
  }

  return results;
}
