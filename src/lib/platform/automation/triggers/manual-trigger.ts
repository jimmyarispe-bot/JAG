import { getAutomationsByTriggerKey } from "@/lib/platform/automation/registry/automation-registry";
import type { DispatchAutomationInput } from "@/lib/platform/automation/engine-types";

/** Manual trigger handler — matches automations registered for manual invocation. */
export async function handleManualTrigger(
  input: DispatchAutomationInput
): Promise<{ matchedAutomationKeys: string[] }> {
  const automationKey = input.payload?.automationKey as string | undefined;

  if (automationKey) {
    return { matchedAutomationKeys: [automationKey] };
  }

  return {
    matchedAutomationKeys: getAutomationsByTriggerKey(input.triggerKey).map(
      (def) => def.automationKey
    ),
  };
}
