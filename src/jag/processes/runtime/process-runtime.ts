/**
 * ProcessRuntime — deterministic process lifecycle orchestration.
 */

import type {
  ProcessContext,
  ProcessDefinition,
  ProcessInstance,
  ProcessInstanceId,
  ProcessResult,
  ProcessSnapshot,
  StageId,
  StageTransition,
} from "@/jag/processes/contracts/definitions";
import { getProcessExtensions } from "@/jag/processes/contracts/extensions";
import { emitProcessEvent } from "@/jag/processes/events";
import {
  enterStage,
  executeStage,
  leaveStage,
  validateStage,
} from "@/jag/processes/execution";
import { runLifecycleHooks } from "@/jag/processes/lifecycle";
import { checkProcessPermission } from "@/jag/processes/permissions";
import { assertProcessRegistered } from "@/jag/processes/registry";
import {
  getProcessInstance,
  listProcessSnapshots,
  putProcessInstance,
  putProcessSnapshot,
} from "@/jag/processes/runtime/instance-store";
import { processNow } from "@/jag/processes/runtime/clock";
import { nextProcessOpaqueId } from "@/jag/processes/runtime/ids";
import {
  trackParticipantAction,
  trackProcessCancellation,
  trackProcessCompletion,
  trackProcessStart,
  trackStageChange,
} from "@/jag/processes/telemetry";

function fail<T = never>(code: string, message: string): ProcessResult<T> {
  return { ok: false, error: { code, message } };
}

function iso(d: Date = processNow()): string {
  return d.toISOString();
}

function contextOf(
  instance: ProcessInstance,
  definition: ProcessDefinition,
  actorUserId: string
): ProcessContext {
  return {
    organizationId: instance.organizationId,
    actorUserId,
    instance,
    definition,
    now: processNow,
  };
}

function findTransition(
  definition: ProcessDefinition,
  from: StageId,
  to: StageId,
  transitionId?: string
): StageTransition | null {
  if (transitionId) {
    return (
      definition.transitions.find(
        (t) => t.id === transitionId && t.from === from && t.to === to
      ) ?? null
    );
  }
  const matches = definition.transitions.filter(
    (t) => t.from === from && t.to === to
  );
  return matches.length === 1 ? matches[0]! : null;
}

function mutateInstance(
  instance: ProcessInstance,
  patch: Partial<ProcessInstance>
): ProcessInstance {
  const next: ProcessInstance = Object.freeze({
    ...instance,
    ...patch,
    payload: Object.freeze({ ...(patch.payload ?? instance.payload) }),
    participants: Object.freeze(
      [...(patch.participants ?? instance.participants)].map((p) =>
        Object.freeze({ ...p })
      )
    ),
    stageHistory: Object.freeze(
      [...(patch.stageHistory ?? instance.stageHistory)].map((h) =>
        Object.freeze({ ...h })
      )
    ),
  });
  putProcessInstance(next);
  return next;
}

function captureSnapshot(instance: ProcessInstance): ProcessSnapshot {
  const snapshot: ProcessSnapshot = Object.freeze({
    instanceId: instance.id,
    definitionId: instance.definitionId,
    capturedAt: iso(),
    status: instance.status,
    currentStageId: instance.currentStageId,
    payload: Object.freeze({ ...instance.payload }),
    participants: Object.freeze(
      instance.participants.map((p) => Object.freeze({ ...p }))
    ),
    stageHistory: Object.freeze(
      instance.stageHistory.map((h) => Object.freeze({ ...h }))
    ),
  });
  putProcessSnapshot(snapshot);
  return snapshot;
}

export type StartProcessInput = {
  processId: string;
  organizationId: string;
  actorUserId: string;
  subjectId?: string;
  payload?: Record<string, unknown>;
  participants?: ProcessInstance["participants"];
  actorRoles?: readonly string[];
  actorPermissionKeys?: readonly string[];
};

export async function startProcess(
  input: StartProcessInput
): Promise<ProcessResult<{ instance: ProcessInstance }>> {
  const definition = assertProcessRegistered(input.processId);
  const permission = checkProcessPermission({
    definition,
    action: "start",
    actorRoles: input.actorRoles,
    actorPermissionKeys: input.actorPermissionKeys,
  });
  if (!permission.allowed) {
    return fail("permission_denied", permission.reason ?? "Not permitted");
  }

  const startedAt = iso();
  const instanceId = nextProcessOpaqueId("inst");
  let instance: ProcessInstance = Object.freeze({
    id: instanceId,
    definitionId: definition.id,
    definitionVersion: definition.version,
    organizationId: input.organizationId,
    status: "active",
    currentStageId: definition.initialStageId,
    subjectId: input.subjectId,
    startedByUserId: input.actorUserId,
    startedAt,
    updatedAt: startedAt,
    payload: Object.freeze({ ...(input.payload ?? {}) }),
    participants: Object.freeze(
      (input.participants ?? definition.participants ?? []).map((p) =>
        Object.freeze({ ...p })
      )
    ),
    stageHistory: Object.freeze([]),
  });
  putProcessInstance(instance);

  const ctx = contextOf(instance, definition, input.actorUserId);

  await runLifecycleHooks("BeforeProcessStart", { context: ctx });

  const enter = await enterStage({
    context: ctx,
    stageId: definition.initialStageId,
  });
  if (!enter.ok) return fail(enter.error!.code, enter.error!.message);

  instance = mutateInstance(instance, {
    stageHistory: [
      { stageId: definition.initialStageId, enteredAt: startedAt },
    ],
    updatedAt: iso(),
  });

  const exec = await executeStage({
    context: contextOf(instance, definition, input.actorUserId),
    stageId: definition.initialStageId,
  });
  if (!exec.ok) return fail(exec.error!.code, exec.error!.message);

  await validateStage({
    context: contextOf(instance, definition, input.actorUserId),
    stageId: definition.initialStageId,
  });

  emitProcessEvent({
    instanceId: instance.id,
    type: "process.started",
    occurredAt: startedAt,
    actorUserId: input.actorUserId,
    stageId: definition.initialStageId,
  });

  trackProcessStart({
    instanceId: instance.id,
    definitionId: definition.id,
    at: startedAt,
  });
  trackParticipantAction({
    instanceId: instance.id,
    actorUserId: input.actorUserId,
    action: "start",
    at: startedAt,
  });

  // Optional linked workflow via extension port only.
  const wfId = definition.extensions?.workflowDefinitionId;
  const ports = getProcessExtensions();
  if (wfId && ports.workflows?.startLinkedWorkflow) {
    await ports.workflows.startLinkedWorkflow({
      workflowDefinitionId: wfId,
      context: contextOf(instance, definition, input.actorUserId),
    });
  }

  await runLifecycleHooks("AfterProcessStart", {
    context: contextOf(instance, definition, input.actorUserId),
  });

  captureSnapshot(instance);
  return { ok: true, value: { instance } };
}

export type TransitionProcessInput = {
  instanceId: ProcessInstanceId;
  toStageId: StageId;
  actorUserId: string;
  transitionId?: string;
  payloadPatch?: Record<string, unknown>;
  actorRoles?: readonly string[];
  actorPermissionKeys?: readonly string[];
};

export async function transitionProcess(
  input: TransitionProcessInput
): Promise<ProcessResult<{ instance: ProcessInstance }>> {
  const current = getProcessInstance(input.instanceId);
  if (!current) {
    return fail("instance_not_found", `Instance "${input.instanceId}" not found`);
  }
  if (current.status !== "active") {
    return fail(
      "invalid_status",
      `Cannot transition process in status "${current.status}"`
    );
  }

  const definition = assertProcessRegistered(current.definitionId);
  const permission = checkProcessPermission({
    definition,
    action: "transition",
    actorRoles: input.actorRoles,
    actorPermissionKeys: input.actorPermissionKeys,
  });
  if (!permission.allowed) {
    return fail("permission_denied", permission.reason ?? "Not permitted");
  }

  const transition = findTransition(
    definition,
    current.currentStageId,
    input.toStageId,
    input.transitionId
  );
  if (!transition) {
    return fail(
      "transition_not_found",
      `No unique transition from "${current.currentStageId}" to "${input.toStageId}"`
    );
  }

  if (transition.guardPermission) {
    const keys = new Set(input.actorPermissionKeys ?? []);
    if (!keys.has(transition.guardPermission)) {
      return fail(
        "transition_guard",
        `Missing permission "${transition.guardPermission}"`
      );
    }
  }

  let instance = current;
  const ctx = contextOf(instance, definition, input.actorUserId);

  await runLifecycleHooks("BeforeTransition", {
    context: ctx,
    stageId: input.toStageId,
    transitionId: transition.id,
  });

  const leave = await leaveStage({
    context: ctx,
    stageId: instance.currentStageId,
  });
  if (!leave.ok) return fail(leave.error!.code, leave.error!.message);

  const at = iso();
  const history = instance.stageHistory.map((h) =>
    h.stageId === instance.currentStageId && !h.leftAt
      ? { ...h, leftAt: at }
      : h
  );

  const fromStageId = instance.currentStageId;
  instance = mutateInstance(instance, {
    currentStageId: input.toStageId,
    updatedAt: at,
    payload: input.payloadPatch
      ? { ...instance.payload, ...input.payloadPatch }
      : instance.payload,
    stageHistory: [
      ...history,
      { stageId: input.toStageId, enteredAt: at },
    ],
  });

  const enter = await enterStage({
    context: contextOf(instance, definition, input.actorUserId),
    stageId: input.toStageId,
  });
  if (!enter.ok) return fail(enter.error!.code, enter.error!.message);

  const exec = await executeStage({
    context: contextOf(instance, definition, input.actorUserId),
    stageId: input.toStageId,
  });
  if (!exec.ok) return fail(exec.error!.code, exec.error!.message);

  await validateStage({
    context: contextOf(instance, definition, input.actorUserId),
    stageId: input.toStageId,
  });

  emitProcessEvent({
    instanceId: instance.id,
    type: "transition.applied",
    occurredAt: at,
    actorUserId: input.actorUserId,
    stageId: input.toStageId,
    transitionId: transition.id,
    data: { from: fromStageId, to: input.toStageId },
  });

  trackStageChange({
    instanceId: instance.id,
    fromStageId,
    toStageId: input.toStageId,
    at,
  });
  trackParticipantAction({
    instanceId: instance.id,
    actorUserId: input.actorUserId,
    action: "transition",
    at,
  });

  await runLifecycleHooks("AfterTransition", {
    context: contextOf(instance, definition, input.actorUserId),
    stageId: input.toStageId,
    transitionId: transition.id,
  });

  // Auto-complete when landing on a terminal stage.
  const landed = definition.stages.find((s) => s.id === input.toStageId);
  if (landed?.kind === "terminal") {
    return completeProcess({
      instanceId: instance.id,
      actorUserId: input.actorUserId,
      actorRoles: input.actorRoles,
      actorPermissionKeys: input.actorPermissionKeys,
    });
  }
  if (landed?.kind === "cancelled") {
    return cancelProcess({
      instanceId: instance.id,
      actorUserId: input.actorUserId,
      reason: "cancelled_stage",
      actorRoles: input.actorRoles,
      actorPermissionKeys: input.actorPermissionKeys,
    });
  }

  captureSnapshot(instance);
  return { ok: true, value: { instance } };
}

export async function resumeProcess(input: {
  instanceId: ProcessInstanceId;
  actorUserId: string;
  actorRoles?: readonly string[];
  actorPermissionKeys?: readonly string[];
}): Promise<ProcessResult<{ instance: ProcessInstance }>> {
  const current = getProcessInstance(input.instanceId);
  if (!current) {
    return fail("instance_not_found", `Instance "${input.instanceId}" not found`);
  }
  if (current.status !== "suspended") {
    return fail(
      "invalid_status",
      `Cannot resume process in status "${current.status}"`
    );
  }
  const definition = assertProcessRegistered(current.definitionId);
  const permission = checkProcessPermission({
    definition,
    action: "resume",
    actorRoles: input.actorRoles,
    actorPermissionKeys: input.actorPermissionKeys,
  });
  if (!permission.allowed) {
    return fail("permission_denied", permission.reason ?? "Not permitted");
  }

  const at = iso();
  const instance = mutateInstance(current, {
    status: "active",
    updatedAt: at,
  });

  emitProcessEvent({
    instanceId: instance.id,
    type: "process.resumed",
    occurredAt: at,
    actorUserId: input.actorUserId,
    stageId: instance.currentStageId,
  });
  trackParticipantAction({
    instanceId: instance.id,
    actorUserId: input.actorUserId,
    action: "resume",
    at,
  });

  return { ok: true, value: { instance } };
}

export async function suspendProcess(input: {
  instanceId: ProcessInstanceId;
  actorUserId: string;
  actorRoles?: readonly string[];
  actorPermissionKeys?: readonly string[];
}): Promise<ProcessResult<{ instance: ProcessInstance }>> {
  const current = getProcessInstance(input.instanceId);
  if (!current) {
    return fail("instance_not_found", `Instance "${input.instanceId}" not found`);
  }
  if (current.status !== "active") {
    return fail(
      "invalid_status",
      `Cannot suspend process in status "${current.status}"`
    );
  }
  const definition = assertProcessRegistered(current.definitionId);
  const permission = checkProcessPermission({
    definition,
    action: "suspend",
    actorRoles: input.actorRoles,
    actorPermissionKeys: input.actorPermissionKeys,
  });
  if (!permission.allowed) {
    return fail("permission_denied", permission.reason ?? "Not permitted");
  }

  captureSnapshot(current);
  const at = iso();
  const instance = mutateInstance(current, {
    status: "suspended",
    updatedAt: at,
  });

  emitProcessEvent({
    instanceId: instance.id,
    type: "process.suspended",
    occurredAt: at,
    actorUserId: input.actorUserId,
    stageId: instance.currentStageId,
  });
  trackParticipantAction({
    instanceId: instance.id,
    actorUserId: input.actorUserId,
    action: "suspend",
    at,
  });

  return { ok: true, value: { instance } };
}

export async function completeProcess(input: {
  instanceId: ProcessInstanceId;
  actorUserId: string;
  actorRoles?: readonly string[];
  actorPermissionKeys?: readonly string[];
}): Promise<ProcessResult<{ instance: ProcessInstance }>> {
  const current = getProcessInstance(input.instanceId);
  if (!current) {
    return fail("instance_not_found", `Instance "${input.instanceId}" not found`);
  }
  if (current.status !== "active" && current.status !== "suspended") {
    return fail(
      "invalid_status",
      `Cannot complete process in status "${current.status}"`
    );
  }

  const definition = assertProcessRegistered(current.definitionId);
  const permission = checkProcessPermission({
    definition,
    action: "complete",
    actorRoles: input.actorRoles,
    actorPermissionKeys: input.actorPermissionKeys,
  });
  if (!permission.allowed) {
    return fail("permission_denied", permission.reason ?? "Not permitted");
  }

  const stage = definition.stages.find((s) => s.id === current.currentStageId);
  if (stage && stage.kind !== "terminal") {
    // Allow explicit complete only from terminal, or when already on terminal via transition.
    // Explicit complete from non-terminal is rejected to keep lifecycle deterministic.
    return fail(
      "not_terminal",
      `Stage "${current.currentStageId}" is not terminal; transition first`
    );
  }

  const ctx = contextOf(current, definition, input.actorUserId);
  await runLifecycleHooks("BeforeProcessComplete", { context: ctx });

  const at = iso();
  const history = current.stageHistory.map((h) =>
    h.stageId === current.currentStageId && !h.leftAt
      ? { ...h, leftAt: at }
      : h
  );
  const instance = mutateInstance(current, {
    status: "completed",
    updatedAt: at,
    completedAt: at,
    stageHistory: history,
  });

  emitProcessEvent({
    instanceId: instance.id,
    type: "process.completed",
    occurredAt: at,
    actorUserId: input.actorUserId,
    stageId: instance.currentStageId,
  });
  trackProcessCompletion({ instanceId: instance.id, at });
  trackParticipantAction({
    instanceId: instance.id,
    actorUserId: input.actorUserId,
    action: "complete",
    at,
  });

  const ports = getProcessExtensions();
  if (ports.communications?.notifyParticipants) {
    await ports.communications.notifyParticipants({
      context: contextOf(instance, definition, input.actorUserId),
      eventType: "process.completed",
    });
  }

  await runLifecycleHooks("AfterProcessComplete", {
    context: contextOf(instance, definition, input.actorUserId),
  });

  captureSnapshot(instance);
  return { ok: true, value: { instance } };
}

export async function cancelProcess(input: {
  instanceId: ProcessInstanceId;
  actorUserId: string;
  reason?: string;
  actorRoles?: readonly string[];
  actorPermissionKeys?: readonly string[];
}): Promise<ProcessResult<{ instance: ProcessInstance }>> {
  const current = getProcessInstance(input.instanceId);
  if (!current) {
    return fail("instance_not_found", `Instance "${input.instanceId}" not found`);
  }
  if (current.status === "completed" || current.status === "cancelled") {
    return fail(
      "invalid_status",
      `Cannot cancel process in status "${current.status}"`
    );
  }

  const definition = assertProcessRegistered(current.definitionId);
  const permission = checkProcessPermission({
    definition,
    action: "cancel",
    actorRoles: input.actorRoles,
    actorPermissionKeys: input.actorPermissionKeys,
  });
  if (!permission.allowed) {
    return fail("permission_denied", permission.reason ?? "Not permitted");
  }

  const at = iso();
  const instance = mutateInstance(current, {
    status: "cancelled",
    updatedAt: at,
    cancelledAt: at,
    payload: input.reason
      ? { ...current.payload, cancelReason: input.reason }
      : current.payload,
  });

  emitProcessEvent({
    instanceId: instance.id,
    type: "process.cancelled",
    occurredAt: at,
    actorUserId: input.actorUserId,
    stageId: instance.currentStageId,
    data: { reason: input.reason ?? null },
  });
  trackProcessCancellation({ instanceId: instance.id, at });
  trackParticipantAction({
    instanceId: instance.id,
    actorUserId: input.actorUserId,
    action: "cancel",
    at,
  });

  captureSnapshot(instance);
  return { ok: true, value: { instance } };
}

export async function restoreSnapshot(input: {
  instanceId: ProcessInstanceId;
  actorUserId: string;
  /** ISO capturedAt of a prior snapshot; defaults to latest. */
  capturedAt?: string;
}): Promise<ProcessResult<{ instance: ProcessInstance; snapshot: ProcessSnapshot }>> {
  const current = getProcessInstance(input.instanceId);
  if (!current) {
    return fail("instance_not_found", `Instance "${input.instanceId}" not found`);
  }

  const snaps = listProcessSnapshots(input.instanceId);
  // Prefer the earliest snapshot matching capturedAt (frozen clocks may repeat ISO times).
  const snapshot = input.capturedAt
    ? snaps.find((s) => s.capturedAt === input.capturedAt) ?? null
    : snaps[snaps.length - 1] ?? null;

  if (!snapshot) {
    return fail("snapshot_not_found", "No matching snapshot to restore");
  }

  const at = iso();
  const instance = mutateInstance(current, {
    status: snapshot.status === "completed" || snapshot.status === "cancelled"
      ? "active"
      : snapshot.status,
    currentStageId: snapshot.currentStageId,
    payload: { ...snapshot.payload },
    participants: [...snapshot.participants],
    stageHistory: [...snapshot.stageHistory],
    updatedAt: at,
    completedAt: undefined,
    cancelledAt: undefined,
  });

  emitProcessEvent({
    instanceId: instance.id,
    type: "process.snapshot_restored",
    occurredAt: at,
    actorUserId: input.actorUserId,
    stageId: instance.currentStageId,
    data: { capturedAt: snapshot.capturedAt },
  });

  return { ok: true, value: { instance, snapshot } };
}

export const ProcessRuntime = {
  start: startProcess,
  resume: resumeProcess,
  complete: completeProcess,
  cancel: cancelProcess,
  suspend: suspendProcess,
  restoreSnapshot,
  transition: transitionProcess,
  getInstance: getProcessInstance,
} as const;
