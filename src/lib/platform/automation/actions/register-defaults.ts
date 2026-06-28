import { DEFAULT_ACTION_HANDLERS } from "@/lib/platform/automation/actions/handlers";
import { registerActionHandler } from "@/lib/platform/automation/registry/action-registry";
import type { AutomationActionType } from "@/lib/platform/automation/engine-types";

/** Register all built-in platform automation action handlers. */
export function registerDefaultAutomationActionHandlers(): void {
  for (const [actionType, handler] of Object.entries(DEFAULT_ACTION_HANDLERS)) {
    registerActionHandler(actionType as AutomationActionType, handler);
  }
}
