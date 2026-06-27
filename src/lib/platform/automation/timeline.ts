import { recordActivity } from "@/lib/platform/activity";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { PlatformModule, TimelineEventType } from "@/lib/platform/automation/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface WriteTimelineEventInput {
  schoolId?: string | null;
  module: PlatformModule;
  entityType: string;
  entityId: string;
  eventType: TimelineEventType | string;
  title: string;
  body?: string;
  actorUserId?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
  organizationId?: string | null;
  studentId?: string | null;
  familyId?: string | null;
}

/**
 * Legacy timeline writer — delegates to Global Activity Engine.
 * Dual-writes to platform_timeline_events via recordActivity for backward compatibility.
 */
export async function writeTimelineEvent(
  supabase: AuthClient,
  input: WriteTimelineEventInput
) {
  await recordActivity(supabase, {
    eventType: input.eventType,
    moduleKey: input.module,
    entityType: input.entityType,
    entityId: input.entityId,
    title: input.title,
    body: input.body,
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    studentId: input.studentId,
    familyId: input.familyId,
    actorUserId: input.actorUserId,
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: input.relatedEntityId,
    payload: input.metadata,
    occurredAt: input.occurredAt,
  });
}

export async function getEntityTimeline(
  supabase: AuthClient,
  module: PlatformModule,
  entityType: string,
  entityId: string,
  searchQuery?: string
) {
  const { getEntityActivity } = await import("@/lib/platform/activity/query");
  const events = await getEntityActivity(supabase, entityType, entityId, { limit: 100 });

  let filtered = events.filter((e) => e.module_key === module);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q) ||
        e.event_type.toLowerCase().includes(q)
    );
  }

  return filtered.map((e) => ({
    id: e.id,
    school_id: e.school_id,
    module: e.module_key,
    entity_type: e.entity_type,
    entity_id: e.entity_id,
    event_type: e.event_type,
    title: e.title,
    body: e.body,
    actor_user_id: e.actor_user_id,
    related_entity_type: e.related_entity_type,
    related_entity_id: e.related_entity_id,
    metadata: e.payload,
    occurred_at: e.occurred_at,
    created_at: e.created_at,
  }));
}

export async function searchTimelines(
  supabase: AuthClient,
  filters: {
    module?: PlatformModule;
    schoolId?: string;
    query?: string;
    limit?: number;
  }
) {
  const { getActivityFeed } = await import("@/lib/platform/activity/query");
  const events = await getActivityFeed(supabase, {
    moduleKey: filters.module,
    limit: filters.limit ?? 100,
  });

  let results = events;
  if (filters.schoolId) {
    results = results.filter((e) => e.school_id === filters.schoolId);
  }
  if (filters.query) {
    const needle = filters.query.toLowerCase();
    results = results.filter(
      (e) =>
        e.title.toLowerCase().includes(needle) ||
        e.body.toLowerCase().includes(needle)
    );
  }

  return results.map((e) => ({
    id: e.id,
    school_id: e.school_id,
    module: e.module_key,
    entity_type: e.entity_type,
    entity_id: e.entity_id,
    event_type: e.event_type,
    title: e.title,
    body: e.body,
    actor_user_id: e.actor_user_id,
    related_entity_type: e.related_entity_type,
    related_entity_id: e.related_entity_id,
    metadata: e.payload,
    occurred_at: e.occurred_at,
    created_at: e.created_at,
  }));
}
