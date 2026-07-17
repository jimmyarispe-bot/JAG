/**
 * Integration event bus — fan-out for sync / connector lifecycle events.
 * Downstream intelligence adapters subscribe later; this bus does not call intelligence packages.
 */

import type { IntegrationEvent, IntegrationEventType } from "@/lib/platform/integrations/common/types";

export type IntegrationEventHandler = (event: IntegrationEvent) => void | Promise<void>;

export class IntegrationEventBus {
  private readonly handlers = new Map<IntegrationEventType | "*", Set<IntegrationEventHandler>>();
  private readonly history: IntegrationEvent[] = [];

  subscribe(type: IntegrationEventType | "*", handler: IntegrationEventHandler): () => void {
    const set = this.handlers.get(type) ?? new Set();
    set.add(handler);
    this.handlers.set(type, set);
    return () => set.delete(handler);
  }

  async publish(
    partial: Omit<IntegrationEvent, "id" | "occurredAt"> & { id?: string; occurredAt?: string }
  ): Promise<IntegrationEvent> {
    const event: IntegrationEvent = {
      id: partial.id ?? `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      type: partial.type,
      instanceId: partial.instanceId,
      connectorId: partial.connectorId,
      scope: partial.scope,
      payload: partial.payload,
      occurredAt: partial.occurredAt ?? new Date().toISOString(),
    };

    this.history.unshift(event);
    if (this.history.length > 500) this.history.length = 500;

    const targeted = this.handlers.get(event.type) ?? new Set();
    const wildcard = this.handlers.get("*") ?? new Set();
    await Promise.all(
      [...targeted, ...wildcard].map(async (handler) => {
        await handler(event);
      })
    );

    return event;
  }

  list(limit = 50, type?: IntegrationEventType): IntegrationEvent[] {
    const rows = type ? this.history.filter((e) => e.type === type) : this.history;
    return rows.slice(0, limit);
  }
}

export function createIntegrationEvent(
  type: IntegrationEventType,
  payload: Record<string, unknown>,
  meta: Partial<Pick<IntegrationEvent, "instanceId" | "connectorId" | "scope">> = {}
): Omit<IntegrationEvent, "id" | "occurredAt"> {
  return { type, payload, ...meta };
}
