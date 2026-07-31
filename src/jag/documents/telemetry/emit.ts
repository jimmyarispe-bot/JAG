import type { DocumentInstanceId } from "@/jag/documents/contracts/definitions";

export type DocumentTelemetryEvent =
  | {
      readonly kind: "create" | "update" | "version" | "archive" | "restore" | "access" | "permission_change";
      readonly instanceId: DocumentInstanceId;
      readonly definitionId: string;
      readonly at: string;
    };

type Listener = (event: DocumentTelemetryEvent) => void;
const listeners = new Set<Listener>();

export function subscribeDocumentTelemetry(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function trackDocumentTelemetry(
  event: DocumentTelemetryEvent
): void {
  for (const listener of listeners) listener(event);
}

export function resetDocumentTelemetryForTests(): void {
  listeners.clear();
}
