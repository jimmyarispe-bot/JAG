/**
 * StageRuntime — isolated stage enter / execute / validate / leave.
 */

import type {
  ProcessContext,
  ProcessDefinition,
  ProcessResult,
  StageDefinition,
  StageId,
} from "@/jag/processes/contracts/definitions";
import { getProcessExtensions } from "@/jag/processes/contracts/extensions";
import { emitProcessEvent } from "@/jag/processes/events";
import { runLifecycleHooks } from "@/jag/processes/lifecycle";

function stageOf(
  definition: ProcessDefinition,
  stageId: StageId
): StageDefinition | null {
  return definition.stages.find((s) => s.id === stageId) ?? null;
}

function fail<T = void>(code: string, message: string): ProcessResult<T> {
  return { ok: false, error: { code, message } };
}

export async function enterStage(input: {
  context: ProcessContext;
  stageId: StageId;
}): Promise<ProcessResult<{ stageId: StageId }>> {
  const stage = stageOf(input.context.definition, input.stageId);
  if (!stage) {
    return fail("stage_not_found", `Stage "${input.stageId}" is not defined`);
  }

  await runLifecycleHooks("BeforeStageEnter", {
    context: input.context,
    stageId: input.stageId,
  });

  const at = input.context.now().toISOString();
  emitProcessEvent({
    instanceId: input.context.instance.id,
    type: "stage.entered",
    occurredAt: at,
    actorUserId: input.context.actorUserId,
    stageId: input.stageId,
  });

  await runLifecycleHooks("AfterStageEnter", {
    context: input.context,
    stageId: input.stageId,
  });

  return { ok: true, value: { stageId: input.stageId } };
}

/**
 * Execute stage behaviors through extension ports only.
 * Isolation: no direct framework imports.
 */
export async function executeStage(input: {
  context: ProcessContext;
  stageId: StageId;
}): Promise<ProcessResult<{ stageId: StageId }>> {
  const stage = stageOf(input.context.definition, input.stageId);
  if (!stage) {
    return fail("stage_not_found", `Stage "${input.stageId}" is not defined`);
  }

  const ports = getProcessExtensions();
  const behavior = stage.behavior;

  if (behavior?.requiresFormId && ports.forms?.validateForm) {
    const formResult = await ports.forms.validateForm({
      formDefinitionId: behavior.requiresFormId,
      values: input.context.instance.payload,
      context: input.context,
    });
    if (!formResult.ok) {
      return fail(
        formResult.error?.code ?? "form_validation_failed",
        formResult.error?.message ?? "Form validation failed"
      );
    }
  }

  if (behavior?.requiresDocumentCategory && ports.documents?.requireEvidence) {
    const docResult = await ports.documents.requireEvidence({
      categoryId: behavior.requiresDocumentCategory,
      context: input.context,
    });
    if (!docResult.ok) {
      return fail(
        docResult.error?.code ?? "document_required",
        docResult.error?.message ?? "Required document evidence missing"
      );
    }
  }

  const at = input.context.now().toISOString();
  emitProcessEvent({
    instanceId: input.context.instance.id,
    type: "stage.executed",
    occurredAt: at,
    actorUserId: input.context.actorUserId,
    stageId: input.stageId,
    data: { behavior: behavior ?? null },
  });

  return { ok: true, value: { stageId: input.stageId } };
}

export async function validateStage(input: {
  context: ProcessContext;
  stageId: StageId;
}): Promise<ProcessResult<{ stageId: StageId; valid: boolean }>> {
  const stage = stageOf(input.context.definition, input.stageId);
  if (!stage) {
    return fail("stage_not_found", `Stage "${input.stageId}" is not defined`);
  }

  const at = input.context.now().toISOString();
  emitProcessEvent({
    instanceId: input.context.instance.id,
    type: "stage.validated",
    occurredAt: at,
    actorUserId: input.context.actorUserId,
    stageId: input.stageId,
    data: { valid: true },
  });

  return { ok: true, value: { stageId: input.stageId, valid: true } };
}

export async function leaveStage(input: {
  context: ProcessContext;
  stageId: StageId;
}): Promise<ProcessResult<{ stageId: StageId }>> {
  const stage = stageOf(input.context.definition, input.stageId);
  if (!stage) {
    return fail("stage_not_found", `Stage "${input.stageId}" is not defined`);
  }

  await runLifecycleHooks("BeforeStageExit", {
    context: input.context,
    stageId: input.stageId,
  });

  const at = input.context.now().toISOString();
  emitProcessEvent({
    instanceId: input.context.instance.id,
    type: "stage.left",
    occurredAt: at,
    actorUserId: input.context.actorUserId,
    stageId: input.stageId,
  });

  await runLifecycleHooks("AfterStageExit", {
    context: input.context,
    stageId: input.stageId,
  });

  return { ok: true, value: { stageId: input.stageId } };
}

export const StageRuntime = {
  enter: enterStage,
  execute: executeStage,
  validate: validateStage,
  leave: leaveStage,
} as const;
