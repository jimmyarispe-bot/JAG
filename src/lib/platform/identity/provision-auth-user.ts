/**
 * Server-side auth user provisioning safety net.
 * DB trigger (175) is the primary path; this heals sessions that predate it
 * or missed role/org assignment rows.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export type AuthProvisionState = {
  hasProfile: boolean;
  hasRole: boolean;
  hasOrgAssignment: boolean;
};

export function needsAuthUserProvisioning(state: AuthProvisionState): boolean {
  return !state.hasProfile || !state.hasRole || !state.hasOrgAssignment;
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
  const [profile, roles, assignments] = await Promise.all([
    supabase.from("users").select("id").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role_id").eq("user_id", userId).limit(1),
    supabase
      .from("user_org_assignments")
      .select("id")
      .eq("user_id", userId)
      .limit(1),
  ]);

  return {
    hasProfile: Boolean(profile.data?.id),
    hasRole: (roles.data?.length ?? 0) > 0,
    hasOrgAssignment: (assignments.data?.length ?? 0) > 0,
  };
}
