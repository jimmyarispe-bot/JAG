/**
 * Event subscriber helpers.
 */

import type { IntegrationEventBus } from "@/lib/platform/integrations/events/bus";
import type {
  PlatformEventHandler,
  PlatformEventType,
} from "@/lib/platform/integrations/events/event-types";

export class EventSubscriber {
  constructor(private readonly bus: IntegrationEventBus) {}

  on(type: PlatformEventType | "*", handler: PlatformEventHandler): () => void {
    return this.bus.subscribe(type, handler);
  }

  onMany(
    types: readonly PlatformEventType[],
    handler: PlatformEventHandler
  ): () => void {
    const unsubs = types.map((type) => this.bus.subscribe(type, handler));
    return () => {
      for (const unsub of unsubs) unsub();
    };
  }
}

export function createEventSubscriber(bus: IntegrationEventBus): EventSubscriber {
  return new EventSubscriber(bus);
}
