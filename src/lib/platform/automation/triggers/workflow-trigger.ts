import { getAutomationsByTriggerKey } from "@/lib/platform/automation/registry/automation-registry";
import { getTriggerDefinition } from "@/lib/platform/automation/registry/trigger-registry";
import type { DispatchAutomationInput } from "@/lib/platform/automation/engine-types";

/** Workflow trigger handler — matches automations on workflow transition completion. */
export async function handleWorkflowTrigger(
  input: DispatchAutomationInput
): Promise<{ matchedAutomationKeys: string[] }> {
  const trigger = getTriggerDefinition(input.triggerKey);
  const workflowKey = String(input.payload?.workflowKey ?? input.facts?.workflowKey ?? "");
  const transitionKey = String(input.payload?.transitionKey ?? input.facts?.transitionKey ?? "");

  let automations = getAutomationsByTriggerKey(input.triggerKey);

  if (trigger?.workflowKey && workflowKey && trigger.workflowKey !== workflowKey) {
    return { matchedAutomationKeys: [] };
  }

  if (trigger?.transitionKey && transitionKey && trigger.transitionKey !== transitionKey) {
    return { matchedAutomationKeys: [] };
  }

  return {
    matchedAutomationKeys: automations.map((def) => def.automationKey),
  };
}
