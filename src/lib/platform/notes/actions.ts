import { recordActivity } from "@/lib/platform/activity";
import type { CreateNoteInput, UpdateNoteInput } from "@/lib/platform/notes/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function createNote(
  supabase: AuthClient,
  input: CreateNoteInput
): Promise<{ id: string | null; error?: string }> {
  const { data, error } = await supabase
    .from("platform_notes")
    .insert({
      organization_id: input.organizationId,
      school_id: input.schoolId ?? null,
      entity_type: input.entityType,
      entity_id: input.entityId,
      student_id: input.studentId ?? null,
      family_id: input.familyId ?? null,
      body: input.body,
      category: input.category ?? "general",
      is_pinned: input.isPinned ?? false,
      author_user_id: input.authorUserId,
      visibility: input.visibility ?? "staff",
      mentioned_user_ids: input.mentionedUserIds ?? [],
      attachments: input.attachments ?? [],
      source: input.source ?? "manual",
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };

  if (input.visibility === "restricted" && input.mentionedUserIds?.length) {
    await supabase.from("platform_note_visibility_grants").insert(
      input.mentionedUserIds.map((userId) => ({
        note_id: data.id,
        user_id: userId,
      }))
    );
  }

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
      visibility: input.visibility ?? "staff",
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
  const patch: Record<string, unknown> = {};
  if (input.body !== undefined) patch.body = input.body;
  if (input.category !== undefined) patch.category = input.category;
  if (input.visibility !== undefined) patch.visibility = input.visibility;
  if (input.isPinned !== undefined) patch.is_pinned = input.isPinned;
  if (input.mentionedUserIds !== undefined) patch.mentioned_user_ids = input.mentionedUserIds;
  if (input.attachments !== undefined) patch.attachments = input.attachments;

  const { data: existing, error: fetchError } = await supabase
    .from("platform_notes")
    .select("*")
    .eq("id", noteId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!existing) return { error: "Note not found" };

  const { error } = await supabase.from("platform_notes").update(patch).eq("id", noteId);
  if (error) return { error: error.message };

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
    payload: { noteId },
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
  return updateNote(supabase, noteId, { isPinned: pinned }, actorUserId);
}

export async function deleteNote(
  supabase: AuthClient,
  noteId: string,
  actorUserId?: string | null
): Promise<{ error?: string }> {
  const { data: existing } = await supabase
    .from("platform_notes")
    .select("*")
    .eq("id", noteId)
    .maybeSingle();

  const { error } = await supabase
    .from("platform_notes")
    .update({ is_deleted: true })
    .eq("id", noteId);

  if (error) return { error: error.message };

  if (existing) {
    await recordActivity(supabase, {
      eventType: "note.updated",
      moduleKey: "platform",
      entityType: existing.entity_type,
      entityId: existing.entity_id,
      title: "Note deleted",
      organizationId: existing.organization_id,
      schoolId: existing.school_id,
      studentId: existing.student_id,
      actorUserId,
      payload: { noteId, deleted: true },
    });
  }

  return {};
}
