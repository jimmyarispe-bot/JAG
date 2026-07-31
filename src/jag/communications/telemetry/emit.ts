import type { CommunicationMessageId } from "@/jag/communications/contracts/definitions";

export type CommunicationTelemetryEvent = {
  readonly kind:
    | "create"
    | "render"
    | "route"
    | "schedule"
    | "dispatch"
    | "retry"
    | "cancel"
    | "complete";
  readonly messageId: CommunicationMessageId;
  readonly definitionId: string;
  readonly at: string;
};

type Listener = (event: CommunicationTelemetryEvent) => void;
const listeners = new Set<Listener>();

export function subscribeCommunicationTelemetry(
  listener: Listener
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function trackCommunicationTelemetry(
  event: CommunicationTelemetryEvent
): void {
  for (const listener of listeners) listener(event);
}

export function resetCommunicationTelemetryForTests(): void {
  listeners.clear();
}
