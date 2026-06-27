import type { NoteAttachment, NoteVisibility } from "@/lib/platform/notes/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export function normalizeMentionedUserIds(userIds?: string[] | null): string[] {
  if (!userIds?.length) return [];
  return [...new Set(userIds.filter(Boolean))];
}

export function validateNoteAttachments(
  attachments?: NoteAttachment[]
): { ok: true; attachments: NoteAttachment[] } | { ok: false; error: string } {
  if (!attachments?.length) return { ok: true, attachments: [] };

  for (const attachment of attachments) {
    if (!attachment.fileName?.trim()) {
      return { ok: false, error: "Attachments require fileName" };
    }
    if (!attachment.storagePath?.trim()) {
      return { ok: false, error: "Attachments require storagePath" };
    }
  }

  return { ok: true, attachments };
}

export async function syncNoteVisibilityGrants(
  supabase: AuthClient,
  noteId: string,
  visibility: NoteVisibility,
  mentionedUserIds: string[]
): Promise<void> {
  if (visibility !== "restricted") {
    await supabase.from("platform_note_visibility_grants").delete().eq("note_id", noteId);
    return;
  }

  const grantUserIds = normalizeMentionedUserIds(mentionedUserIds);
  if (!grantUserIds.length) {
    await supabase.from("platform_note_visibility_grants").delete().eq("note_id", noteId);
    return;
  }

  await supabase.from("platform_note_visibility_grants").delete().eq("note_id", noteId);
  await supabase.from("platform_note_visibility_grants").insert(
    grantUserIds.map((userId) => ({
      note_id: noteId,
      user_id: userId,
    }))
  );
}
