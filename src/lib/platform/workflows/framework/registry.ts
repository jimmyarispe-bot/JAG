import type { WorkflowDefinition } from "@/lib/platform/workflows/framework/types";

const registry = new Map<string, WorkflowDefinition>();

export function resetWorkflowRegistryForTests(): void {
  registry.clear();
}

/**
 * Applications register workflow definitions.
 * Platform ships with zero application workflows.
 */
export function registerWorkflow(definition: WorkflowDefinition): WorkflowDefinition {
  if (!definition.id.trim()) throw new Error("WorkflowDefinition.id is required");
  if (!definition.states.length) {
    throw new Error(`Workflow "${definition.id}" must declare at least one state`);
  }
  const initials = definition.states.filter((s) => s.kind === "initial");
  if (initials.length !== 1) {
    throw new Error(
      `Workflow "${definition.id}" must have exactly one initial state`
    );
  }
  const normalized: WorkflowDefinition = {
    ...definition,
    id: definition.id.trim(),
    entityTypes: [...definition.entityTypes],
    states: definition.states.map((s) => ({ ...s })),
    transitions: definition.transitions.map((t) => ({
      ...t,
      allowedParticipantRoles: t.allowedParticipantRoles
        ? [...t.allowedParticipantRoles]
        : undefined,
      actions: t.actions?.map((a) => ({ ...a, params: { ...a.params } })),
      conditions: t.conditions ? structuredClone(t.conditions) : undefined,
    })),
    participants: definition.participants.map((p) => ({ ...p })),
    permissions: definition.permissions.map((p) => ({ ...p })),
    metadata: { ...definition.metadata },
  };
  registry.set(normalized.id, normalized);
  return normalized;
}

export function unregisterWorkflow(definitionId: string): boolean {
  return registry.delete(definitionId);
}

export function getWorkflowDefinition(
  definitionId: string
): WorkflowDefinition | null {
  return registry.get(definitionId) ?? null;
}

export function listWorkflowDefinitions(
  applicationId?: string | null
): WorkflowDefinition[] {
  const all = [...registry.values()].sort((a, b) => a.id.localeCompare(b.id));
  if (applicationId === undefined) return all;
  return all.filter(
    (d) => d.applicationId === applicationId || d.applicationId == null
  );
}

export function assertWorkflowRegistered(
  definitionId: string
): WorkflowDefinition {
  const def = getWorkflowDefinition(definitionId);
  if (!def) {
    throw new Error(
      `Workflow "${definitionId}" is not registered. Applications must registerWorkflow().`
    );
  }
  return def;
}

/** Alias matching the sprint naming: WorkflowRegistry.register(...) */
export const WorkflowRegistry = {
  register: registerWorkflow,
  unregister: unregisterWorkflow,
  get: getWorkflowDefinition,
  list: listWorkflowDefinitions,
  assert: assertWorkflowRegistered,
  resetForTests: resetWorkflowRegistryForTests,
} as const;
