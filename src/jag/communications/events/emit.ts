import type {
  CommunicationDefinitionId,
  CommunicationEvent,
  CommunicationEventType,
  CommunicationMessageId,
} from "@/jag/communications/contracts/definitions";
import { nextCommunicationOpaqueId } from "@/jag/communications/runtime/ids";

type Listener = (event: CommunicationEvent) => void;
const listeners = new Set<Listener>();
const history: CommunicationEvent[] = [];

export function subscribeCommunicationEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitCommunicationEvent(input: {
  type: CommunicationEventType;
  messageId: CommunicationMessageId;
  definitionId: CommunicationDefinitionId;
  occurredAt: string;
  actorUserId?: string;
  data?: Readonly<Record<string, unknown>>;
}): CommunicationEvent {
  const event: CommunicationEvent = Object.freeze({
    id: nextCommunicationOpaqueId("evt"),
    type: input.type,
    messageId: input.messageId,
    definitionId: input.definitionId,
    occurredAt: input.occurredAt,
    actorUserId: input.actorUserId,
    data: input.data ? Object.freeze({ ...input.data }) : undefined,
  });
  history.push(event);
  for (const listener of listeners) listener(event);
  return event;
}

export function listCommunicationEvents(filter?: {
  messageId?: string;
}): readonly CommunicationEvent[] {
  if (!filter?.messageId) return history;
  return history.filter((e) => e.messageId === filter.messageId);
}

export function resetCommunicationEventsForTests(): void {
  listeners.clear();
  history.length = 0;
}
