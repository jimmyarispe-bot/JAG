/**
 * Intelligence Platform Infrastructure — IntelligenceEvents (Sprint 027).
 *
 * Thin façade over telemetry for event-oriented consumers.
 * Distinct from foundation `IntelligenceEventService` (cognitive pipeline events).
 */

import type {
  IntelligenceEvents as IntelligenceEventsContract,
  IntelligenceTelemetry,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import type {
  IntelligenceModuleId,
  IntelligencePlatformEvent,
  IntelligencePlatformEventKind,
  IntelligencePlatformMetadata,
} from "@/lib/platform/intelligence/infrastructure/types";
import { createIntelligenceTelemetry } from "@/lib/platform/intelligence/infrastructure/telemetry";

export class IntelligenceEventsImpl implements IntelligenceEventsContract {
  private readonly telemetry: IntelligenceTelemetry;

  constructor(telemetry: IntelligenceTelemetry = createIntelligenceTelemetry()) {
    this.telemetry = telemetry;
  }

  emit(
    kind: IntelligencePlatformEventKind,
    options?: {
      moduleId?: IntelligenceModuleId;
      runId?: string;
      payload?: IntelligencePlatformMetadata;
    }
  ): IntelligencePlatformEvent {
    return this.telemetry.emit(kind, options);
  }

  on(
    listener: (event: IntelligencePlatformEvent) => void,
    filter?: IntelligencePlatformEventKind | IntelligencePlatformEventKind[]
  ): () => void {
    return this.telemetry.subscribe(listener, filter);
  }

  recent(limit?: number): IntelligencePlatformEvent[] {
    return this.telemetry.recent(limit);
  }
}

/** Alias matching Sprint 027 naming. */
export { IntelligenceEventsImpl as IntelligenceEvents };

export function createIntelligenceEvents(
  telemetry?: IntelligenceTelemetry
): IntelligenceEventsImpl {
  return new IntelligenceEventsImpl(telemetry);
}
