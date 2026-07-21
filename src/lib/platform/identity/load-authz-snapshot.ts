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

type OverlayQueryResult = {
  data: OverlayRow[] | null;
  error: { message?: string } | null;
};

/**
 * Narrow query surface for IAM overlay tables that are not yet in generated Database types.
 * Prefer this over `any` — validate rows before reading permission keys.
 */
type OverlayTableQuery = {
  select: (columns: string) => OverlayTableQuery;
  eq: (column: string, value: string) => OverlayTableQuery;
  lte: (column: string, value: string) => OverlayTableQuery;
  gt: (column: string, value: string) => OverlayTableQuery;
  then: PromiseLike<OverlayQueryResult>["then"];
};

type OverlayClient = {
  from: (table: "iam_delegations" | "iam_break_glass_sessions") => OverlayTableQuery;
};

function asOverlayClient(supabase: AnySupabase): OverlayClient {
  return supabase as unknown as OverlayClient;
}

function collectPermissionKeys(data: unknown, into: Set<string>): void {
  if (!Array.isArray(data)) return;
  for (const row of data) {
    if (!row || typeof row !== "object") continue;
    const overlay = row as OverlayRow;
    if (overlay.revoked_at) continue;
    for (const key of overlay.permission_keys ?? []) {
      if (typeof key === "string" && key.length > 0) into.add(key);
    }
  }
}

/**
 * Query IAM overlay tables via a narrow untyped client until generated DB types include them.
 */
async function mergeIamOverlays(
  supabase: AnySupabase,
  userId: string,
  base: AuthzSnapshot
): Promise<AuthzSnapshot> {
  const extra = new Set<string>();
  const nowIso = new Date().toISOString();
  const db = asOverlayClient(supabase);

  try {
    const { data, error } = await db
      .from("iam_delegations")
      .select("permission_keys, status, starts_at, expires_at, revoked_at")
      .eq("grantee_user_id", userId)
      .eq("status", "active")
      .lte("starts_at", nowIso)
      .gt("expires_at", nowIso);

    if (!error) collectPermissionKeys(data, extra);
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

    if (!error) collectPermissionKeys(data, extra);
  } catch {
    // Table may not exist yet — ignore.
  }

  if (extra.size === 0) return base;
  return buildAuthzSnapshot(userId, base.roles, [...extra] as PermissionKey[]);
}
