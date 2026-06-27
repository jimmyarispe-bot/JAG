import { recordActivity } from "@/lib/platform/activity";
import type { CreateRelationshipInput } from "@/lib/platform/relationships/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function buildRelationshipPatch(
  existing: Record<string, unknown>,
  input: CreateRelationshipInput
): Record<string, unknown> {
  return {
    is_primary: input.isPrimary ?? existing.is_primary,
    effective_date: input.effectiveDate ?? existing.effective_date,
    end_date: input.endDate ?? existing.end_date,
    source: input.source ?? existing.source,
    notes: input.notes ?? existing.notes,
    metadata: input.metadata ?? existing.metadata,
    school_id: input.schoolId ?? existing.school_id,
  };
}

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
  if (existing.status === "ended") return {};

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

/** Update an existing active relationship or create a new one without duplicating rows. */
export async function upsertActiveRelationship(
  supabase: AuthClient,
  input: CreateRelationshipInput
): Promise<{ id: string | null; error?: string; created?: boolean }> {
  const { data: existing, error: lookupError } = await supabase
    .from("platform_relationships")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("relationship_type", input.relationshipType)
    .eq("from_entity_type", input.fromEntityType)
    .eq("from_entity_id", input.fromEntityId)
    .eq("to_entity_type", input.toEntityType)
    .eq("to_entity_id", input.toEntityId)
    .eq("status", "active")
    .maybeSingle();

  if (lookupError) return { id: null, error: lookupError.message };

  if (existing) {
    const patch = buildRelationshipPatch(existing, input);
    const { error } = await supabase.from("platform_relationships").update(patch).eq("id", existing.id);
    if (error) return { id: null, error: error.message };

    if (input.recordActivity !== false) {
      await recordActivity(supabase, {
        eventType: "relationship.updated",
        moduleKey: "platform",
        entityType: input.fromEntityType,
        entityId: input.fromEntityId,
        title: `Relationship updated: ${input.relationshipType}`,
        summary: `${input.fromEntityType} → ${input.toEntityType}`,
        organizationId: input.organizationId,
        schoolId: input.schoolId ?? existing.school_id,
        studentId: input.studentId,
        familyId: input.familyId,
        actorUserId: input.createdBy,
        relatedEntityType: input.toEntityType,
        relatedEntityId: input.toEntityId,
        payload: {
          relationshipId: existing.id,
          relationshipType: input.relationshipType,
          isPrimary: patch.is_primary,
        },
        sourceTable: "platform_relationships",
        sourceId: existing.id,
      });
    }

    return { id: existing.id, created: false };
  }

  const created = await createRelationship(supabase, input);
  return { ...created, created: true };
}

export async function upsertPrimaryRelationship(
  supabase: AuthClient,
  input: CreateRelationshipInput
): Promise<{ id: string | null; error?: string }> {
  const isPrimary = input.isPrimary ?? true;

  if (isPrimary) {
    const { data: stalePrimaries } = await supabase
      .from("platform_relationships")
      .select("id")
      .eq("organization_id", input.organizationId)
      .eq("from_entity_type", input.fromEntityType)
      .eq("from_entity_id", input.fromEntityId)
      .eq("relationship_type", input.relationshipType)
      .eq("status", "active")
      .eq("is_primary", true)
      .neq("to_entity_id", input.toEntityId);

    for (const stale of stalePrimaries ?? []) {
      await endRelationship(supabase, stale.id, {
        actorUserId: input.createdBy,
        notes: "Superseded by primary relationship upsert",
      });
    }

    await supabase
      .from("platform_relationships")
      .update({ is_primary: false })
      .eq("organization_id", input.organizationId)
      .eq("from_entity_type", input.fromEntityType)
      .eq("from_entity_id", input.fromEntityId)
      .eq("relationship_type", input.relationshipType)
      .eq("status", "active")
      .eq("to_entity_id", input.toEntityId);
  }

  return upsertActiveRelationship(supabase, { ...input, isPrimary });
}
