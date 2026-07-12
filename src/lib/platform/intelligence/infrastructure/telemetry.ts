/**
 * Intelligence Platform Infrastructure — IntelligenceTelemetry (Sprint 027).
 */

import type {
  IntelligencePlatformClock,
  IntelligenceTelemetry as IntelligenceTelemetryContract,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import type {
  IntelligenceModuleId,
  IntelligencePlatformEvent,
  IntelligencePlatformEventKind,
  IntelligencePlatformMetadata,
} from "@/lib/platform/intelligence/infrastructure/types";
import { createDefaultClock } from "@/lib/platform/intelligence/infrastructure/clock";

type Listener = (event: IntelligencePlatformEvent) => void;

export class IntelligenceTelemetryImpl implements IntelligenceTelemetryContract {
  private readonly events: IntelligencePlatformEvent[] = [];
  private readonly listeners = new Map<Listener, Set<IntelligencePlatformEventKind> | null>();
  private readonly clock: IntelligencePlatformClock;
  private readonly maxEvents: number;

  constructor(
    clock: IntelligencePlatformClock = createDefaultClock(),
    maxEvents = 500
  ) {
    this.clock = clock;
    this.maxEvents = maxEvents;
  }

  emit(
    kind: IntelligencePlatformEventKind,
    options: {
      moduleId?: IntelligenceModuleId;
      runId?: string;
      payload?: IntelligencePlatformMetadata;
    } = {}
  ): IntelligencePlatformEvent {
    const event: IntelligencePlatformEvent = {
      eventId: this.clock.createId("evt"),
      kind,
      occurredAt: this.clock.now().toISOString(),
      moduleId: options.moduleId,
      runId: options.runId,
      payload: options.payload,
    };
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents);
    }
    for (const [listener, filter] of this.listeners.entries()) {
      if (!filter || filter.has(kind)) {
        listener(event);
      }
    }
    return event;
  }

  subscribe(
    listener: Listener,
    filter?: IntelligencePlatformEventKind | IntelligencePlatformEventKind[]
  ): () => void {
    const set =
      filter === undefined
        ? null
        : new Set(Array.isArray(filter) ? filter : [filter]);
    this.listeners.set(listener, set);
    return () => {
      this.listeners.delete(listener);
    };
  }

  recent(limit = 50): IntelligencePlatformEvent[] {
    return this.events.slice(-Math.max(1, limit));
  }

  clear(): void {
    this.events.length = 0;
  }
}

/** Alias matching Sprint 027 naming. */
export { IntelligenceTelemetryImpl as IntelligenceTelemetry };

export function createIntelligenceTelemetry(
  clock?: IntelligencePlatformClock
): IntelligenceTelemetryImpl {
  return new IntelligenceTelemetryImpl(clock);
}
