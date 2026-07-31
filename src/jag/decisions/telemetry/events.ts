import type {
  DecisionEvent,
  DecisionEventType,
  DecisionId,
} from "@/jag/decisions/contracts/definitions";
import { nextDecisionOpaqueId } from "@/jag/decisions/runtime/ids";

type Listener = (event: DecisionEvent) => void;

const listeners = new Set<Listener>();
const history: DecisionEvent[] = [];

export function subscribeDecisionEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitDecisionEvent(input: {
  type: DecisionEventType;
  decisionId: DecisionId;
  occurredAt: string;
  organizationId?: string;
  actorUserId?: string;
  data?: Readonly<Record<string, unknown>>;
}): DecisionEvent {
  const event: DecisionEvent = Object.freeze({
    id: nextDecisionOpaqueId("evt"),
    type: input.type,
    decisionId: input.decisionId,
    occurredAt: input.occurredAt,
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    data: input.data ? Object.freeze({ ...input.data }) : undefined,
  });
  history.push(event);
  for (const listener of listeners) listener(event);
  return event;
}

export function listDecisionEvents(filter?: {
  decisionId?: string;
}): readonly DecisionEvent[] {
  if (!filter?.decisionId) return history;
  return history.filter((e) => e.decisionId === filter.decisionId);
}

export function resetDecisionEventsForTests(): void {
  listeners.clear();
  history.length = 0;
}
