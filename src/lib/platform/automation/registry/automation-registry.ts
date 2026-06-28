import type { AutomationDefinition } from "@/lib/platform/automation/engine-types";

const AUTOMATION_REGISTRY = new Map<string, AutomationDefinition>();
const DUPLICATE_AUTOMATION_KEYS: string[] = [];

export function registerAutomationDefinition(definition: AutomationDefinition): void {
  if (AUTOMATION_REGISTRY.has(definition.automationKey)) {
    DUPLICATE_AUTOMATION_KEYS.push(definition.automationKey);
    return;
  }
  AUTOMATION_REGISTRY.set(definition.automationKey, definition);
}

export function registerAutomationDefinitions(definitions: AutomationDefinition[]): void {
  for (const definition of definitions) {
    registerAutomationDefinition(definition);
  }
}

export function getAutomationDefinition(
  automationKey: string
): AutomationDefinition | undefined {
  return AUTOMATION_REGISTRY.get(automationKey);
}

export function getAutomationDefinitionsByDomain(domain: string): AutomationDefinition[] {
  return [...AUTOMATION_REGISTRY.values()]
    .filter((def) => def.domain === domain)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getActiveAutomationDefinitions(): AutomationDefinition[] {
  return [...AUTOMATION_REGISTRY.values()]
    .filter((def) => def.status === "active")
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getAllAutomationDefinitions(): AutomationDefinition[] {
  return [...AUTOMATION_REGISTRY.values()].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
}

export function getAutomationsByTriggerKey(triggerKey: string): AutomationDefinition[] {
  return getActiveAutomationDefinitions().filter((def) =>
    def.triggerKeys.includes(triggerKey)
  );
}

export function getDuplicateAutomationRegistrations(): string[] {
  return [...DUPLICATE_AUTOMATION_KEYS];
}

export function isKnownAutomationKey(automationKey: string): boolean {
  return AUTOMATION_REGISTRY.has(automationKey);
}

export function getRegisteredAutomationDomains(): string[] {
  return [...new Set([...AUTOMATION_REGISTRY.values()].map((def) => def.domain))].sort();
}
