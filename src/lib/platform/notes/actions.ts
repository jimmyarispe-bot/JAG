import { recordActivity } from "@/lib/platform/activity";
import type { CreateNoteInput, NoteVisibility, UpdateNoteInput } from "@/lib/platform/notes/types";
import {
  normalizeMentionedUserIds,
  syncNoteVisibilityGrants,
  validateNoteAttachments,
} from "@/lib/platform/notes/visibility";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function createNote(
  supabase: AuthClient,
  input: CreateNoteInput
): Promise<{ id: string | null; error?: string }> {
  if (!input.body?.trim()) return { id: null, error: "Note body is required" };

  const attachmentCheck = validateNoteAttachments(input.attachments);
  if (!attachmentCheck.ok) return { id: null, error: attachmentCheck.error };

  const mentionedUserIds = normalizeMentionedUserIds(input.mentionedUserIds);
  const visibility = input.visibility ?? "staff";

  const { data, error } = await supabase
    .from("platform_notes")
    .insert({
      organization_id: input.organizationId,
      school_id: input.schoolId ?? null,
      entity_type: input.entityType,
      entity_id: input.entityId,
      student_id: input.studentId ?? null,
      family_id: input.familyId ?? null,
      body: input.body.trim(),
      category: input.category ?? "general",
      is_pinned: input.isPinned ?? false,
      author_user_id: input.authorUserId,
      visibility,
      mentioned_user_ids: mentionedUserIds,
      attachments: attachmentCheck.attachments,
      source: input.source ?? "manual",
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };

  await syncNoteVisibilityGrants(supabase, data.id, visibility, mentionedUserIds);

  await recordActivity(supabase, {
    eventType: "note.created",
    moduleKey: "platform",
    entityType: input.entityType,
    entityId: input.entityId,
    title: "Note created",
    summary: input.body.slice(0, 120),
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    studentId: input.studentId,
    familyId: input.familyId,
    actorUserId: input.authorUserId,
    payload: {
      noteId: data.id,
      category: input.category ?? "general",
      visibility,
      mentionedUserIds,
      attachmentCount: attachmentCheck.attachments.length,
    },
    sourceTable: "platform_notes",
    sourceId: data.id,
  });

  return { id: data.id };
}

export async function updateNote(
  supabase: AuthClient,
  noteId: string,
  input: UpdateNoteInput,
  actorUserId?: string | null
): Promise<{ error?: string }> {
  const { data: existing, error: fetchError } = await supabase
    .from("platform_notes")
    .select("*")
    .eq("id", noteId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!existing) return { error: "Note not found" };

  const patch: Record<string, unknown> = {};
  if (input.body !== undefined) {
    if (!input.body.trim()) return { error: "Note body is required" };
    patch.body = input.body.trim();
  }
  if (input.category !== undefined) patch.category = input.category;
  if (input.visibility !== undefined) patch.visibility = input.visibility;
  if (input.isPinned !== undefined) patch.is_pinned = input.isPinned;
  if (input.mentionedUserIds !== undefined) {
    patch.mentioned_user_ids = normalizeMentionedUserIds(input.mentionedUserIds);
  }
  if (input.attachments !== undefined) {
    const attachmentCheck = validateNoteAttachments(input.attachments);
    if (!attachmentCheck.ok) return { error: attachmentCheck.error };
    patch.attachments = attachmentCheck.attachments;
  }

  if (!Object.keys(patch).length) return {};

  const { error } = await supabase.from("platform_notes").update(patch).eq("id", noteId);
  if (error) return { error: error.message };

  const nextVisibility = ((patch.visibility as NoteVisibility | undefined) ?? existing.visibility) as NoteVisibility;
  const nextMentions =
    (patch.mentioned_user_ids as string[] | undefined) ?? existing.mentioned_user_ids ?? [];

  if (input.visibility !== undefined || input.mentionedUserIds !== undefined) {
    await syncNoteVisibilityGrants(supabase, noteId, nextVisibility, nextMentions);
  }

  await recordActivity(supabase, {
    eventType: "note.updated",
    moduleKey: "platform",
    entityType: existing.entity_type,
    entityId: existing.entity_id,
    title: "Note updated",
    organizationId: existing.organization_id,
    schoolId: existing.school_id,
    studentId: existing.student_id,
    familyId: existing.family_id,
    actorUserId,
    payload: {
      noteId,
      changedFields: Object.keys(patch),
      mentionedUserIds: nextMentions,
      visibility: nextVisibility,
    },
    sourceTable: "platform_notes",
    sourceId: noteId,
  });

  return {};
}

export async function pinNote(
  supabase: AuthClient,
  noteId: string,
  pinned: boolean,
  actorUserId?: string | null
): Promise<{ error?: string }> {
  const { data: existing, error: fetchError } = await supabase
    .from("platform_notes")
    .select("*")
    .eq("id", noteId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!existing) return { error: "Note not found" };
  if (existing.is_pinned === pinned) return {};

  const { error } = await supabase
    .from("platform_notes")
    .update({ is_pinned: pinned })
    .eq("id", noteId);

  if (error) return { error: error.message };

  await recordActivity(supabase, {
    eventType: pinned ? "note.pinned" : "note.unpinned",
    moduleKey: "platform",
    entityType: existing.entity_type,
    entityId: existing.entity_id,
    title: pinned ? "Note pinned" : "Note unpinned",
    organizationId: existing.organization_id,
    schoolId: existing.school_id,
    studentId: existing.student_id,
    familyId: existing.family_id,
    actorUserId,
    payload: { noteId, isPinned: pinned },
    sourceTable: "platform_notes",
    sourceId: noteId,
  });

  return {};
}

export async function deleteNote(
  supabase: AuthClient,
  noteId: string,
  actorUserId?: string | null
): Promise<{ error?: string }> {
  const { data: existing, error: fetchError } = await supabase
    .from("platform_notes")
    .select("*")
    .eq("id", noteId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!existing) return { error: "Note not found" };

  const { error } = await supabase
    .from("platform_notes")
    .update({ is_deleted: true, is_pinned: false })
    .eq("id", noteId);

  if (error) return { error: error.message };

  await syncNoteVisibilityGrants(supabase, noteId, "staff", []);

  await recordActivity(supabase, {
    eventType: "note.deleted",
    moduleKey: "platform",
    entityType: existing.entity_type,
    entityId: existing.entity_id,
    title: "Note deleted",
    organizationId: existing.organization_id,
    schoolId: existing.school_id,
    studentId: existing.student_id,
    familyId: existing.family_id,
    actorUserId,
    payload: { noteId },
    sourceTable: "platform_notes",
    sourceId: noteId,
  });

  return {};
}
