/**
 * Server-side auth user provisioning safety net.
 * DB trigger (175) is the primary path; this heals sessions that predate it
 * or missed role/org assignment rows.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const JAG_ONLY_ROLE_ALLOWLIST = new Set([
  "TEAM_MEMBER",
  "PLATFORM_OWNER",
  "PLATFORM_ADMIN",
]);

export type AuthProvisionState = {
  hasProfile: boolean;
  hasRole: boolean;
  hasOrgAssignment: boolean;
  /** Trusted role rows — never auth.user_metadata. */
  jagPlatformOnly: boolean;
};

/** JAG-only = platform role present and no AcademyOS/Founder roles. */
export function isJagOnlyProvisionRoles(roleNames: readonly string[]): boolean {
  const names = roleNames.filter(Boolean);
  if (
    !names.some((name) => name === "PLATFORM_OWNER" || name === "PLATFORM_ADMIN")
  ) {
    return false;
  }
  return names.every((name) => JAG_ONLY_ROLE_ALLOWLIST.has(name));
}

export function needsAuthUserProvisioning(state: AuthProvisionState): boolean {
  if (!state.hasProfile || !state.hasRole) return true;
  if (state.jagPlatformOnly) return false;
  return !state.hasOrgAssignment;
}

/**
 * Invokes SECURITY DEFINER RPC that provisions the caller's auth.uid() only.
 * Safe on authenticated request paths (no service-role key).
 */
export async function ensureCurrentAuthUserProvisioned(
  supabase: AuthClient
): Promise<{ provisioned: boolean; error?: string }> {
  const { error } = await supabase.rpc("provision_current_auth_user");
  if (error) {
    return { provisioned: false, error: error.message };
  }
  return { provisioned: true };
}

export async function loadAuthProvisionState(
  supabase: AuthClient,
  userId: string
): Promise<AuthProvisionState> {
  const [profile, userRoles, assignments] = await Promise.all([
    supabase.from("users").select("id").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role_id").eq("user_id", userId),
    supabase
      .from("user_org_assignments")
      .select("id")
      .eq("user_id", userId)
      .limit(1),
  ]);

  const roleIds = userRoles.data?.map((row) => row.role_id) ?? [];
  let roleNames: string[] = [];
  if (roleIds.length > 0) {
    const { data: roleRows } = await supabase
      .from("roles")
      .select("name")
      .in("id", roleIds);
    roleNames = (roleRows ?? []).map((row) => row.name);
  }

  return {
    hasProfile: Boolean(profile.data?.id),
    hasRole: roleNames.length > 0,
    hasOrgAssignment: (assignments.data?.length ?? 0) > 0,
    jagPlatformOnly: isJagOnlyProvisionRoles(roleNames),
  };
}
