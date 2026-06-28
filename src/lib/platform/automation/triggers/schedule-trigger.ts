import { getAutomationsByTriggerKey } from "@/lib/platform/automation/registry/automation-registry";
import { getTriggerDefinition } from "@/lib/platform/automation/registry/trigger-registry";
import type { DispatchAutomationInput } from "@/lib/platform/automation/engine-types";

/**
 * Schedule trigger handler — definition-only in Phase 1.
 * Cron scheduling and queue delivery deferred to Phase 2.
 */
export async function handleScheduleTrigger(
  input: DispatchAutomationInput
): Promise<{ matchedAutomationKeys: string[] }> {
  const trigger = getTriggerDefinition(input.triggerKey);

  if (!trigger?.scheduleExpression) {
    return { matchedAutomationKeys: [] };
  }

  return {
    matchedAutomationKeys: getAutomationsByTriggerKey(input.triggerKey).map(
      (def) => def.automationKey
    ),
  };
}
