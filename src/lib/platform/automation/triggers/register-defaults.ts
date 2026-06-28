import { registerTriggerHandler } from "@/lib/platform/automation/registry/trigger-registry";
import { handleEventTrigger } from "@/lib/platform/automation/triggers/event-trigger";
import { handleManualTrigger } from "@/lib/platform/automation/triggers/manual-trigger";
import { handleScheduleTrigger } from "@/lib/platform/automation/triggers/schedule-trigger";
import { handleWorkflowTrigger } from "@/lib/platform/automation/triggers/workflow-trigger";

/** Register all built-in platform automation trigger handlers. */
export function registerDefaultAutomationTriggerHandlers(): void {
  registerTriggerHandler("event", handleEventTrigger);
  registerTriggerHandler("workflow", handleWorkflowTrigger);
  registerTriggerHandler("manual", handleManualTrigger);
  registerTriggerHandler("schedule", handleScheduleTrigger);
}
