/**
 * Typed event publisher helpers.
 */

import type { IntegrationEventBus } from "@/lib/platform/integrations/events/bus";
import type {
  PlatformEvent,
  PlatformEventType,
} from "@/lib/platform/integrations/events/event-types";

export class EventPublisher {
  constructor(private readonly bus: IntegrationEventBus) {}

  publish(
    type: PlatformEventType,
    payload: Record<string, unknown>,
    meta: { connectorId?: string; instanceId?: string } = {}
  ): Promise<PlatformEvent> {
    return this.bus.publish({
      type,
      payload,
      connectorId: meta.connectorId,
      instanceId: meta.instanceId,
    });
  }

  syncCompleted(input: {
    connectorId: string;
    instanceId: string;
    recordsFetched: number;
    mode: string;
  }): Promise<PlatformEvent> {
    return this.publish(
      "SYNC_COMPLETED",
      {
        recordsFetched: input.recordsFetched,
        mode: input.mode,
      },
      { connectorId: input.connectorId, instanceId: input.instanceId }
    );
  }

  connectorFailed(input: {
    connectorId: string;
    instanceId: string;
    error: string;
  }): Promise<PlatformEvent> {
    return this.publish(
      "CONNECTOR_FAILED",
      { error: input.error },
      { connectorId: input.connectorId, instanceId: input.instanceId }
    );
  }
}

export function createEventPublisher(bus: IntegrationEventBus): EventPublisher {
  return new EventPublisher(bus);
}
