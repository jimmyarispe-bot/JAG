/**
 * Twin Timeline — organization-scoped chronological twin events.
 */

import { createTwinHistoryService } from "@/lib/digital-twin/history";
import { listTwinEntities } from "@/lib/digital-twin/store";
import type { TwinTimelineEntry } from "@/lib/digital-twin/types";
import { listJagPlatformEvents } from "@/lib/jag-platform/events";

export type TwinTimelineItem = {
  readonly id: string;
  readonly at: string;
  readonly kind: string;
  readonly title: string;
  readonly detail: string;
  readonly twinId: string | null;
  readonly source: "twin" | "platform";
};

export type TwinTimelineService = {
  list(organizationId: string, limit?: number): readonly TwinTimelineItem[];
  listForTwin(
    organizationId: string,
    twinId: string
  ): readonly TwinTimelineEntry[];
};

export function createTwinTimelineService(): TwinTimelineService {
  const history = createTwinHistoryService();

  return {
    list(organizationId, limit = 80) {
      const entities = new Map(
        listTwinEntities(organizationId).map((e) => [e.id, e])
      );
      const items: TwinTimelineItem[] = [];

      for (const e of history.list(organizationId)) {
        const twin = entities.get(e.twinId);
        items.push({
          id: `twin:${e.id}`,
          at: e.at,
          kind: e.kind,
          title: twin ? `${twin.entityType}: ${twin.label}` : e.kind,
          detail: e.message,
          twinId: e.twinId,
          source: "twin",
        });
      }

      for (const e of listJagPlatformEvents({
        organizationId,
        sourceModule: "digital-twin",
        limit: 40,
      })) {
        if (items.some((i) => i.id.includes(e.eventId))) continue;
        items.push({
          id: `platform:${e.eventId}`,
          at: e.timestamp,
          kind: e.eventType,
          title: e.eventType,
          detail: e.entityType,
          twinId: e.entityId,
          source: "platform",
        });
      }

      return Object.freeze(
        items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit)
      );
    },
    listForTwin(organizationId, twinId) {
      return history.list(organizationId, twinId);
    },
  };
}
