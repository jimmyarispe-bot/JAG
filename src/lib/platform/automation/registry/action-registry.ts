import type {
  ActionDefinition,
  AutomationActionHandler,
  AutomationActionType,
} from "@/lib/platform/automation/engine-types";
import { AUTOMATION_ACTION_TYPES } from "@/lib/platform/automation/engine-types";

const ACTION_REGISTRY = new Map<string, ActionDefinition>();
const DUPLICATE_ACTION_KEYS: string[] = [];
const ACTION_HANDLERS = new Map<AutomationActionType, AutomationActionHandler>();

export function registerActionDefinition(definition: ActionDefinition): void {
  if (ACTION_REGISTRY.has(definition.actionKey)) {
    DUPLICATE_ACTION_KEYS.push(definition.actionKey);
    return;
  }
  ACTION_REGISTRY.set(definition.actionKey, definition);
}

export function registerActionDefinitions(definitions: ActionDefinition[]): void {
  for (const definition of definitions) {
    registerActionDefinition(definition);
  }
}

export function getActionDefinition(actionKey: string): ActionDefinition | undefined {
  return ACTION_REGISTRY.get(actionKey);
}

export function getAllActionDefinitions(): ActionDefinition[] {
  return [...ACTION_REGISTRY.values()].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
}

export function getActionDefinitionByType(
  actionType: AutomationActionType
): ActionDefinition | undefined {
  return getAllActionDefinitions().find((def) => def.actionType === actionType);
}

export function getDuplicateActionRegistrations(): string[] {
  return [...DUPLICATE_ACTION_KEYS];
}

export function isKnownActionKey(actionKey: string): boolean {
  return ACTION_REGISTRY.has(actionKey);
}

export function registerActionHandler(
  actionType: AutomationActionType,
  handler: AutomationActionHandler
): void {
  ACTION_HANDLERS.set(actionType, handler);
}

export function getActionHandler(
  actionType: AutomationActionType
): AutomationActionHandler | undefined {
  return ACTION_HANDLERS.get(actionType);
}

export function getRegisteredActionTypes(): AutomationActionType[] {
  return [...ACTION_HANDLERS.keys()];
}

export function areAllActionHandlersRegistered(): boolean {
  return AUTOMATION_ACTION_TYPES.every((type) => ACTION_HANDLERS.has(type));
}
