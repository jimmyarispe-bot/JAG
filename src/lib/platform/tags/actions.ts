import { recordActivity } from "@/lib/platform/activity";
import type { ApplyTagsInput, CreateTagInput } from "@/lib/platform/tags/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function createTag(
  supabase: AuthClient,
  input: CreateTagInput
): Promise<{ id: string | null; error?: string }> {
  const { data, error } = await supabase
    .from("platform_tags")
    .insert({
      organization_id: input.organizationId,
      slug: input.slug,
      label: input.label,
      category: input.category ?? "custom",
      color: input.color ?? "slate",
      description: input.description ?? null,
      is_system: false,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data.id };
}

export async function applyTags(
  supabase: AuthClient,
  input: ApplyTagsInput
): Promise<{ applied: number; error?: string }> {
  if (!input.tagIds.length) return { applied: 0 };

  const rows = input.tagIds.map((tagId) => ({
    organization_id: input.organizationId,
    tag_id: tagId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    applied_by: input.appliedBy ?? null,
    source: input.source ?? "manual",
  }));

  const { data, error } = await supabase
    .from("platform_entity_tags")
    .upsert(rows, { onConflict: "organization_id,tag_id,entity_type,entity_id", ignoreDuplicates: true })
    .select("id");

  if (error) return { applied: 0, error: error.message };

  await recordActivity(supabase, {
    eventType: "tag.applied",
    moduleKey: "platform",
    entityType: input.entityType,
    entityId: input.entityId,
    title: "Tags applied",
    summary: `${input.tagIds.length} tag(s) applied`,
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    studentId: input.studentId,
    familyId: input.familyId,
    actorUserId: input.appliedBy,
    payload: { tagIds: input.tagIds },
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
  }
): Promise<{ error?: string }> {
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
    actorUserId: input.actorUserId,
    payload: { tagId: input.tagId },
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
    if (tag) tagIds.push(tag.id);
  }

  return applyTags(supabase, { ...input, tagIds });
}
