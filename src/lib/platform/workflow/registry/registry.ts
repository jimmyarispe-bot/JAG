import type {
  WorkflowDefinition,
  WorkflowRegistrySnapshot,
} from "@/lib/platform/workflow/types";

const WORKFLOW_REGISTRY = new Map<string, WorkflowDefinition>();
const DUPLICATE_WORKFLOW_KEYS: string[] = [];
let registered = false;

/** Register a workflow definition (idempotent per workflowKey). */
export function registerWorkflowDefinition(definition: WorkflowDefinition): void {
  if (WORKFLOW_REGISTRY.has(definition.workflowKey)) {
    DUPLICATE_WORKFLOW_KEYS.push(definition.workflowKey);
    return;
  }
  WORKFLOW_REGISTRY.set(definition.workflowKey, definition);
}

export function registerWorkflowDefinitions(definitions: WorkflowDefinition[]): void {
  for (const definition of definitions) {
    registerWorkflowDefinition(definition);
  }
}

export function getWorkflowDefinition(workflowKey: string): WorkflowDefinition | undefined {
  return WORKFLOW_REGISTRY.get(workflowKey);
}

export function getWorkflowDefinitionsByDomain(domain: string): WorkflowDefinition[] {
  return [...WORKFLOW_REGISTRY.values()]
    .filter((def) => def.domain === domain)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getActiveWorkflowDefinitions(): WorkflowDefinition[] {
  return [...WORKFLOW_REGISTRY.values()]
    .filter((def) => def.status === "active")
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getAllWorkflowDefinitions(): WorkflowDefinition[] {
  return [...WORKFLOW_REGISTRY.values()].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
}

export function getRegisteredWorkflowDomains(): string[] {
  return [...new Set([...WORKFLOW_REGISTRY.values()].map((def) => def.domain))].sort();
}

export function getWorkflowRegistrySnapshot(): WorkflowRegistrySnapshot {
  return {
    definitions: getAllWorkflowDefinitions(),
    domains: getRegisteredWorkflowDomains(),
    registeredAt: new Date().toISOString(),
  };
}

export function isWorkflowRegistryRegistered(): boolean {
  return registered;
}

export function markWorkflowRegistryRegistered(): void {
  registered = true;
}

/** Duplicate workflow keys detected during registration (build-time validation). */
export function getDuplicateWorkflowRegistrations(): string[] {
  return [...DUPLICATE_WORKFLOW_KEYS];
}

export function getWorkflowState(
  definition: WorkflowDefinition,
  stateKey: string
) {
  return definition.states.find((state) => state.key === stateKey);
}

export function getWorkflowTransition(
  definition: WorkflowDefinition,
  transitionKey: string
) {
  return definition.transitions.find((transition) => transition.key === transitionKey);
}

export function getTransitionsFromState(
  definition: WorkflowDefinition,
  fromStateKey: string
) {
  return definition.transitions
    .filter((transition) => transition.fromStateKey === fromStateKey)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getWorkflowTrigger(
  definition: WorkflowDefinition,
  triggerKey: string
) {
  return definition.triggers.find((trigger) => trigger.key === triggerKey);
}
