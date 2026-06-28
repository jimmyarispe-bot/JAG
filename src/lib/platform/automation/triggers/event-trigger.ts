import { getAutomationsByTriggerKey } from "@/lib/platform/automation/registry/automation-registry";
import { getTriggerDefinition } from "@/lib/platform/automation/registry/trigger-registry";
import type { DispatchAutomationInput } from "@/lib/platform/automation/engine-types";

/** Event trigger handler — matches automations by trigger key and event type. */
export async function handleEventTrigger(
  input: DispatchAutomationInput
): Promise<{ matchedAutomationKeys: string[] }> {
  const trigger = getTriggerDefinition(input.triggerKey);
  const eventType = String(input.payload?.eventType ?? input.facts?.eventType ?? "");

  if (trigger?.eventType && eventType && trigger.eventType !== eventType) {
    return { matchedAutomationKeys: [] };
  }

  const automations = getAutomationsByTriggerKey(input.triggerKey);

  if (trigger?.eventType) {
    return {
      matchedAutomationKeys: automations.map((def) => def.automationKey),
    };
  }

  return {
    matchedAutomationKeys: automations
      .filter((def) => def.triggerKeys.includes(input.triggerKey))
      .map((def) => def.automationKey),
  };
}
