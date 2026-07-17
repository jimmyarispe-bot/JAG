/**
 * Load an AuthzSnapshot for middleware / server guards.
 * Edge-safe: uses only Supabase client + role→permission mapping.
 *
 * Temporary authority overlays (IAM delegation / break glass) are merged when
 * the Sprint 014 tables are present; missing tables degrade gracefully.
 */

import { buildAuthzSnapshot, type AuthzSnapshot } from "@/lib/platform/identity/authorization-service";
import type { PermissionKey } from "@/lib/platform/identity/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { SupabaseClient } from "@supabase/supabase-js";

type AnySupabase = SupabaseClient | Awaited<ReturnType<typeof createAuthClient>>;

export async function loadAuthzSnapshot(
  supabase: AnySupabase,
  userId: string
): Promise<AuthzSnapshot> {
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId);

  const roleIds = userRoles?.map((row) => row.role_id) ?? [];
  if (!roleIds.length) {
    return mergeIamOverlays(supabase, userId, buildAuthzSnapshot(userId, []));
  }

  const { data: roles } = await supabase.from("roles").select("name").in("id", roleIds);
  const roleNames = roles?.map((row) => row.name).filter(Boolean) ?? [];

  return mergeIamOverlays(supabase, userId, buildAuthzSnapshot(userId, roleNames));
}

type OverlayRow = {
  permission_keys?: string[] | null;
  revoked_at?: string | null;
};

/**
 * Query IAM overlay tables via an untyped client until generated DB types include them.
 */
async function mergeIamOverlays(
  supabase: AnySupabase,
  userId: string,
  base: AuthzSnapshot
): Promise<AuthzSnapshot> {
  const extra = new Set<string>();
  const nowIso = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  try {
    const { data, error } = await db
      .from("iam_delegations")
      .select("permission_keys, status, starts_at, expires_at, revoked_at")
      .eq("grantee_user_id", userId)
      .eq("status", "active")
      .lte("starts_at", nowIso)
      .gt("expires_at", nowIso);

    if (!error && Array.isArray(data)) {
      for (const row of data as OverlayRow[]) {
        if (row.revoked_at) continue;
        for (const key of row.permission_keys ?? []) {
          extra.add(key);
        }
      }
    }
  } catch {
    // Table may not exist yet — ignore.
  }

  try {
    const { data, error } = await db
      .from("iam_break_glass_sessions")
      .select("permission_keys, status, expires_at")
      .eq("requester_user_id", userId)
      .eq("status", "active")
      .gt("expires_at", nowIso);

    if (!error && Array.isArray(data)) {
      for (const row of data as OverlayRow[]) {
        for (const key of row.permission_keys ?? []) {
          extra.add(key);
        }
      }
    }
  } catch {
    // Table may not exist yet — ignore.
  }

  if (extra.size === 0) return base;
  return buildAuthzSnapshot(userId, base.roles, [...extra] as PermissionKey[]);
}
