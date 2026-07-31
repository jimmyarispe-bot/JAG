import { assertEntityTypeRegistered } from "@/lib/platform/entities/registry";
import type { EntityTimelineEntry } from "@/lib/platform/entities/types";

const activityStore: EntityTimelineEntry[] = [];
let activitySeq = 0;

export function resetEntityActivityForTests(): void {
  activityStore.length = 0;
  activitySeq = 0;
}

/** Record a generic activity event on any registered entity. */
export function recordEntityActivity(input: {
  entityType: string;
  entityId: string;
  eventType: string;
  title: string;
  summary?: string | null;
  actorUserId?: string | null;
  refId?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}): EntityTimelineEntry {
  assertEntityTypeRegistered(input.entityType);
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  activitySeq += 1;
  const entry: EntityTimelineEntry = {
    id: `ent-act:${activitySeq}:${occurredAt}`,
    entityType: input.entityType,
    entityId: input.entityId,
    source: "activity",
    eventType: input.eventType,
    title: input.title,
    summary: input.summary ?? null,
    occurredAt,
    actorUserId: input.actorUserId ?? null,
    refId: input.refId ?? null,
    metadata: { ...(input.metadata ?? {}) },
  };
  activityStore.unshift(entry);
  return { ...entry, metadata: { ...entry.metadata } };
}

export function listEntityActivity(
  entityType: string,
  entityId: string,
  limit = 100
): EntityTimelineEntry[] {
  return activityStore
    .filter((e) => e.entityType === entityType && e.entityId === entityId)
    .slice(0, limit)
    .map((e) => ({ ...e, metadata: { ...e.metadata } }));
}

export function listAllEntityActivity(limit = 200): EntityTimelineEntry[] {
  return activityStore
    .slice(0, limit)
    .map((e) => ({ ...e, metadata: { ...e.metadata } }));
}
