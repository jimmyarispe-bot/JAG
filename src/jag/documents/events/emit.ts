import type {
  DocumentDefinitionId,
  DocumentEvent,
  DocumentEventType,
  DocumentInstanceId,
  DocumentVersionId,
} from "@/jag/documents/contracts/definitions";
import { nextDocumentOpaqueId } from "@/jag/documents/runtime/ids";

type Listener = (event: DocumentEvent) => void;

const listeners = new Set<Listener>();
const history: DocumentEvent[] = [];

export function subscribeDocumentEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitDocumentEvent(input: {
  type: DocumentEventType;
  instanceId: DocumentInstanceId;
  definitionId: DocumentDefinitionId;
  occurredAt: string;
  actorUserId?: string;
  versionId?: DocumentVersionId;
  data?: Readonly<Record<string, unknown>>;
}): DocumentEvent {
  const event: DocumentEvent = Object.freeze({
    id: nextDocumentOpaqueId("evt"),
    type: input.type,
    instanceId: input.instanceId,
    definitionId: input.definitionId,
    occurredAt: input.occurredAt,
    actorUserId: input.actorUserId,
    versionId: input.versionId,
    data: input.data ? Object.freeze({ ...input.data }) : undefined,
  });
  history.push(event);
  for (const listener of listeners) listener(event);
  return event;
}

export function listDocumentEvents(filter?: {
  instanceId?: string;
}): readonly DocumentEvent[] {
  if (!filter?.instanceId) return history;
  return history.filter((e) => e.instanceId === filter.instanceId);
}

export function resetDocumentEventsForTests(): void {
  listeners.clear();
  history.length = 0;
}
