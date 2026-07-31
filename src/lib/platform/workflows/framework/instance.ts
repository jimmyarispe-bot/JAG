import {
  getInitialState,
  isTerminalState,
} from "@/lib/platform/workflows/framework/definition";
import { appendWorkflowHistory } from "@/lib/platform/workflows/framework/history";
import { assertRequiredParticipants } from "@/lib/platform/workflows/framework/participants";
import { assertWorkflowRegistered } from "@/lib/platform/workflows/framework/registry";
import type {
  StartWorkflowInput,
  WorkflowInstance,
} from "@/lib/platform/workflows/framework/types";

const instanceStore = new Map<string, WorkflowInstance>();
let instanceSeq = 0;

export function resetWorkflowInstancesForTests(): void {
  instanceStore.clear();
  instanceSeq = 0;
}

export function getWorkflowInstance(id: string): WorkflowInstance | null {
  const hit = instanceStore.get(id);
  return hit ? cloneInstance(hit) : null;
}

export function listWorkflowInstances(filter?: {
  definitionId?: string;
  entityType?: string | null;
  entityId?: string | null;
  organizationId?: string | null;
  status?: WorkflowInstance["status"];
}): WorkflowInstance[] {
  let rows = [...instanceStore.values()];
  if (filter?.definitionId) {
    rows = rows.filter((i) => i.definitionId === filter.definitionId);
  }
  if (filter?.entityType != null) {
    rows = rows.filter((i) => i.entityType === filter.entityType);
  }
  if (filter?.entityId != null) {
    rows = rows.filter((i) => i.entityId === filter.entityId);
  }
  if (filter?.organizationId !== undefined) {
    rows = rows.filter((i) => i.organizationId === filter.organizationId);
  }
  if (filter?.status) {
    rows = rows.filter((i) => i.status === filter.status);
  }
  return rows.map(cloneInstance).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function upsertWorkflowInstance(instance: WorkflowInstance): WorkflowInstance {
  const stored = cloneInstance(instance);
  instanceStore.set(stored.id, stored);
  return cloneInstance(stored);
}

export function startWorkflowInstance(input: StartWorkflowInput): WorkflowInstance {
  const definition = assertWorkflowRegistered(input.definitionId);
  if (
    input.entityType &&
    definition.entityTypes.length > 0 &&
    !definition.entityTypes.includes(input.entityType)
  ) {
    throw new Error(
      `Workflow "${definition.id}" does not support entity type "${input.entityType}"`
    );
  }

  const participants = input.participants ?? [];
  assertRequiredParticipants(definition, participants);

  const now = input.now ?? new Date().toISOString();
  const initial = getInitialState(definition);
  instanceSeq += 1;
  const id = `wf-inst:${definition.id}:${instanceSeq}:${now}`;

  const instance: WorkflowInstance = {
    id,
    definitionId: definition.id,
    definitionVersion: definition.version,
    applicationId: definition.applicationId,
    organizationId: input.organizationId ?? null,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    currentState: initial.key,
    status: isTerminalState(definition, initial.key) ? "completed" : "active",
    participants: participants.map((p) => ({ ...p })),
    facts: { ...(input.facts ?? {}) },
    createdAt: now,
    updatedAt: now,
    completedAt: isTerminalState(definition, initial.key) ? now : null,
    history: appendWorkflowHistory([], {
      action: "started",
      fromState: null,
      toState: initial.key,
      transitionKey: null,
      actorUserId: input.actorUserId ?? null,
      reason: input.reason ?? "Workflow started",
      timestamp: now,
      generatedActions: [],
    }),
    metadata: { ...(input.metadata ?? {}) },
  };

  return upsertWorkflowInstance(instance);
}

function cloneInstance(instance: WorkflowInstance): WorkflowInstance {
  return {
    ...instance,
    participants: instance.participants.map((p) => ({ ...p })),
    facts: { ...instance.facts },
    history: instance.history.map((h) => ({
      ...h,
      generatedActions: [...h.generatedActions],
    })),
    metadata: { ...instance.metadata },
  };
}
