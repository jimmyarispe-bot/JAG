/**
 * DecisionHistory — decision timeline + merged executive event view.
 */

import { listDecisionTimeline } from "@/lib/executive-intelligence/decisions/store";
import type {
  DecisionTimelineEntry,
  MergedDecisionTimelineItem,
} from "@/lib/executive-intelligence/decisions/types";
import { listJagPlatformEvents } from "@/lib/jag-platform/events";
import { createInsightHistoryService } from "@/lib/executive-intelligence/insights/history-service";
import { listEvidenceForOrganization } from "@/lib/evidence-center";
import { listInstallationsForOrganization } from "@/lib/connectors";

export type DecisionHistoryService = {
  listDecisionEvents(
    organizationId: string,
    decisionId?: string
  ): readonly DecisionTimelineEntry[];
  listMergedTimeline(
    organizationId: string,
    limit?: number
  ): readonly MergedDecisionTimelineItem[];
  listAuditEvents(organizationId: string, decisionId?: string): readonly {
    readonly eventId: string;
    readonly eventType: string;
    readonly entityId: string;
    readonly timestamp: string;
    readonly metadata: Readonly<Record<string, string>>;
  }[];
};

export function createDecisionHistoryService(): DecisionHistoryService {
  return {
    listDecisionEvents(organizationId, decisionId) {
      return listDecisionTimeline(organizationId, decisionId);
    },

    listMergedTimeline(organizationId, limit = 80) {
      const items: MergedDecisionTimelineItem[] = [];

      for (const e of listDecisionTimeline(organizationId)) {
        items.push({
          id: `decision:${e.id}`,
          at: e.at,
          source: "decision",
          title: e.kind.replace(/_/g, " "),
          detail: e.message,
          entityId: e.decisionId,
        });
      }

      for (const e of createInsightHistoryService().listTimeline(
        organizationId
      )) {
        items.push({
          id: `insight:${e.id}`,
          at: e.at,
          source: "insight",
          title: `Insight ${e.kind.replace(/_/g, " ")}`,
          detail: e.message,
          entityId: e.insightId,
        });
      }

      for (const e of listJagPlatformEvents({
        organizationId,
        sourceModule: "connectors",
        limit: 40,
      })) {
        items.push({
          id: `connector:${e.eventId}`,
          at: e.timestamp,
          source: "connector",
          title: e.eventType,
          detail: e.entityType,
          entityId: e.entityId,
        });
      }

      for (const e of listJagPlatformEvents({
        organizationId,
        sourceModule: "quickbooks",
        limit: 20,
      })) {
        items.push({
          id: `qbo:${e.eventId}`,
          at: e.timestamp,
          source: "connector",
          title: e.eventType,
          detail: e.entityType,
          entityId: e.entityId,
        });
      }

      for (const doc of listEvidenceForOrganization(organizationId).slice(
        0,
        20
      )) {
        const last = doc.timeline[doc.timeline.length - 1];
        if (!last) continue;
        items.push({
          id: `evidence:${doc.id}:${last.at}`,
          at: last.at,
          source: "evidence",
          title: last.kind,
          detail: doc.name,
          entityId: doc.id,
        });
      }

      // Ensure connector installations appear if no connector events yet
      void listInstallationsForOrganization(organizationId);

      return Object.freeze(
        items
          .sort((a, b) => b.at.localeCompare(a.at))
          .slice(0, limit)
      );
    },

    listAuditEvents(organizationId, decisionId) {
      return listJagPlatformEvents({
        organizationId,
        sourceModule: "decisions",
        limit: 200,
      })
        .filter((e) => !decisionId || e.entityId === decisionId)
        .map((e) => ({
          eventId: e.eventId,
          eventType: e.eventType,
          entityId: e.entityId,
          timestamp: e.timestamp,
          metadata: e.metadata,
        }));
    },
  };
}
