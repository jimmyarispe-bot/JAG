import type { DecisionDefinition } from "@/jag/decisions/contracts/definitions";

const registry = new Map<string, DecisionDefinition>();

function validateDefinition(definition: DecisionDefinition): void {
  if (!definition.id.trim()) {
    throw new Error("DecisionDefinition.id is required");
  }
  if (!definition.applicationId.trim()) {
    throw new Error(`Decision "${definition.id}" requires applicationId`);
  }
  if (!definition.version.trim()) {
    throw new Error(`Decision "${definition.id}" requires version`);
  }
  if (!definition.defaultOutcome.trim()) {
    throw new Error(`Decision "${definition.id}" requires defaultOutcome`);
  }
  if (!definition.policies.length) {
    throw new Error(
      `Decision "${definition.id}" must declare at least one policy`
    );
  }

  const policyIds = new Set<string>();
  for (const policy of definition.policies) {
    if (!policy.id.trim()) {
      throw new Error(`Decision "${definition.id}" has a policy without id`);
    }
    if (policyIds.has(policy.id)) {
      throw new Error(
        `Decision "${definition.id}" has duplicate policy id "${policy.id}"`
      );
    }
    policyIds.add(policy.id);
    if (!policy.rules.length) {
      throw new Error(
        `Decision "${definition.id}" policy "${policy.id}" must declare at least one rule`
      );
    }

    const ruleIds = new Set<string>();
    for (const rule of policy.rules) {
      if (!rule.id.trim()) {
        throw new Error(
          `Decision "${definition.id}" policy "${policy.id}" has a rule without id`
        );
      }
      if (ruleIds.has(rule.id)) {
        throw new Error(
          `Decision "${definition.id}" policy "${policy.id}" has duplicate rule id "${rule.id}"`
        );
      }
      ruleIds.add(rule.id);
      if (!rule.outcome.trim()) {
        throw new Error(
          `Decision "${definition.id}" rule "${rule.id}" requires outcome`
        );
      }
      if (!Array.isArray(rule.conditions)) {
        throw new Error(
          `Decision "${definition.id}" rule "${rule.id}" requires conditions array`
        );
      }
    }
  }
}

function validateDependencies(definition: DecisionDefinition): void {
  for (const dep of definition.dependsOn ?? []) {
    if (!registry.has(dep)) {
      throw new Error(
        `Decision "${definition.id}" depends on unregistered decision "${dep}"`
      );
    }
  }
}

function freezeDefinition(definition: DecisionDefinition): DecisionDefinition {
  return Object.freeze({
    ...definition,
    policies: Object.freeze(
      definition.policies.map((p) =>
        Object.freeze({
          ...p,
          rules: Object.freeze(
            p.rules.map((r) =>
              Object.freeze({
                ...r,
                conditions: Object.freeze(
                  r.conditions.map((c) => Object.freeze({ ...c }))
                ),
              })
            )
          ),
        })
      )
    ),
    dependsOn: definition.dependsOn
      ? Object.freeze([...definition.dependsOn])
      : undefined,
    metadata: definition.metadata
      ? Object.freeze({ ...definition.metadata })
      : undefined,
    extensions: definition.extensions
      ? Object.freeze({ ...definition.extensions })
      : undefined,
  });
}

export function registerDecision(
  definition: DecisionDefinition
): DecisionDefinition {
  validateDefinition(definition);
  if (registry.has(definition.id)) {
    throw new Error(
      `Decision "${definition.id}" is already registered. Decision ids must be unique.`
    );
  }
  validateDependencies(definition);
  const frozen = freezeDefinition(definition);
  registry.set(frozen.id, frozen);
  return frozen;
}

export function unregisterDecision(decisionId: string): boolean {
  return registry.delete(decisionId);
}

export function getDecisionDefinition(
  decisionId: string
): DecisionDefinition | null {
  return registry.get(decisionId) ?? null;
}

export function listDecisionDefinitions(filter?: {
  applicationId?: string;
}): DecisionDefinition[] {
  const all = [...registry.values()].sort((a, b) => a.id.localeCompare(b.id));
  if (!filter?.applicationId) return all;
  return all.filter((d) => d.applicationId === filter.applicationId);
}

export function assertDecisionRegistered(
  decisionId: string
): DecisionDefinition {
  const def = getDecisionDefinition(decisionId);
  if (!def) {
    throw new Error(
      `Decision "${decisionId}" is not registered. Packages must registerDecision().`
    );
  }
  return def;
}

export function validateDecisionRegistryDependencies(): string[] {
  const errors: string[] = [];
  for (const def of registry.values()) {
    for (const dep of def.dependsOn ?? []) {
      if (!registry.has(dep)) {
        errors.push(`Decision "${def.id}" depends on missing "${dep}"`);
      }
    }
  }
  return errors;
}

export function resetDecisionRegistryForTests(): void {
  registry.clear();
}

export const DecisionRegistry = {
  register: registerDecision,
  unregister: unregisterDecision,
  get: getDecisionDefinition,
  list: listDecisionDefinitions,
  assert: assertDecisionRegistered,
  validateDependencies: validateDecisionRegistryDependencies,
  resetForTests: resetDecisionRegistryForTests,
} as const;
