import type {
  RuntimeAction,
  RuntimeContext,
  RuntimeEvidenceReference,
  RuntimeExecutionState,
  RuntimeExperience,
  RuntimeIdentity,
  RuntimeIntent,
  RuntimeMemoryReference,
  RuntimeOrganizationalContext,
  RuntimePipelineTrigger,
  RuntimeTwinReference,
} from "../contracts";
import { RuntimeCancellationError } from "../errors";
import {
  createCorrelationId,
  type CorrelationId,
  type RuntimeId,
  type SessionId,
} from "../types/ids";
import type { RuntimeLifecycleState, RuntimePipelineStageId } from "../types/stages";

export interface CreateRuntimeContextOptions {
  runtimeId: RuntimeId;
  correlationId?: CorrelationId;
  sessionId?: SessionId;
  signal?: AbortSignal;
  trigger?: RuntimePipelineTrigger;
  initialData?: Readonly<Record<string, unknown>>;
  lifecycle?: RuntimeLifecycleState;
}

export function createRuntimeContext(
  options: CreateRuntimeContextOptions
): RuntimeContext {
  const state: RuntimeExecutionState = {
    evidence: [],
    memory: [],
    twin: [],
    data: { ...(options.initialData ?? {}) },
  };

  const controller =
    options.signal === undefined ? new AbortController() : null;
  const signal = options.signal ?? controller!.signal;

  const ctx: RuntimeContext = {
    runtimeId: options.runtimeId,
    correlationId: options.correlationId ?? createCorrelationId(),
    sessionId: options.sessionId,
    signal,
    startedAt: new Date().toISOString(),
    lifecycle: options.lifecycle ?? "running",
    currentStageId: undefined,
    trigger: options.trigger,
    state,
    setIdentity(identity: RuntimeIdentity) {
      state.identity = identity;
    },
    setOrganizationalContext(context: RuntimeOrganizationalContext) {
      state.organizationalContext = context;
    },
    setIntent(intent: RuntimeIntent) {
      state.intent = intent;
    },
    setCognition(cognition: Readonly<Record<string, unknown>>) {
      state.cognition = cognition;
    },
    setExperience(experience: RuntimeExperience) {
      state.experience = experience;
    },
    setAction(action: RuntimeAction) {
      state.action = action;
    },
    setDomain(domain: Readonly<Record<string, unknown>>) {
      state.domain = domain;
    },
    addEvidence(refs: readonly RuntimeEvidenceReference[]) {
      state.evidence.push(...refs);
    },
    addMemory(refs: readonly RuntimeMemoryReference[]) {
      state.memory.push(...refs);
    },
    addTwin(refs: readonly RuntimeTwinReference[]) {
      state.twin.push(...refs);
    },
    throwIfCancelled() {
      if (signal.aborted) {
        throw new RuntimeCancellationError();
      }
    },
  };

  return ctx;
}

export function setCurrentStage(
  ctx: RuntimeContext,
  stageId: RuntimePipelineStageId | undefined
): void {
  (ctx as { currentStageId?: RuntimePipelineStageId }).currentStageId = stageId;
}
