import type { RuleSetDefinition, RuleRegistrySnapshot } from "@/lib/platform/rules/types";

const RULE_SET_REGISTRY = new Map<string, RuleSetDefinition>();
const DUPLICATE_RULE_SET_KEYS: string[] = [];
let registered = false;

export function registerRuleSet(definition: RuleSetDefinition): void {
  if (RULE_SET_REGISTRY.has(definition.ruleSetKey)) {
    DUPLICATE_RULE_SET_KEYS.push(definition.ruleSetKey);
    return;
  }
  RULE_SET_REGISTRY.set(definition.ruleSetKey, definition);
}

export function registerRuleSets(definitions: RuleSetDefinition[]): void {
  for (const definition of definitions) {
    registerRuleSet(definition);
  }
}

export function getRuleSet(ruleSetKey: string): RuleSetDefinition | undefined {
  return RULE_SET_REGISTRY.get(ruleSetKey);
}

export function getRuleSetsByDomain(domain: string): RuleSetDefinition[] {
  return [...RULE_SET_REGISTRY.values()]
    .filter((definition) => definition.domain === domain)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getActiveRuleSets(): RuleSetDefinition[] {
  return [...RULE_SET_REGISTRY.values()]
    .filter((definition) => definition.status === "active")
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getAllRuleSets(): RuleSetDefinition[] {
  return [...RULE_SET_REGISTRY.values()].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
}

export function getRegisteredRuleDomains(): string[] {
  return [...new Set([...RULE_SET_REGISTRY.values()].map((definition) => definition.domain))].sort();
}

export function getRuleRegistrySnapshot(): RuleRegistrySnapshot {
  return {
    ruleSets: getAllRuleSets(),
    domains: getRegisteredRuleDomains(),
    registeredAt: new Date().toISOString(),
  };
}

export function isRuleRegistryRegistered(): boolean {
  return registered;
}

export function markRuleRegistryRegistered(): void {
  registered = true;
}

export function getDuplicateRuleSetRegistrations(): string[] {
  return [...DUPLICATE_RULE_SET_KEYS];
}

export function getRuleFromSet(definition: RuleSetDefinition, ruleKey: string) {
  return definition.rules.find((rule) => rule.ruleKey === ruleKey);
}

export function getOutcomeFromSet(definition: RuleSetDefinition, outcomeKey: string) {
  return definition.outcomes.find((outcome) => outcome.outcomeKey === outcomeKey);
}
