import { getEntityNotes, getPinnedNotes } from "@/lib/platform/notes";
import { getEntityTags } from "@/lib/platform/tags";
import type { PlatformNote } from "@/lib/platform/notes/types";
import type { PlatformEntityTag } from "@/lib/platform/tags/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface ProfileContextData {
  pinnedNotes: PlatformNote[];
  recentNotes: PlatformNote[];
  notesForContext: PlatformNote[];
  entityTags: PlatformEntityTag[];
}

/** Load shared profile context panel data (notes + tags) for any profile kind. */
export async function loadProfileContextData(
  supabase: AuthClient,
  entityType: string,
  entityId: string,
  organizationId: string | null,
  options?: {
    /** Domain-specific recent notes loader (e.g. student family notes). */
    loadRecentNotes?: () => Promise<PlatformNote[]>;
    recentNotesLimit?: number;
  }
): Promise<ProfileContextData> {
  const [pinnedNotes, recentNotes, entityTags] = await Promise.all([
    getPinnedNotes(supabase, entityType, entityId),
    options?.loadRecentNotes
      ? options.loadRecentNotes()
      : getEntityNotes(supabase, entityType, entityId, {
          limit: options?.recentNotesLimit ?? 10,
        }),
    organizationId
      ? getEntityTags(supabase, entityType, entityId)
      : Promise.resolve([]),
  ]);

  return {
    pinnedNotes,
    recentNotes,
    notesForContext: pinnedNotes.length > 0 ? pinnedNotes : recentNotes,
    entityTags,
  };
}
