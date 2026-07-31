import {
  listInsightTimelineForInsight,
  listInsightTimelineForOrganization,
} from "@/lib/executive-intelligence/insights/store";
import type { InsightTimelineEntry } from "@/lib/executive-intelligence/insights/types";
import { listJagPlatformEvents } from "@/lib/jag-platform/events";

export type InsightHistoryService = {
  listTimeline(organizationId: string): readonly InsightTimelineEntry[];
  listTimelineForInsight(
    organizationId: string,
    insightId: string
  ): readonly InsightTimelineEntry[];
  listPlatformEvents(organizationId: string, limit?: number): readonly {
    readonly eventId: string;
    readonly eventType: string;
    readonly entityId: string;
    readonly timestamp: string;
    readonly metadata: Readonly<Record<string, string>>;
  }[];
};

export function createInsightHistoryService(): InsightHistoryService {
  return {
    listTimeline(organizationId) {
      return listInsightTimelineForOrganization(organizationId);
    },
    listTimelineForInsight(organizationId, insightId) {
      return listInsightTimelineForInsight(organizationId, insightId);
    },
    listPlatformEvents(organizationId, limit = 100) {
      return listJagPlatformEvents({
        organizationId,
        sourceModule: "executive-intelligence",
        limit,
      }).map((e) => ({
        eventId: e.eventId,
        eventType: e.eventType,
        entityId: e.entityId,
        timestamp: e.timestamp,
        metadata: e.metadata,
      }));
    },
  };
}

export function getInsightHistory(
  organizationId: string
): ReturnType<InsightHistoryService["listTimeline"]> {
  return createInsightHistoryService().listTimeline(organizationId);
}
