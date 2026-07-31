import {
  getState,
  isTerminalState,
  listTransitionsFrom,
} from "@/lib/platform/workflows/framework/definition";
import type {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowTransitionDefinition,
} from "@/lib/platform/workflows/framework/types";

export function getInstanceStateLabel(
  definition: WorkflowDefinition,
  instance: WorkflowInstance
): string {
  return getState(definition, instance.currentState)?.label ?? instance.currentState;
}

export function listAllowedTransitions(
  definition: WorkflowDefinition,
  instance: WorkflowInstance
): WorkflowTransitionDefinition[] {
  if (instance.status !== "active") return [];
  return listTransitionsFrom(definition, instance.currentState);
}

export function instanceIsComplete(
  definition: WorkflowDefinition,
  instance: WorkflowInstance
): boolean {
  return (
    instance.status === "completed" ||
    isTerminalState(definition, instance.currentState)
  );
}
