import type {
  DecisionDefinition,
  DecisionRegistrySnapshot,
} from "@/lib/platform/decision/types";

const DECISION_REGISTRY = new Map<string, DecisionDefinition>();
const DUPLICATE_DECISION_TYPES: string[] = [];
let registered = false;

/** Register a decision definition (idempotent per decisionType). */
export function registerDecisionDefinition(definition: DecisionDefinition): void {
  if (DECISION_REGISTRY.has(definition.decisionType)) {
    DUPLICATE_DECISION_TYPES.push(definition.decisionType);
    return;
  }
  DECISION_REGISTRY.set(definition.decisionType, definition);
}

export function registerDecisionDefinitions(definitions: DecisionDefinition[]): void {
  for (const definition of definitions) {
    registerDecisionDefinition(definition);
  }
}

export function getDecisionDefinition(decisionType: string): DecisionDefinition | undefined {
  return DECISION_REGISTRY.get(decisionType);
}

export function getDecisionDefinitionsByDomain(domain: string): DecisionDefinition[] {
  return [...DECISION_REGISTRY.values()]
    .filter((def) => def.domain === domain)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getActiveDecisionDefinitions(): DecisionDefinition[] {
  return [...DECISION_REGISTRY.values()]
    .filter((def) => def.status === "active")
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getAllDecisionDefinitions(): DecisionDefinition[] {
  return [...DECISION_REGISTRY.values()].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
}

export function getRegisteredDecisionDomains(): string[] {
  return [...new Set([...DECISION_REGISTRY.values()].map((def) => def.domain))].sort();
}

export function getDecisionRegistrySnapshot(): DecisionRegistrySnapshot {
  return {
    definitions: getAllDecisionDefinitions(),
    domains: getRegisteredDecisionDomains(),
    registeredAt: new Date().toISOString(),
  };
}

export function isDecisionRegistryRegistered(): boolean {
  return registered;
}

export function markDecisionRegistryRegistered(): void {
  registered = true;
}

/** Duplicate decision types detected during registration (build-time validation). */
export function getDuplicateDecisionRegistrations(): string[] {
  return [...DUPLICATE_DECISION_TYPES];
}

export function getDecisionRule(
  definition: DecisionDefinition,
  ruleKey: string
) {
  return definition.rules.find((rule) => rule.key === ruleKey);
}

export function getRecommendationOption(
  definition: DecisionDefinition,
  outcomeKey: string
) {
  return definition.recommendationOptions.find((option) => option.outcomeKey === outcomeKey);
}
