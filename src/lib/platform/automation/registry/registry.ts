import {
  getActiveAutomationDefinitions,
  getAllAutomationDefinitions,
  getRegisteredAutomationDomains,
} from "@/lib/platform/automation/registry/automation-registry";
import {
  getAllActionDefinitions,
  getRegisteredActionTypes,
} from "@/lib/platform/automation/registry/action-registry";
import {
  getAllConditionDefinitions,
  getRegisteredConditionTypes,
} from "@/lib/platform/automation/registry/condition-registry";
import {
  getAllTriggerDefinitions,
  getRegisteredTriggerTypes,
} from "@/lib/platform/automation/registry/trigger-registry";
import type { AutomationRegistrySnapshot } from "@/lib/platform/automation/engine-types";

let registered = false;

export function getAutomationRegistrySnapshot(): AutomationRegistrySnapshot {
  return {
    automations: getAllAutomationDefinitions(),
    triggers: getAllTriggerDefinitions(),
    actions: getAllActionDefinitions(),
    conditions: getAllConditionDefinitions(),
    domains: getRegisteredAutomationDomains(),
    registeredAt: new Date().toISOString(),
  };
}

export function getActiveAutomationRegistrySnapshot(): AutomationRegistrySnapshot {
  return {
    automations: getActiveAutomationDefinitions(),
    triggers: getAllTriggerDefinitions(),
    actions: getAllActionDefinitions(),
    conditions: getAllConditionDefinitions(),
    domains: getRegisteredAutomationDomains(),
    registeredAt: new Date().toISOString(),
  };
}

export function isAutomationRegistryRegistered(): boolean {
  return registered;
}

export function markAutomationRegistryRegistered(): void {
  registered = true;
}

export function getAutomationEngineHealth(): {
  triggerHandlers: number;
  actionHandlers: number;
  conditionEvaluators: number;
} {
  return {
    triggerHandlers: getRegisteredTriggerTypes().length,
    actionHandlers: getRegisteredActionTypes().length,
    conditionEvaluators: getRegisteredConditionTypes().length,
  };
}

export {
  getActiveAutomationDefinitions,
  getAllAutomationDefinitions,
  getAutomationDefinition,
  getAutomationDefinitionsByDomain,
  getAutomationsByTriggerKey,
  getDuplicateAutomationRegistrations,
  isKnownAutomationKey,
  registerAutomationDefinition,
  registerAutomationDefinitions,
} from "@/lib/platform/automation/registry/automation-registry";

export {
  getActionDefinition,
  getActionDefinitionByType,
  getAllActionDefinitions,
  getActionHandler,
  getDuplicateActionRegistrations,
  getRegisteredActionTypes,
  isKnownActionKey,
  registerActionDefinition,
  registerActionDefinitions,
  registerActionHandler,
  areAllActionHandlersRegistered,
} from "@/lib/platform/automation/registry/action-registry";

export {
  getAllConditionDefinitions,
  getConditionDefinition,
  getConditionEvaluator,
  getDuplicateConditionRegistrations,
  getRegisteredConditionTypes,
  isKnownConditionKey,
  registerConditionDefinition,
  registerConditionDefinitions,
  registerConditionEvaluator,
  areAllConditionEvaluatorsRegistered,
} from "@/lib/platform/automation/registry/condition-registry";

export {
  getActiveTriggerDefinitions,
  getAllTriggerDefinitions,
  getDuplicateTriggerRegistrations,
  getTriggerDefinition,
  getTriggerDefinitionsByType,
  getTriggerHandler,
  getRegisteredTriggerTypes,
  isKnownTriggerKey,
  registerTriggerDefinition,
  registerTriggerDefinitions,
  registerTriggerHandler,
} from "@/lib/platform/automation/registry/trigger-registry";
