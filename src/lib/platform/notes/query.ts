import type { NoteCategory, NoteVisibility, PlatformNote } from "@/lib/platform/notes/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getEntityNotes(
  supabase: AuthClient,
  entityType: string,
  entityId: string,
  options?: {
    category?: NoteCategory;
    visibility?: NoteVisibility;
    pinnedFirst?: boolean;
    limit?: number;
  }
): Promise<PlatformNote[]> {
  let q = supabase
    .from("platform_notes")
    .select("*, users(full_name)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("is_deleted", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 100);

  if (options?.category) q = q.eq("category", options.category);
  if (options?.visibility) q = q.eq("visibility", options.visibility);

  const { data } = await q;
  return (data ?? []) as PlatformNote[];
}

export async function getStudentNotes(
  supabase: AuthClient,
  studentId: string,
  options?: { includeFamily?: boolean; limit?: number }
): Promise<PlatformNote[]> {
  const { data: studentNotes } = await supabase
    .from("platform_notes")
    .select("*, users(full_name)")
    .eq("student_id", studentId)
    .eq("is_deleted", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 50);

  const notes = (studentNotes ?? []) as PlatformNote[];

  if (options?.includeFamily) {
    const { data: student } = await supabase
      .from("students")
      .select("family_id")
      .eq("id", studentId)
      .maybeSingle();

    if (student?.family_id) {
      const familyNotes = await getEntityNotes(supabase, "family", student.family_id, {
        limit: options?.limit ?? 20,
      });
      const visible = familyNotes.filter((n) => n.visibility === "parent_visible" || n.visibility === "staff");
      return [...notes, ...visible].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  }

  return notes;
}

export async function getPinnedNotes(
  supabase: AuthClient,
  entityType: string,
  entityId: string
): Promise<PlatformNote[]> {
  const { data } = await supabase
    .from("platform_notes")
    .select("*, users(full_name)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("is_pinned", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  return (data ?? []) as PlatformNote[];
}

export async function searchNotes(
  supabase: AuthClient,
  organizationId: string,
  options?: {
    query?: string;
    entityType?: string;
    authorUserId?: string;
    limit?: number;
  }
): Promise<PlatformNote[]> {
  let q = supabase
    .from("platform_notes")
    .select("*, users(full_name)")
    .eq("organization_id", organizationId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 50);

  if (options?.entityType) q = q.eq("entity_type", options.entityType);
  if (options?.authorUserId) q = q.eq("author_user_id", options.authorUserId);

  const { data } = await q;
  let notes = (data ?? []) as PlatformNote[];

  if (options?.query) {
    const needle = options.query.toLowerCase();
    notes = notes.filter((n) => n.body.toLowerCase().includes(needle));
  }

  return notes;
}
