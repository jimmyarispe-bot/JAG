/**
 * Internal event bus — publish/subscribe without coupling producers to consumers.
 */

import type {
  PlatformEvent,
  PlatformEventHandler,
  PlatformEventType,
} from "@/lib/platform/integrations/events/event-types";

export class IntegrationEventBus {
  private readonly handlers = new Map<PlatformEventType | "*", Set<PlatformEventHandler>>();
  private readonly history: PlatformEvent[] = [];
  private seq = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  subscribe(type: PlatformEventType | "*", handler: PlatformEventHandler): () => void {
    const set = this.handlers.get(type) ?? new Set();
    set.add(handler);
    this.handlers.set(type, set);
    return () => set.delete(handler);
  }

  async publish(
    partial: Omit<PlatformEvent, "id" | "occurredAt"> & {
      id?: string;
      occurredAt?: string;
    }
  ): Promise<PlatformEvent> {
    const event: PlatformEvent = {
      id: partial.id ?? `pevt-${++this.seq}-${this.now().getTime().toString(36)}`,
      type: partial.type,
      connectorId: partial.connectorId,
      instanceId: partial.instanceId,
      payload: partial.payload,
      occurredAt: partial.occurredAt ?? this.now().toISOString(),
    };

    this.history.unshift(event);
    if (this.history.length > 1_000) this.history.length = 1_000;

    const targeted = this.handlers.get(event.type) ?? new Set();
    const wildcard = this.handlers.get("*") ?? new Set();
    await Promise.all([...targeted, ...wildcard].map((handler) => handler(event)));
    return event;
  }

  list(limit = 50, type?: PlatformEventType): PlatformEvent[] {
    const rows = type ? this.history.filter((event) => event.type === type) : this.history;
    return rows.slice(0, limit);
  }

  clear(): void {
    this.history.length = 0;
  }
}

export function createEventBus(now?: () => Date): IntegrationEventBus {
  return new IntegrationEventBus(now);
}
