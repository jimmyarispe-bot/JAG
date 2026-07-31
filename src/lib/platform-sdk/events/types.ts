/** Event SDK — standardized platform event contracts. */

export type PlatformEvent = {
  readonly eventId: string;
  readonly organizationId: string;
  readonly sourceModule: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly eventType: string;
  readonly actor: string;
  readonly timestamp: string;
  readonly correlationId: string;
  readonly metadata: Readonly<Record<string, string>>;
};

export type EventEnvelope<TPayload = Readonly<Record<string, string>>> = {
  readonly event: PlatformEvent;
  readonly payload: TPayload;
  readonly schemaVersion: string;
};

export interface EventPublisher {
  publish(event: PlatformEvent): void;
  publishEnvelope<T>(envelope: EventEnvelope<T>): void;
}

export interface EventSubscriber {
  readonly id: string;
  readonly eventTypes: readonly string[];
  onEvent(event: PlatformEvent): void | Promise<void>;
}

export interface EventHandler {
  readonly id: string;
  readonly eventType: string;
  handle(envelope: EventEnvelope): void | Promise<void>;
}
