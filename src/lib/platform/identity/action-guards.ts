import { createAuthClient } from "@/lib/supabase/server-auth";
import { requirePermission } from "@/lib/platform/identity/permissions";
import type { PermissionKey } from "@/lib/platform/identity/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function assertPermission(
  permission: PermissionKey
): Promise<{ supabase: AuthClient; error?: undefined } | { error: "Forbidden"; supabase?: undefined }> {
  const supabase = await createAuthClient();
  const gate = await requirePermission(supabase, permission);
  if (!gate.ok) return { error: "Forbidden" };
  return { supabase };
}

export async function assertAnyPermission(
  ...permissions: PermissionKey[]
): Promise<{ supabase: AuthClient; error?: undefined } | { error: "Forbidden"; supabase?: undefined }> {
  const supabase = await createAuthClient();
  for (const permission of permissions) {
    const gate = await requirePermission(supabase, permission);
    if (gate.ok) return { supabase };
  }
  return { error: "Forbidden" };
}
