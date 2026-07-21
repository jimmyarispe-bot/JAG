/**
 * Event dispatcher — fan-out with optional filtering and error isolation.
 */

import type { IntegrationEventBus } from "@/lib/platform/integrations/events/bus";
import type {
  PlatformEvent,
  PlatformEventHandler,
  PlatformEventType,
} from "@/lib/platform/integrations/events/event-types";

export type DispatcherOptions = {
  onHandlerError?: (error: unknown, event: PlatformEvent) => void;
};

export class EventDispatcher {
  private readonly routes = new Map<PlatformEventType | "*", Set<PlatformEventHandler>>();

  constructor(
    private readonly bus: IntegrationEventBus,
    private readonly options: DispatcherOptions = {}
  ) {
    this.bus.subscribe("*", (event) => this.dispatch(event));
  }

  route(type: PlatformEventType | "*", handler: PlatformEventHandler): () => void {
    const set = this.routes.get(type) ?? new Set();
    set.add(handler);
    this.routes.set(type, set);
    return () => set.delete(handler);
  }

  private async dispatch(event: PlatformEvent): Promise<void> {
    const targeted = this.routes.get(event.type) ?? new Set();
    const wildcard = this.routes.get("*") ?? new Set();
    await Promise.all(
      [...targeted, ...wildcard].map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          this.options.onHandlerError?.(error, event);
        }
      })
    );
  }
}

export function createEventDispatcher(
  bus: IntegrationEventBus,
  options?: DispatcherOptions
): EventDispatcher {
  return new EventDispatcher(bus, options);
}
