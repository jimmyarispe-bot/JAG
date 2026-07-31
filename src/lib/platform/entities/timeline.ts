import { listEntityActivity } from "@/lib/platform/entities/activity";
import { listEntityDocuments } from "@/lib/platform/entities/documents";
import { listEntityNotes } from "@/lib/platform/entities/notes";
import {
  assertEntityTypeRegistered,
  entityHasCapability,
} from "@/lib/platform/entities/registry";
import type { EntityTimelineEntry } from "@/lib/platform/entities/types";
import {
  AutomationRepository,
  DecisionRepository,
  NotificationRepository,
} from "@/lib/platform/persistence";

/**
 * Universal timeline — applications do not implement separate timelines.
 * Aggregates framework activity with decisions, notifications, automation,
 * notes, documents, and forecast references when present in metadata.
 */
export function getEntityTimeline(input: {
  entityType: string;
  entityId: string;
  limit?: number;
}): EntityTimelineEntry[] {
  assertEntityTypeRegistered(input.entityType);
  if (!entityHasCapability(input.entityType, "timeline")) {
    throw new Error(
      `Entity type "${input.entityType}" does not enable timeline`
    );
  }

  const limit = input.limit ?? 100;
  const entries: EntityTimelineEntry[] = [];

  for (const a of listEntityActivity(input.entityType, input.entityId, limit)) {
    const source =
      a.metadata.forecastDomain != null
        ? ("forecast" as const)
        : a.metadata.intelligenceRef != null
          ? ("intelligence" as const)
          : a.source;
    entries.push({ ...a, source });
  }

  // Decisions / notifications / automation — match by metadata entity refs or id equality.
  for (const d of DecisionRepository.list()) {
    const metaType = d.mergeKey.includes(`:${input.entityType}:`) ||
      d.signalIds.some((s) => s.includes(input.entityId));
    const matches =
      d.id === input.entityId ||
      metaType ||
      (typeof d.sourceRecommendationId === "string" &&
        d.sourceRecommendationId.includes(input.entityId));
    if (!matches) continue;
    for (const h of d.history) {
      entries.push({
        id: `tl-decision:${d.id}:${h.id}`,
        entityType: input.entityType,
        entityId: input.entityId,
        source: "decision",
        eventType: h.action,
        title: d.title,
        summary: h.reason,
        occurredAt: h.timestamp,
        actorUserId: h.actorUserId,
        refId: d.id,
        metadata: { decisionStatus: d.status, priority: d.priority },
      });
    }
  }

  for (const n of NotificationRepository.listAll()) {
    if (n.decisionId !== input.entityId && n.recipientId !== input.entityId) {
      // Also allow explicit metadata linkage via title/body entity id token
      if (!n.body.includes(input.entityId) && !n.title.includes(input.entityId)) {
        continue;
      }
    }
    entries.push({
      id: `tl-notif:${n.id}`,
      entityType: input.entityType,
      entityId: input.entityId,
      source: "notification",
      eventType: n.type,
      title: n.title,
      summary: n.body,
      occurredAt: n.createdAt,
      actorUserId: null,
      refId: n.id,
      metadata: { status: n.status, channel: n.channel },
    });
  }

  for (const run of AutomationRepository.listRuns(100)) {
    const related =
      run.decisionsCreated.includes(input.entityId) ||
      run.subjectKey === input.entityId ||
      run.actionsExecuted.some((a) => a.includes(input.entityId));
    if (!related) continue;
    entries.push({
      id: `tl-auto:${run.id}`,
      entityType: input.entityType,
      entityId: input.entityId,
      source: "automation",
      eventType: run.status,
      title: run.ruleName,
      summary: run.error ?? run.skippedReason,
      occurredAt: run.finishedAt,
      actorUserId: null,
      refId: run.id,
      metadata: { trigger: run.trigger, ruleId: run.ruleId },
    });
  }

  for (const note of listEntityNotes(input.entityType, input.entityId)) {
    entries.push({
      id: `tl-note:${note.id}`,
      entityType: input.entityType,
      entityId: input.entityId,
      source: "note",
      eventType: "note.created",
      title: "Note added",
      summary: note.body.slice(0, 160),
      occurredAt: note.createdAt,
      actorUserId: note.authorUserId,
      refId: note.id,
      metadata: { pinned: note.pinned },
    });
  }

  for (const doc of listEntityDocuments(input.entityType, input.entityId)) {
    entries.push({
      id: `tl-doc:${doc.id}:v${doc.version}`,
      entityType: input.entityType,
      entityId: input.entityId,
      source: "document",
      eventType: "document.attached",
      title: doc.title,
      summary: `version ${doc.version}`,
      occurredAt: doc.updatedAt,
      actorUserId: doc.ownerUserId,
      refId: doc.id,
      metadata: { version: doc.version, mimeType: doc.mimeType },
    });
  }

  return entries
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, limit)
    .map((e) => ({ ...e, metadata: { ...e.metadata } }));
}
