import { executeWorkflowActions } from "@/lib/platform/workflows/framework/actions";
import { evaluateConditions } from "@/lib/platform/workflows/framework/conditions";
import {
  findTransition,
  isTerminalState,
} from "@/lib/platform/workflows/framework/definition";
import { appendWorkflowHistory } from "@/lib/platform/workflows/framework/history";
import {
  getWorkflowInstance,
  upsertWorkflowInstance,
} from "@/lib/platform/workflows/framework/instance";
import { assertCanFireTransition } from "@/lib/platform/workflows/framework/permissions";
import { assertWorkflowRegistered } from "@/lib/platform/workflows/framework/registry";
import type {
  TransitionWorkflowInput,
  WorkflowInstance,
} from "@/lib/platform/workflows/framework/types";

/**
 * Deterministic state transition. Same inputs → same resulting instance.
 */
export function transitionWorkflow(
  input: TransitionWorkflowInput
): WorkflowInstance {
  const existing = getWorkflowInstance(input.instanceId);
  if (!existing) {
    throw new Error(`Workflow instance not found: ${input.instanceId}`);
  }
  if (existing.status !== "active") {
    throw new Error(
      `Cannot transition instance in status "${existing.status}"`
    );
  }

  const definition = assertWorkflowRegistered(existing.definitionId);
  const transition = findTransition(definition, input.transitionKey);
  if (!transition) {
    throw new Error(
      `Unknown transition "${input.transitionKey}" on workflow "${definition.id}"`
    );
  }
  if (transition.from !== existing.currentState) {
    throw new Error(
      `Transition "${transition.key}" not allowed from state "${existing.currentState}"`
    );
  }

  assertCanFireTransition({
    transition,
    participants: existing.participants,
    actorUserId: input.actorUserId,
    actorParticipantRole: input.actorParticipantRole,
    grantedPermissions: input.grantedPermissions,
  });

  const now = input.now ?? new Date().toISOString();
  const facts = {
    ...existing.facts,
    ...(input.factUpdates ?? {}),
  };

  if (!evaluateConditions(transition.conditions, facts)) {
    throw new Error(
      `Conditions not met for transition "${transition.key}"`
    );
  }

  const actionRun = executeWorkflowActions({
    actions: transition.actions,
    instance: { ...existing, facts },
    actorUserId: input.actorUserId,
    now,
  });

  const failed = actionRun.results.filter((r) => !r.ok);
  if (failed.length > 0) {
    throw new Error(
      `Workflow actions failed: ${failed.map((f) => f.detail).join("; ")}`
    );
  }

  const terminal = isTerminalState(definition, transition.to);
  const updated: WorkflowInstance = {
    ...existing,
    currentState: transition.to,
    status: terminal ? "completed" : "active",
    facts,
    updatedAt: now,
    completedAt: terminal ? now : existing.completedAt,
    metadata: {
      ...existing.metadata,
      ...(actionRun.lastDecisionId
        ? { lastDecisionId: actionRun.lastDecisionId }
        : {}),
    },
    history: appendWorkflowHistory(existing.history, {
      action: "transitioned",
      fromState: existing.currentState,
      toState: transition.to,
      transitionKey: transition.key,
      actorUserId: input.actorUserId ?? null,
      reason: input.reason ?? transition.label,
      timestamp: now,
      generatedActions: actionRun.details,
    }),
  };

  return upsertWorkflowInstance(updated);
}
