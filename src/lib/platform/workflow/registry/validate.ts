import {
  getAllWorkflowDefinitions,
  getDuplicateWorkflowRegistrations,
  getWorkflowState,
} from "@/lib/platform/workflow/registry/registry";
import { isKnownWorkflowTriggerType } from "@/lib/platform/workflow/catalog/triggers";
import type { WorkflowDefinition } from "@/lib/platform/workflow/types";

export interface WorkflowRegistryValidationIssue {
  code:
    | "duplicate_workflow_key"
    | "missing_initial_state"
    | "invalid_initial_state_type"
    | "orphan_transition_state"
    | "orphan_trigger_reference"
    | "unknown_trigger_type"
    | "duplicate_state_key"
    | "duplicate_transition_key"
    | "duplicate_trigger_key"
    | "unreachable_state"
    | "no_terminal_state";
  message: string;
}

export interface WorkflowRegistryValidationResult {
  ok: boolean;
  issues: WorkflowRegistryValidationIssue[];
}

function validateDefinition(
  definition: WorkflowDefinition,
  issues: WorkflowRegistryValidationIssue[]
): void {
  const stateKeys = new Set<string>();
  for (const state of definition.states) {
    if (stateKeys.has(state.key)) {
      issues.push({
        code: "duplicate_state_key",
        message: `Workflow "${definition.workflowKey}" has duplicate state key "${state.key}"`,
      });
    }
    stateKeys.add(state.key);
  }

  const transitionKeys = new Set<string>();
  for (const transition of definition.transitions) {
    if (transitionKeys.has(transition.key)) {
      issues.push({
        code: "duplicate_transition_key",
        message: `Workflow "${definition.workflowKey}" has duplicate transition key "${transition.key}"`,
      });
    }
    transitionKeys.add(transition.key);

    if (!stateKeys.has(transition.fromStateKey)) {
      issues.push({
        code: "orphan_transition_state",
        message: `Workflow "${definition.workflowKey}" transition "${transition.key}" references unknown fromState "${transition.fromStateKey}"`,
      });
    }
    if (!stateKeys.has(transition.toStateKey)) {
      issues.push({
        code: "orphan_transition_state",
        message: `Workflow "${definition.workflowKey}" transition "${transition.key}" references unknown toState "${transition.toStateKey}"`,
      });
    }

    for (const triggerKey of transition.triggerKeys ?? []) {
      if (!definition.triggers.some((trigger) => trigger.key === triggerKey)) {
        issues.push({
          code: "orphan_trigger_reference",
          message: `Workflow "${definition.workflowKey}" transition "${transition.key}" references unknown trigger "${triggerKey}"`,
        });
      }
    }
  }

  const triggerKeys = new Set<string>();
  for (const trigger of definition.triggers) {
    if (triggerKeys.has(trigger.key)) {
      issues.push({
        code: "duplicate_trigger_key",
        message: `Workflow "${definition.workflowKey}" has duplicate trigger key "${trigger.key}"`,
      });
    }
    triggerKeys.add(trigger.key);

    if (!isKnownWorkflowTriggerType(trigger.triggerType)) {
      issues.push({
        code: "unknown_trigger_type",
        message: `Workflow "${definition.workflowKey}" trigger "${trigger.key}" uses unknown type "${trigger.triggerType}"`,
      });
    }
  }

  const initialState = getWorkflowState(definition, definition.initialStateKey);
  if (!initialState) {
    issues.push({
      code: "missing_initial_state",
      message: `Workflow "${definition.workflowKey}" initialStateKey "${definition.initialStateKey}" is not defined`,
    });
  } else if (initialState.stateType !== "initial") {
    issues.push({
      code: "invalid_initial_state_type",
      message: `Workflow "${definition.workflowKey}" initial state "${definition.initialStateKey}" must have stateType "initial"`,
    });
  }

  const hasTerminal = definition.states.some((state) => state.stateType === "terminal");
  if (!hasTerminal) {
    issues.push({
      code: "no_terminal_state",
      message: `Workflow "${definition.workflowKey}" has no terminal state`,
    });
  }

  const reachable = new Set<string>([definition.initialStateKey]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const transition of definition.transitions) {
      if (reachable.has(transition.fromStateKey) && !reachable.has(transition.toStateKey)) {
        reachable.add(transition.toStateKey);
        changed = true;
      }
    }
  }

  for (const state of definition.states) {
    if (!reachable.has(state.key) && state.stateType !== "terminal") {
      issues.push({
        code: "unreachable_state",
        message: `Workflow "${definition.workflowKey}" state "${state.key}" is unreachable from initial state`,
      });
    }
  }
}

/** Validate platform workflow registry integrity — intended for build-time checks. */
export function validateWorkflowRegistry(): WorkflowRegistryValidationResult {
  const issues: WorkflowRegistryValidationIssue[] = [];

  for (const duplicate of getDuplicateWorkflowRegistrations()) {
    issues.push({
      code: "duplicate_workflow_key",
      message: `Duplicate workflow key "${duplicate}" registered`,
    });
  }

  const workflowKeys = new Set<string>();
  for (const definition of getAllWorkflowDefinitions()) {
    if (workflowKeys.has(definition.workflowKey)) {
      issues.push({
        code: "duplicate_workflow_key",
        message: `Duplicate workflow key "${definition.workflowKey}"`,
      });
    }
    workflowKeys.add(definition.workflowKey);
    validateDefinition(definition, issues);
  }

  return { ok: issues.length === 0, issues };
}
