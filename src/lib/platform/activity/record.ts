import { publishEvent } from "@/lib/integration-hub/event-bus";
import { getActivityEventDefinition } from "@/lib/platform/activity/catalog";
import type { RecordActivityInput } from "@/lib/platform/activity/types";
import { validateRecordActivityInput } from "@/lib/platform/activity/validate";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function buildSearchableText(input: RecordActivityInput): string {
  return [input.title, input.summary, input.body, input.eventType, input.entityType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * Global Activity Engine — single write path for all module state changes.
 * Also dual-writes to legacy platform_timeline_events for backward compatibility.
 */
export async function recordActivity(
  supabase: AuthClient,
  input: RecordActivityInput
): Promise<{ id: string | null; error?: string }> {
  const validation = validateRecordActivityInput(input);
  if (!validation.ok) {
    return { id: null, error: validation.error };
  }

  const def = getActivityEventDefinition(input.eventType)!;
  const moduleKey = input.moduleKey ?? def.moduleKey;
  const classification = input.classification ?? def.classification;
  const visibility = input.visibility ?? def.visibility;
  const summary = input.summary ?? input.title;
  const searchableText = buildSearchableText({ ...input, summary });

  const row = {
    organization_id: input.organizationId ?? null,
    school_id: input.schoolId ?? null,
    campus_id: input.campusId ?? null,
    module_key: moduleKey,
    event_type: input.eventType,
    event_version: "1.0",
    entity_type: input.entityType,
    entity_id: input.entityId,
    title: input.title,
    summary,
    body: input.body ?? "",
    actor_user_id: input.actorUserId ?? null,
    actor_type: input.actorType ?? "user",
    occurred_at: input.occurredAt ?? new Date().toISOString(),
    student_id: input.studentId ?? null,
    family_id: input.familyId ?? null,
    related_entity_type: input.relatedEntityType ?? null,
    related_entity_id: input.relatedEntityId ?? null,
    classification,
    visibility,
    severity: input.severity ?? null,
    payload: input.payload ?? {},
    correlation_id: input.correlationId ?? null,
    source_table: input.sourceTable ?? null,
    source_id: input.sourceId ?? null,
    searchable_text: searchableText,
  };

  const { data, error } = await supabase
    .from("platform_activity_events")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    return { id: null, error: error.message };
  }

  // Legacy dual-write for consumers still reading platform_timeline_events
  await supabase.from("platform_timeline_events").insert({
    school_id: input.schoolId ?? null,
    module: moduleKey,
    entity_type: input.entityType,
    entity_id: input.entityId,
    event_type: input.eventType,
    title: input.title,
    body: input.body ?? summary,
    actor_user_id: input.actorUserId ?? null,
    related_entity_type: input.relatedEntityType ?? null,
    related_entity_id: input.relatedEntityId ?? null,
    metadata: {
      ...(input.payload ?? {}),
      activity_event_id: data.id,
      classification,
      visibility,
    },
    occurred_at: input.occurredAt ?? new Date().toISOString(),
  });

  // Fan-out to Integration Hub (non-blocking)
  if (input.organizationId) {
    void publishEvent(supabase, {
      organizationId: input.organizationId,
      eventType: input.eventType,
      eventSource: moduleKey,
      payload: {
        activityEventId: data.id,
        entityType: input.entityType,
        entityId: input.entityId,
        studentId: input.studentId,
        familyId: input.familyId,
        title: input.title,
        summary,
        ...(input.payload ?? {}),
      },
      correlationId: input.correlationId ?? data.id,
    });
  }

  return { id: data.id };
}
