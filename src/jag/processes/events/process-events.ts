import type {
  ProcessEvent,
  ProcessEventType,
  ProcessInstanceId,
  StageId,
} from "@/jag/processes/contracts/definitions";
import { nextProcessOpaqueId } from "@/jag/processes/runtime/ids";

type EventListener = (event: ProcessEvent) => void;

const listeners = new Set<EventListener>();
const history = new Map<ProcessInstanceId, ProcessEvent[]>();

export function subscribeProcessEvents(listener: EventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitProcessEvent(input: {
  instanceId: ProcessInstanceId;
  type: ProcessEventType;
  occurredAt: string;
  actorUserId?: string;
  stageId?: StageId;
  transitionId?: string;
  data?: Readonly<Record<string, unknown>>;
}): ProcessEvent {
  const event: ProcessEvent = Object.freeze({
    id: nextProcessOpaqueId("evt"),
    instanceId: input.instanceId,
    type: input.type,
    occurredAt: input.occurredAt,
    actorUserId: input.actorUserId,
    stageId: input.stageId,
    transitionId: input.transitionId,
    data: input.data ? Object.freeze({ ...input.data }) : undefined,
  });

  const list = history.get(input.instanceId) ?? [];
  list.push(event);
  history.set(input.instanceId, list);

  for (const listener of listeners) {
    listener(event);
  }
  return event;
}

export function listProcessEvents(
  instanceId: ProcessInstanceId
): readonly ProcessEvent[] {
  return history.get(instanceId) ?? [];
}

export function resetProcessEventsForTests(): void {
  listeners.clear();
  history.clear();
}
