import { recordActivity } from "@/lib/platform/activity";
import { requireTagWriteForAction } from "@/lib/platform/tags/permissions";
import type { ApplyTagsInput, CreateTagInput } from "@/lib/platform/tags/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function createTag(
  supabase: AuthClient,
  input: CreateTagInput,
  actorUserId?: string | null
): Promise<{ id: string | null; error?: string }> {
  const permission = await requireTagWriteForAction(supabase, "create");
  if (!permission.ok) return { id: null, error: permission.error };

  if (!input.slug?.trim() || !input.label?.trim()) {
    return { id: null, error: "Tag slug and label are required" };
  }

  const { data, error } = await supabase
    .from("platform_tags")
    .insert({
      organization_id: input.organizationId,
      slug: input.slug.trim().toLowerCase(),
      label: input.label.trim(),
      category: input.category ?? "custom",
      color: input.color ?? "slate",
      description: input.description ?? null,
      is_system: false,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };

  await recordActivity(supabase, {
    eventType: "tag.created",
    moduleKey: "platform",
    entityType: "organization",
    entityId: input.organizationId,
    title: "Tag created",
    summary: input.label.trim(),
    organizationId: input.organizationId,
    actorUserId,
    payload: {
      tagId: data.id,
      slug: input.slug.trim().toLowerCase(),
      category: input.category ?? "custom",
    },
    sourceTable: "platform_tags",
    sourceId: data.id,
  });

  return { id: data.id };
}

export async function applyTags(
  supabase: AuthClient,
  input: ApplyTagsInput
): Promise<{ applied: number; error?: string }> {
  const permission = await requireTagWriteForAction(supabase, "apply");
  if (!permission.ok) return { applied: 0, error: permission.error };

  if (!input.tagIds.length) return { applied: 0 };

  const { data: activeTags, error: tagError } = await supabase
    .from("platform_tags")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("is_active", true)
    .in("id", input.tagIds);

  if (tagError) return { applied: 0, error: tagError.message };

  const activeTagIds = (activeTags ?? []).map((tag) => tag.id);
  if (!activeTagIds.length) {
    return { applied: 0, error: "No active tags found for the requested tag IDs" };
  }

  const rows = activeTagIds.map((tagId) => ({
    organization_id: input.organizationId,
    tag_id: tagId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    applied_by: input.appliedBy ?? null,
    source: input.source ?? "manual",
    expires_at: input.expiresAt ?? null,
  }));

  const { data, error } = await supabase
    .from("platform_entity_tags")
    .upsert(rows, { onConflict: "organization_id,tag_id,entity_type,entity_id" })
    .select("id");

  if (error) return { applied: 0, error: error.message };

  await recordActivity(supabase, {
    eventType: "tag.applied",
    moduleKey: "platform",
    entityType: input.entityType,
    entityId: input.entityId,
    title: "Tags applied",
    summary: `${activeTagIds.length} tag(s) applied`,
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    studentId: input.studentId,
    familyId: input.familyId,
    actorUserId: input.appliedBy,
    payload: {
      tagIds: activeTagIds,
      expiresAt: input.expiresAt ?? null,
    },
    sourceTable: "platform_entity_tags",
  });

  return { applied: data?.length ?? 0 };
}

export async function removeTag(
  supabase: AuthClient,
  input: {
    organizationId: string;
    entityType: string;
    entityId: string;
    tagId: string;
    actorUserId?: string | null;
    schoolId?: string | null;
    studentId?: string | null;
    familyId?: string | null;
  }
): Promise<{ error?: string }> {
  const permission = await requireTagWriteForAction(supabase, "remove");
  if (!permission.ok) return { error: permission.error };

  const { error } = await supabase
    .from("platform_entity_tags")
    .delete()
    .eq("organization_id", input.organizationId)
    .eq("entity_type", input.entityType)
    .eq("entity_id", input.entityId)
    .eq("tag_id", input.tagId);

  if (error) return { error: error.message };

  await recordActivity(supabase, {
    eventType: "tag.removed",
    moduleKey: "platform",
    entityType: input.entityType,
    entityId: input.entityId,
    title: "Tag removed",
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    studentId: input.studentId,
    familyId: input.familyId,
    actorUserId: input.actorUserId,
    payload: { tagId: input.tagId },
    sourceTable: "platform_entity_tags",
  });

  return {};
}

export async function applyTagsBySlug(
  supabase: AuthClient,
  input: Omit<ApplyTagsInput, "tagIds"> & { tagSlugs: string[] }
): Promise<{ applied: number; error?: string }> {
  const { getTagBySlug } = await import("@/lib/platform/tags/query");
  const tagIds: string[] = [];

  for (const slug of input.tagSlugs) {
    const tag = await getTagBySlug(supabase, input.organizationId, slug);
    if (tag?.is_active) tagIds.push(tag.id);
  }

  return applyTags(supabase, { ...input, tagIds });
}
