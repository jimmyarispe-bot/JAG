import type {
  ProcessInstanceId,
  ProcessMetrics,
  StageId,
} from "@/jag/processes/contracts/definitions";

export type ProcessTelemetryEvent =
  | {
      readonly kind: "start";
      readonly instanceId: ProcessInstanceId;
      readonly definitionId: string;
      readonly at: string;
    }
  | {
      readonly kind: "stage_change";
      readonly instanceId: ProcessInstanceId;
      readonly fromStageId: StageId;
      readonly toStageId: StageId;
      readonly at: string;
    }
  | {
      readonly kind: "participant_action";
      readonly instanceId: ProcessInstanceId;
      readonly actorUserId: string;
      readonly action: string;
      readonly at: string;
    }
  | {
      readonly kind: "completion";
      readonly instanceId: ProcessInstanceId;
      readonly at: string;
      readonly durationMs: number;
    }
  | {
      readonly kind: "cancellation";
      readonly instanceId: ProcessInstanceId;
      readonly at: string;
      readonly durationMs: number;
    }
  | {
      readonly kind: "duration";
      readonly instanceId: ProcessInstanceId;
      readonly stageId?: StageId;
      readonly durationMs: number;
      readonly at: string;
    };

type TelemetryListener = (event: ProcessTelemetryEvent) => void;

const listeners = new Set<TelemetryListener>();
const metrics = new Map<ProcessInstanceId, MutableMetrics>();

type MutableMetrics = {
  instanceId: ProcessInstanceId;
  definitionId: string;
  startedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  stageEnteredAt: Map<StageId, string>;
  stageDurations: Array<{ stageId: StageId; durationMs: number }>;
  transitionCount: number;
  participantActionCount: number;
};

export function subscribeProcessTelemetry(
  listener: TelemetryListener
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(event: ProcessTelemetryEvent): void {
  for (const listener of listeners) {
    listener(event);
  }
}

export function trackProcessStart(input: {
  instanceId: ProcessInstanceId;
  definitionId: string;
  at: string;
}): void {
  metrics.set(input.instanceId, {
    instanceId: input.instanceId,
    definitionId: input.definitionId,
    startedAt: input.at,
    stageEnteredAt: new Map(),
    stageDurations: [],
    transitionCount: 0,
    participantActionCount: 0,
  });
  emit({
    kind: "start",
    instanceId: input.instanceId,
    definitionId: input.definitionId,
    at: input.at,
  });
}

export function trackStageChange(input: {
  instanceId: ProcessInstanceId;
  fromStageId: StageId;
  toStageId: StageId;
  at: string;
}): void {
  const m = metrics.get(input.instanceId);
  if (m) {
    const entered = m.stageEnteredAt.get(input.fromStageId);
    if (entered) {
      const durationMs = Date.parse(input.at) - Date.parse(entered);
      m.stageDurations.push({
        stageId: input.fromStageId,
        durationMs: Number.isFinite(durationMs) ? durationMs : 0,
      });
      emit({
        kind: "duration",
        instanceId: input.instanceId,
        stageId: input.fromStageId,
        durationMs: Number.isFinite(durationMs) ? durationMs : 0,
        at: input.at,
      });
    }
    m.stageEnteredAt.set(input.toStageId, input.at);
    m.transitionCount += 1;
  }
  emit({
    kind: "stage_change",
    instanceId: input.instanceId,
    fromStageId: input.fromStageId,
    toStageId: input.toStageId,
    at: input.at,
  });
}

export function trackParticipantAction(input: {
  instanceId: ProcessInstanceId;
  actorUserId: string;
  action: string;
  at: string;
}): void {
  const m = metrics.get(input.instanceId);
  if (m) m.participantActionCount += 1;
  emit({
    kind: "participant_action",
    instanceId: input.instanceId,
    actorUserId: input.actorUserId,
    action: input.action,
    at: input.at,
  });
}

export function trackProcessCompletion(input: {
  instanceId: ProcessInstanceId;
  at: string;
}): void {
  const m = metrics.get(input.instanceId);
  const durationMs = m
    ? Date.parse(input.at) - Date.parse(m.startedAt)
    : 0;
  if (m) m.completedAt = input.at;
  emit({
    kind: "completion",
    instanceId: input.instanceId,
    at: input.at,
    durationMs: Number.isFinite(durationMs) ? durationMs : 0,
  });
}

export function trackProcessCancellation(input: {
  instanceId: ProcessInstanceId;
  at: string;
}): void {
  const m = metrics.get(input.instanceId);
  const durationMs = m
    ? Date.parse(input.at) - Date.parse(m.startedAt)
    : 0;
  if (m) m.cancelledAt = input.at;
  emit({
    kind: "cancellation",
    instanceId: input.instanceId,
    at: input.at,
    durationMs: Number.isFinite(durationMs) ? durationMs : 0,
  });
}

export function getProcessMetrics(
  instanceId: ProcessInstanceId
): ProcessMetrics | null {
  const m = metrics.get(instanceId);
  if (!m) return null;
  const end = m.completedAt ?? m.cancelledAt;
  return {
    instanceId: m.instanceId,
    definitionId: m.definitionId,
    startedAt: m.startedAt,
    completedAt: m.completedAt,
    cancelledAt: m.cancelledAt,
    durationMs: end
      ? Date.parse(end) - Date.parse(m.startedAt)
      : undefined,
    stageDurations: [...m.stageDurations],
    transitionCount: m.transitionCount,
    participantActionCount: m.participantActionCount,
  };
}

export function resetProcessTelemetryForTests(): void {
  listeners.clear();
  metrics.clear();
}
