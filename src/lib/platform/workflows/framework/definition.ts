import type {
  WorkflowDefinition,
  WorkflowStateDefinition,
  WorkflowTransitionDefinition,
} from "@/lib/platform/workflows/framework/types";

export function getInitialState(
  definition: WorkflowDefinition
): WorkflowStateDefinition {
  const initial = definition.states.find((s) => s.kind === "initial");
  if (!initial) {
    throw new Error(`Workflow "${definition.id}" has no initial state`);
  }
  return initial;
}

export function getState(
  definition: WorkflowDefinition,
  stateKey: string
): WorkflowStateDefinition | null {
  return definition.states.find((s) => s.key === stateKey) ?? null;
}

export function listTransitionsFrom(
  definition: WorkflowDefinition,
  fromState: string
): WorkflowTransitionDefinition[] {
  return definition.transitions.filter((t) => t.from === fromState);
}

export function findTransition(
  definition: WorkflowDefinition,
  transitionKey: string
): WorkflowTransitionDefinition | null {
  return definition.transitions.find((t) => t.key === transitionKey) ?? null;
}

export function isTerminalState(
  definition: WorkflowDefinition,
  stateKey: string
): boolean {
  return getState(definition, stateKey)?.kind === "terminal";
}

/** Lightweight structural check used by tests / apps before register. */
export function validateWorkflowDefinition(definition: WorkflowDefinition): string[] {
  const errors: string[] = [];
  if (!definition.id) errors.push("id required");
  if (!definition.name) errors.push("name required");
  if (!definition.version) errors.push("version required");
  const stateKeys = new Set(definition.states.map((s) => s.key));
  const initials = definition.states.filter((s) => s.kind === "initial");
  if (initials.length !== 1) errors.push("exactly one initial state required");
  for (const t of definition.transitions) {
    if (!stateKeys.has(t.from)) errors.push(`transition ${t.key}: unknown from ${t.from}`);
    if (!stateKeys.has(t.to)) errors.push(`transition ${t.key}: unknown to ${t.to}`);
  }
  return errors;
}
