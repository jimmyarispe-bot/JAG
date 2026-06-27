import { recordActivity } from "@/lib/platform/activity";
import type { CreateRelationshipInput } from "@/lib/platform/relationships/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function createRelationship(
  supabase: AuthClient,
  input: CreateRelationshipInput
): Promise<{ id: string | null; error?: string }> {
  const { data, error } = await supabase
    .from("platform_relationships")
    .insert({
      organization_id: input.organizationId,
      school_id: input.schoolId ?? null,
      relationship_type: input.relationshipType,
      from_entity_type: input.fromEntityType,
      from_entity_id: input.fromEntityId,
      to_entity_type: input.toEntityType,
      to_entity_id: input.toEntityId,
      is_primary: input.isPrimary ?? false,
      effective_date: input.effectiveDate ?? null,
      end_date: input.endDate ?? null,
      status: input.status ?? "active",
      source: input.source ?? "manual",
      notes: input.notes ?? null,
      metadata: input.metadata ?? {},
      created_by: input.createdBy ?? null,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };

  if (input.recordActivity !== false) {
    await recordActivity(supabase, {
      eventType: "relationship.created",
      moduleKey: "platform",
      entityType: input.fromEntityType,
      entityId: input.fromEntityId,
      title: `Relationship created: ${input.relationshipType}`,
      summary: `${input.fromEntityType} → ${input.toEntityType}`,
      organizationId: input.organizationId,
      schoolId: input.schoolId,
      studentId: input.studentId,
      familyId: input.familyId,
      actorUserId: input.createdBy,
      relatedEntityType: input.toEntityType,
      relatedEntityId: input.toEntityId,
      payload: {
        relationshipId: data.id,
        relationshipType: input.relationshipType,
        isPrimary: input.isPrimary ?? false,
      },
      sourceTable: "platform_relationships",
      sourceId: data.id,
    });
  }

  return { id: data.id };
}

export async function endRelationship(
  supabase: AuthClient,
  relationshipId: string,
  options?: {
    endDate?: string;
    actorUserId?: string | null;
    notes?: string;
  }
): Promise<{ error?: string }> {
  const endDate = options?.endDate ?? new Date().toISOString().split("T")[0];

  const { data: existing, error: fetchError } = await supabase
    .from("platform_relationships")
    .select("*")
    .eq("id", relationshipId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!existing) return { error: "Relationship not found" };

  const { error } = await supabase
    .from("platform_relationships")
    .update({
      status: "ended",
      end_date: endDate,
      notes: options?.notes ? [existing.notes, options.notes].filter(Boolean).join("\n") : existing.notes,
    })
    .eq("id", relationshipId);

  if (error) return { error: error.message };

  await recordActivity(supabase, {
    eventType: "relationship.ended",
    moduleKey: "platform",
    entityType: existing.from_entity_type,
    entityId: existing.from_entity_id,
    title: `Relationship ended: ${existing.relationship_type}`,
    organizationId: existing.organization_id,
    schoolId: existing.school_id,
    actorUserId: options?.actorUserId,
    relatedEntityType: existing.to_entity_type,
    relatedEntityId: existing.to_entity_id,
    payload: { relationshipId, endDate },
    sourceTable: "platform_relationships",
    sourceId: relationshipId,
  });

  return {};
}

export async function upsertPrimaryRelationship(
  supabase: AuthClient,
  input: CreateRelationshipInput
): Promise<{ id: string | null; error?: string }> {
  if (input.isPrimary) {
    await supabase
      .from("platform_relationships")
      .update({ is_primary: false })
      .eq("from_entity_type", input.fromEntityType)
      .eq("from_entity_id", input.fromEntityId)
      .eq("relationship_type", input.relationshipType)
      .eq("status", "active");
  }

  return createRelationship(supabase, { ...input, isPrimary: input.isPrimary ?? true });
}
