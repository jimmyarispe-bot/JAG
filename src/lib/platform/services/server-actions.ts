"use server";

import { revalidatePath } from "next/cache";
import { assertAnyPermission } from "@/lib/platform/identity/action-guards";
import {
  createNote,
  deleteNote,
  pinNote,
  updateNote,
} from "@/lib/platform/notes";
import type { NoteAttachment, NoteCategory, NoteVisibility } from "@/lib/platform/notes/types";
import {
  assertTagApplyPermission,
  assertTagCreatePermission,
  assertTagRemovePermission,
} from "@/lib/platform/tags/permissions";
import { applyTags, applyTagsBySlug, createTag, removeTag } from "@/lib/platform/tags";
import type { TagCategory } from "@/lib/platform/tags/types";
import { resolveActorUserId } from "@/lib/platform/shared/context";

async function requireNotesWrite() {
  return assertAnyPermission("students.edit", "hr.manage", "configuration.manage");
}

function parseAttachments(raw: FormDataEntryValue | null): NoteAttachment[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as NoteAttachment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseStringArray(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }
}

function revalidateEntityPath(entityType: string, entityId: string) {
  if (entityType === "student") revalidatePath(`/dashboard/students/${entityId}`);
  if (entityType === "employee") revalidatePath(`/dashboard/hr/employees/${entityId}`);
}

export async function createPlatformNoteAction(formData: FormData) {
  const auth = await requireNotesWrite();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const organizationId = formData.get("organization_id") as string;
  const entityType = formData.get("entity_type") as string;
  const entityId = formData.get("entity_id") as string;
  const body = formData.get("body") as string;
  const actorUserId = await resolveActorUserId(supabase);

  const result = await createNote(supabase, {
    organizationId,
    schoolId: (formData.get("school_id") as string) || null,
    entityType,
    entityId,
    body,
    category: ((formData.get("category") as string) || "general") as NoteCategory,
    visibility: ((formData.get("visibility") as string) || "staff") as NoteVisibility,
    isPinned: formData.get("is_pinned") === "true",
    mentionedUserIds: parseStringArray(formData.get("mentioned_user_ids")),
    attachments: parseAttachments(formData.get("attachments")),
    authorUserId: actorUserId ?? "",
    studentId: (formData.get("student_id") as string) || null,
    familyId: (formData.get("family_id") as string) || null,
  });

  if (result.error) return { error: result.error };

  revalidateEntityPath(entityType, entityId);
  return { id: result.id };
}

export async function updatePlatformNoteAction(formData: FormData) {
  const auth = await requireNotesWrite();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const noteId = formData.get("note_id") as string;
  const entityType = (formData.get("entity_type") as string) || "";
  const entityId = (formData.get("entity_id") as string) || "";
  const actorUserId = await resolveActorUserId(supabase);

  const result = await updateNote(
    supabase,
    noteId,
    {
      body: formData.has("body") ? (formData.get("body") as string) : undefined,
      category: formData.has("category")
        ? ((formData.get("category") as string) as NoteCategory)
        : undefined,
      visibility: formData.has("visibility")
        ? ((formData.get("visibility") as string) as NoteVisibility)
        : undefined,
      isPinned: formData.has("is_pinned") ? formData.get("is_pinned") === "true" : undefined,
      mentionedUserIds: formData.has("mentioned_user_ids")
        ? parseStringArray(formData.get("mentioned_user_ids"))
        : undefined,
      attachments: formData.has("attachments")
        ? parseAttachments(formData.get("attachments"))
        : undefined,
    },
    actorUserId
  );

  if (result.error) return { error: result.error };

  if (entityType && entityId) revalidateEntityPath(entityType, entityId);
  return { ok: true };
}

export async function deletePlatformNoteAction(formData: FormData) {
  const auth = await requireNotesWrite();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const noteId = formData.get("note_id") as string;
  const entityType = (formData.get("entity_type") as string) || "";
  const entityId = (formData.get("entity_id") as string) || "";
  const actorUserId = await resolveActorUserId(supabase);

  const result = await deleteNote(supabase, noteId, actorUserId);
  if (result.error) return { error: result.error };

  if (entityType && entityId) revalidateEntityPath(entityType, entityId);
  return { ok: true };
}

export async function pinPlatformNoteAction(formData: FormData) {
  const auth = await requireNotesWrite();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const noteId = formData.get("note_id") as string;
  const pinned = formData.get("pinned") === "true";
  const entityType = (formData.get("entity_type") as string) || "";
  const entityId = (formData.get("entity_id") as string) || "";
  const actorUserId = await resolveActorUserId(supabase);

  const result = await pinNote(supabase, noteId, pinned, actorUserId);
  if (result.error) return { error: result.error };

  if (entityType && entityId) revalidateEntityPath(entityType, entityId);
  return { ok: true };
}

export async function createPlatformTagAction(formData: FormData) {
  const auth = await assertTagCreatePermission();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const organizationId = formData.get("organization_id") as string;
  const actorUserId = await resolveActorUserId(supabase);

  const result = await createTag(
    supabase,
    {
      organizationId,
      slug: formData.get("slug") as string,
      label: formData.get("label") as string,
      category: ((formData.get("category") as string) || "custom") as TagCategory,
      color: (formData.get("color") as string) || "slate",
      description: (formData.get("description") as string) || null,
    },
    actorUserId
  );

  if (result.error) return { error: result.error };
  revalidatePath("/dashboard");
  return { id: result.id };
}

export async function applyPlatformTagsAction(formData: FormData) {
  const auth = await assertTagApplyPermission();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const organizationId = formData.get("organization_id") as string;
  const entityType = formData.get("entity_type") as string;
  const entityId = formData.get("entity_id") as string;
  const actorUserId = await resolveActorUserId(supabase);
  const tagIds = parseStringArray(formData.get("tag_ids"));
  const tagSlugs = parseStringArray(formData.get("tag_slugs"));
  const expiresAt = (formData.get("expires_at") as string) || null;

  const input = {
    organizationId,
    entityType,
    entityId,
    appliedBy: actorUserId,
    schoolId: (formData.get("school_id") as string) || null,
    studentId: (formData.get("student_id") as string) || null,
    familyId: (formData.get("family_id") as string) || null,
    expiresAt,
  };

  const result =
    tagSlugs.length > 0
      ? await applyTagsBySlug(supabase, { ...input, tagSlugs })
      : await applyTags(supabase, { ...input, tagIds });

  if (result.error) return { error: result.error };

  revalidateEntityPath(entityType, entityId);
  return { applied: result.applied };
}

export async function removePlatformTagAction(formData: FormData) {
  const auth = await assertTagRemovePermission();
  if ("error" in auth) return { error: auth.error };
  const supabase = auth.supabase;

  const organizationId = formData.get("organization_id") as string;
  const entityType = formData.get("entity_type") as string;
  const entityId = formData.get("entity_id") as string;
  const tagId = formData.get("tag_id") as string;
  const actorUserId = await resolveActorUserId(supabase);

  const result = await removeTag(supabase, {
    organizationId,
    entityType,
    entityId,
    tagId,
    actorUserId,
    schoolId: (formData.get("school_id") as string) || null,
    studentId: (formData.get("student_id") as string) || null,
    familyId: (formData.get("family_id") as string) || null,
  });

  if (result.error) return { error: result.error };

  revalidateEntityPath(entityType, entityId);
  return { ok: true };
}
