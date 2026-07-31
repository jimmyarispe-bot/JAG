/**
 * Merges evidence, connector, pipeline, and platform events into one timeline.
 */

import {
  listInstallationsForOrganization,
  listSyncEventsForJob,
  listSyncJobsForOrganization,
} from "@/lib/connectors";
import {
  listEvidenceForOrganization,
  listEventsForJob,
  listJobsForOrganization,
} from "@/lib/evidence-center";
import { listJagPlatformEvents } from "@/lib/jag-platform/events";
import type { ExecutiveTimelineItem } from "@/lib/executive-intelligence/types";

export function buildExecutiveTimeline(
  organizationId: string,
  limit = 50
): readonly ExecutiveTimelineItem[] {
  const items: ExecutiveTimelineItem[] = [];

  for (const doc of listEvidenceForOrganization(organizationId)) {
    for (const ev of doc.timeline) {
      items.push({
        id: `evidence-timeline:${ev.id}`,
        at: ev.at,
        source: "evidence",
        title: ev.label,
        detail: doc.name,
        entityType: "EvidenceDocument",
        entityId: doc.id,
      });
    }
  }

  for (const job of listJobsForOrganization(organizationId)) {
    for (const ev of listEventsForJob(organizationId, job.id)) {
      items.push({
        id: `pipeline:${ev.id}`,
        at: ev.at,
        source: "pipeline",
        title: ev.eventName,
        detail: ev.message || job.currentStage,
        entityType: "EvidenceProcessingJob",
        entityId: job.id,
      });
    }
  }

  for (const job of listSyncJobsForOrganization(organizationId)) {
    for (const ev of listSyncEventsForJob(organizationId, job.id)) {
      items.push({
        id: `connector-sync:${ev.id}`,
        at: ev.at,
        source: "connector",
        title: ev.eventName,
        detail: ev.message || job.connectorId,
        entityType: "ConnectorSyncJob",
        entityId: job.id,
      });
    }
  }

  for (const installation of listInstallationsForOrganization(organizationId)) {
    items.push({
      id: `connector-install:${installation.id}:${installation.updatedAt}`,
      at: installation.updatedAt,
      source: "connector",
      title: `Connector ${installation.status}`,
      detail: `${installation.connectorId}${installation.companyName ? ` · ${installation.companyName}` : ""}`,
      entityType: "ConnectorInstallation",
      entityId: installation.id,
    });
  }

  for (const ev of listJagPlatformEvents({ organizationId, limit: 100 })) {
    items.push({
      id: `platform:${ev.eventId}`,
      at: ev.timestamp,
      source: "platform",
      title: ev.eventType,
      detail: `${ev.sourceModule} · ${ev.entityType}`,
      entityType: ev.entityType,
      entityId: ev.entityId,
    });
  }

  items.sort((a, b) => b.at.localeCompare(a.at));
  return Object.freeze(items.slice(0, limit));
}
