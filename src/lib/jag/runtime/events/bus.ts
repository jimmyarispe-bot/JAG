import type {
  RuntimeEvent,
  RuntimeEventHandler,
  RuntimeEventMiddleware,
  RuntimeEventSubscription,
} from "../contracts/event";
import { createEventId } from "../types/ids";

export interface RuntimeEventBusOptions {
  /** Default schema version stamped on published events. */
  schemaVersion?: number;
}

export interface PublishOptions {
  correlationId?: string;
  sessionId?: string;
  organizationId?: string;
  actorUserId?: string;
  effectiveUserId?: string;
  schemaVersion?: number;
  occurredAt?: string;
}

export class RuntimeEventBus {
  private readonly subscriptions = new Map<string, RuntimeEventSubscription>();
  private readonly middleware: RuntimeEventMiddleware[] = [];
  private readonly schemaVersion: number;
  private subSeq = 0;

  constructor(options: RuntimeEventBusOptions = {}) {
    this.schemaVersion = options.schemaVersion ?? 1;
  }

  use(middleware: RuntimeEventMiddleware): () => void {
    this.middleware.push(middleware);
    return () => {
      const idx = this.middleware.indexOf(middleware);
      if (idx >= 0) this.middleware.splice(idx, 1);
    };
  }

  subscribe<TPayload = unknown>(
    eventType: string | "*",
    handler: RuntimeEventHandler<TPayload>,
    options: { priority?: number } = {}
  ): () => void {
    const id = `sub_${++this.subSeq}`;
    const subscription: RuntimeEventSubscription = {
      id,
      eventType,
      priority: options.priority ?? 0,
      handler: handler as RuntimeEventHandler,
    };
    this.subscriptions.set(id, subscription);
    return () => this.unsubscribe(id);
  }

  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  async publish<TPayload = unknown>(
    eventType: string,
    payload: TPayload,
    options: PublishOptions = {}
  ): Promise<RuntimeEvent<TPayload>> {
    const event: RuntimeEvent<TPayload> = {
      eventId: createEventId(),
      eventType,
      occurredAt: options.occurredAt ?? new Date().toISOString(),
      correlationId: options.correlationId,
      sessionId: options.sessionId,
      organizationId: options.organizationId,
      actorUserId: options.actorUserId,
      effectiveUserId: options.effectiveUserId,
      schemaVersion: options.schemaVersion ?? this.schemaVersion,
      payload,
    };

    await this.dispatch(event as RuntimeEvent);
    return event;
  }

  /** Publish a fully-formed event envelope. */
  async publishEvent(event: RuntimeEvent): Promise<void> {
    await this.dispatch(event);
  }

  clear(): void {
    this.subscriptions.clear();
    this.middleware.length = 0;
  }

  listenerCount(eventType?: string): number {
    if (!eventType) return this.subscriptions.size;
    let count = 0;
    for (const sub of this.subscriptions.values()) {
      if (sub.eventType === "*" || sub.eventType === eventType) count += 1;
    }
    return count;
  }

  private async dispatch(event: RuntimeEvent): Promise<void> {
    const chain = this.middleware.reduceRight<(e: RuntimeEvent) => Promise<void>>(
      (next, mw) => async (e) => mw(e, next),
      async (e) => this.deliver(e)
    );
    await chain(event);
  }

  private async deliver(event: RuntimeEvent): Promise<void> {
    const handlers = [...this.subscriptions.values()]
      .filter(
        (sub) => sub.eventType === "*" || sub.eventType === event.eventType
      )
      .sort((a, b) => b.priority - a.priority);

    for (const sub of handlers) {
      await sub.handler(event);
    }
  }
}

export function createRuntimeEventBus(
  options?: RuntimeEventBusOptions
): RuntimeEventBus {
  return new RuntimeEventBus(options);
}
