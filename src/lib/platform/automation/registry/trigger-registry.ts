import type {
  AutomationTriggerHandler,
  AutomationTriggerType,
  TriggerDefinition,
} from "@/lib/platform/automation/engine-types";

const TRIGGER_REGISTRY = new Map<string, TriggerDefinition>();
const DUPLICATE_TRIGGER_KEYS: string[] = [];
const TRIGGER_HANDLERS = new Map<AutomationTriggerType, AutomationTriggerHandler>();

export function registerTriggerDefinition(definition: TriggerDefinition): void {
  if (TRIGGER_REGISTRY.has(definition.triggerKey)) {
    DUPLICATE_TRIGGER_KEYS.push(definition.triggerKey);
    return;
  }
  TRIGGER_REGISTRY.set(definition.triggerKey, definition);
}

export function registerTriggerDefinitions(definitions: TriggerDefinition[]): void {
  for (const definition of definitions) {
    registerTriggerDefinition(definition);
  }
}

export function getTriggerDefinition(triggerKey: string): TriggerDefinition | undefined {
  return TRIGGER_REGISTRY.get(triggerKey);
}

export function getAllTriggerDefinitions(): TriggerDefinition[] {
  return [...TRIGGER_REGISTRY.values()].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
}

export function getActiveTriggerDefinitions(): TriggerDefinition[] {
  return getAllTriggerDefinitions().filter((def) => def.status === "active");
}

export function getTriggerDefinitionsByType(
  triggerType: AutomationTriggerType
): TriggerDefinition[] {
  return getActiveTriggerDefinitions().filter((def) => def.triggerType === triggerType);
}

export function getDuplicateTriggerRegistrations(): string[] {
  return [...DUPLICATE_TRIGGER_KEYS];
}

export function isKnownTriggerKey(triggerKey: string): boolean {
  return TRIGGER_REGISTRY.has(triggerKey);
}

export function registerTriggerHandler(
  triggerType: AutomationTriggerType,
  handler: AutomationTriggerHandler
): void {
  TRIGGER_HANDLERS.set(triggerType, handler);
}

export function getTriggerHandler(
  triggerType: AutomationTriggerType
): AutomationTriggerHandler | undefined {
  return TRIGGER_HANDLERS.get(triggerType);
}

export function getRegisteredTriggerTypes(): AutomationTriggerType[] {
  return [...TRIGGER_HANDLERS.keys()];
}
