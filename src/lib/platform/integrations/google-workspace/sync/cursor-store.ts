import type { createAuthClient } from "@/lib/supabase/server-auth";
import { memoryGoogleSyncRegistry } from "@/lib/platform/integrations/google-workspace/sync/memory-registry";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getSyncCursor(
  supabase: AuthClient | null,
  connectionId: string,
  objectType: string
): Promise<string | null> {
  const key = memoryGoogleSyncRegistry.cursorKey(connectionId, objectType);
  if (supabase) {
    const { data, error } = await supabase
      .from("integration_sync_cursors")
      .select("cursor")
      .eq("connection_id", connectionId)
      .eq("object_type", objectType)
      .maybeSingle();
    if (!error && data) return (data.cursor as string | null) ?? null;
  }
  return memoryGoogleSyncRegistry.cursors.get(key) ?? null;
}

export async function setSyncCursor(
  supabase: AuthClient | null,
  connectionId: string,
  objectType: string,
  cursor: string | null
): Promise<void> {
  const key = memoryGoogleSyncRegistry.cursorKey(connectionId, objectType);
  if (cursor) memoryGoogleSyncRegistry.cursors.set(key, cursor);
  else memoryGoogleSyncRegistry.cursors.delete(key);

  if (!supabase) return;
  if (!cursor) {
    await supabase
      .from("integration_sync_cursors")
      .delete()
      .eq("connection_id", connectionId)
      .eq("object_type", objectType);
    return;
  }
  await supabase.from("integration_sync_cursors").upsert({
    connection_id: connectionId,
    object_type: objectType,
    cursor,
    updated_at: new Date().toISOString(),
  });
}
