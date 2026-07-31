/**
 * TwinHistory — lifecycle timeline for twin entities.
 */

import { randomUUID } from "node:crypto";
import { appendTwinTimeline, listTwinTimeline } from "@/lib/digital-twin/store";
import type {
  TwinTimelineEntry,
  TwinTimelineKind,
} from "@/lib/digital-twin/types";
import { emitJagPlatformEvent } from "@/lib/jag-platform/events";

export type TwinHistoryService = {
  record(input: {
    organizationId: string;
    twinId: string;
    kind: TwinTimelineKind;
    actor: string;
    message: string;
    metadata?: Record<string, string>;
  }): TwinTimelineEntry;
  list(organizationId: string, twinId?: string): readonly TwinTimelineEntry[];
};

export function createTwinHistoryService(): TwinHistoryService {
  return {
    record(input) {
      const entry: TwinTimelineEntry = {
        id: randomUUID(),
        organizationId: input.organizationId,
        twinId: input.twinId,
        kind: input.kind,
        at: new Date().toISOString(),
        actor: input.actor,
        message: input.message,
        metadata: Object.freeze({ ...(input.metadata ?? {}) }),
      };
      appendTwinTimeline(entry);
      emitJagPlatformEvent({
        organizationId: input.organizationId,
        sourceModule: "digital-twin",
        entityType: "TwinEntity",
        entityId: input.twinId,
        eventType: `twin.${input.kind}`,
        actor: input.actor,
        metadata: {
          kind: input.kind,
          ...(input.metadata ?? {}),
        },
      });
      return entry;
    },
    list(organizationId, twinId) {
      return listTwinTimeline(organizationId, twinId);
    },
  };
}
