import {
  normalizeProcessDefinition,
  type JagProcessDefinition,
} from "@/jag/processes/contracts/compat";
import type { ProcessDefinition } from "@/jag/processes/contracts/definitions";

const registry = new Map<string, ProcessDefinition>();

function validateDefinition(definition: ProcessDefinition): void {
  if (!definition.id.trim()) {
    throw new Error("ProcessDefinition.id is required");
  }
  if (!definition.applicationId.trim()) {
    throw new Error(`Process "${definition.id}" requires applicationId`);
  }
  if (!definition.version.trim()) {
    throw new Error(`Process "${definition.id}" requires version`);
  }
  if (!definition.stages.length) {
    throw new Error(`Process "${definition.id}" must declare at least one stage`);
  }

  const stageIds = new Set(definition.stages.map((s) => s.id));
  if (stageIds.size !== definition.stages.length) {
    throw new Error(`Process "${definition.id}" has duplicate stage ids`);
  }
  if (!stageIds.has(definition.initialStageId)) {
    throw new Error(
      `Process "${definition.id}" initialStageId "${definition.initialStageId}" is not a declared stage`
    );
  }

  const initials = definition.stages.filter((s) => s.kind === "initial");
  if (initials.length !== 1) {
    throw new Error(
      `Process "${definition.id}" must have exactly one stage with kind "initial"`
    );
  }
  if (initials[0]!.id !== definition.initialStageId) {
    throw new Error(
      `Process "${definition.id}" initialStageId must match the unique initial stage`
    );
  }

  for (const t of definition.transitions) {
    if (!t.id.trim()) {
      throw new Error(`Process "${definition.id}" has a transition without id`);
    }
    if (!stageIds.has(t.from) || !stageIds.has(t.to)) {
      throw new Error(
        `Process "${definition.id}" transition "${t.id}" references unknown stage`
      );
    }
  }

  const transitionIds = new Set(definition.transitions.map((t) => t.id));
  if (transitionIds.size !== definition.transitions.length) {
    throw new Error(`Process "${definition.id}" has duplicate transition ids`);
  }
}

function validateDependencies(definition: ProcessDefinition): void {
  for (const dep of definition.dependsOn ?? []) {
    if (!registry.has(dep)) {
      throw new Error(
        `Process "${definition.id}" depends on unregistered process "${dep}"`
      );
    }
  }
}

/**
 * Packages register process definitions here.
 * Uniqueness is enforced by definition id.
 */
export function registerProcess(
  definition: ProcessDefinition | JagProcessDefinition
): ProcessDefinition {
  const normalized = normalizeProcessDefinition(definition);
  validateDefinition(normalized);

  if (registry.has(normalized.id)) {
    throw new Error(
      `Process "${normalized.id}" is already registered. Process ids must be unique.`
    );
  }

  validateDependencies(normalized);

  const frozen: ProcessDefinition = Object.freeze({
    ...normalized,
    stages: Object.freeze(normalized.stages.map((s) => Object.freeze({ ...s }))),
    transitions: Object.freeze(
      normalized.transitions.map((t) => Object.freeze({ ...t }))
    ),
    participants: normalized.participants
      ? Object.freeze(normalized.participants.map((p) => Object.freeze({ ...p })))
      : undefined,
    permissions: normalized.permissions
      ? Object.freeze(normalized.permissions.map((p) => Object.freeze({ ...p })))
      : undefined,
    dependsOn: normalized.dependsOn
      ? Object.freeze([...normalized.dependsOn])
      : undefined,
    metadata: normalized.metadata
      ? Object.freeze({ ...normalized.metadata })
      : undefined,
    extensions: normalized.extensions
      ? Object.freeze({ ...normalized.extensions })
      : undefined,
  });

  registry.set(frozen.id, frozen);
  return frozen;
}

export function unregisterProcess(definitionId: string): boolean {
  return registry.delete(definitionId);
}

export function getProcessDefinition(
  definitionId: string
): ProcessDefinition | null {
  return registry.get(definitionId) ?? null;
}

export function listProcessDefinitions(filter?: {
  applicationId?: string;
}): ProcessDefinition[] {
  const all = [...registry.values()].sort((a, b) => a.id.localeCompare(b.id));
  if (!filter?.applicationId) return all;
  return all.filter((d) => d.applicationId === filter.applicationId);
}

export function assertProcessRegistered(
  definitionId: string
): ProcessDefinition {
  const def = getProcessDefinition(definitionId);
  if (!def) {
    throw new Error(
      `Process "${definitionId}" is not registered. Packages must registerProcess().`
    );
  }
  return def;
}

/** Re-validate dependsOn for all installed processes (e.g. after bulk load). */
export function validateProcessRegistryDependencies(): string[] {
  const errors: string[] = [];
  for (const def of registry.values()) {
    for (const dep of def.dependsOn ?? []) {
      if (!registry.has(dep)) {
        errors.push(`Process "${def.id}" depends on missing "${dep}"`);
      }
    }
  }
  return errors;
}

export function resetProcessRegistryForTests(): void {
  registry.clear();
}

/** @deprecated Prefer registerProcess */
export function registerJagProcessDefinition(
  definition: ProcessDefinition | JagProcessDefinition
): ProcessDefinition {
  return registerProcess(definition);
}

/** @deprecated Prefer getProcessDefinition */
export function getJagProcessDefinition(
  id: string
): ProcessDefinition | null {
  return getProcessDefinition(id);
}

/** @deprecated Prefer listProcessDefinitions */
export function listJagProcessDefinitions(filter?: {
  applicationId?: string;
}): ProcessDefinition[] {
  return listProcessDefinitions(filter);
}

/** @deprecated Prefer resetProcessRegistryForTests */
export function resetJagProcessRegistryForTests(): void {
  resetProcessRegistryForTests();
}

export const ProcessRegistry = {
  register: registerProcess,
  unregister: unregisterProcess,
  get: getProcessDefinition,
  list: listProcessDefinitions,
  assert: assertProcessRegistered,
  validateDependencies: validateProcessRegistryDependencies,
  resetForTests: resetProcessRegistryForTests,
} as const;
