import { cache } from "react";
import type { EduRoleName } from "@/types/database";
import { getAuthUser } from "@/lib/auth/auth-user";
import { loadOrganizationBranding, resolveRoleLabel } from "@/lib/branding";
import { FALLBACK_ROLE_LABELS } from "@/lib/branding/defaults";
import {
  buildAuthzSnapshot,
  hasPermission,
} from "@/lib/platform/identity/authorization-service";
import { loadUserRoleRows } from "@/lib/platform/identity/permissions";
import {
  ensureCurrentAuthUserProvisioned,
  loadAuthProvisionState,
  needsAuthUserProvisioning,
} from "@/lib/platform/identity/provision-auth-user";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  roles: EduRoleName[];
  primaryRole: EduRoleName | null;
  roleLabel: string;
}

export function formatRoleLabel(role: EduRoleName | null): string {
  if (!role) return "Team Member";
  return FALLBACK_ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}

/** Re-export — single getUser() per request (Sprint P002). */
export { getAuthUser } from "@/lib/auth/auth-user";

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const { supabase, user } = await getAuthUser();
  if (!user) return null;

  // Heal incomplete provisioning (pre-175 users / missed trigger side-effects)
  const provisionState = await loadAuthProvisionState(supabase, user.id);
  if (needsAuthUserProvisioning(provisionState)) {
    await ensureCurrentAuthUserProvisioned(supabase);
  }

  const [{ data: profile }, roleRows, branding] = await Promise.all([
    supabase.from("users").select("full_name, email").eq("id", user.id).maybeSingle(),
    loadUserRoleRows(user.id),
    loadOrganizationBranding(supabase),
  ]);

  const roles: EduRoleName[] = roleRows
    .map((row) => row.name)
    .filter((name): name is EduRoleName => Boolean(name));

  const primaryRoleDisplayName = roleRows[0]?.display_name ?? null;

  // Prefer executive label when the permission engine grants executive entry — never role-string gates.
  const authz = buildAuthzSnapshot(user.id, roles);
  const hasExecutiveAccess = hasPermission(authz, "JAG_ACCESS");
  const primaryRole: EduRoleName | null =
    (hasExecutiveAccess
      ? (roles.find((r) => hasPermission(buildAuthzSnapshot(user.id, [r]), "JAG_ACCESS")) ??
        roles[0])
      : roles[0]) ?? null;
  const email = profile?.email ?? user.email ?? "";
  const fullName =
    profile?.full_name?.trim() ||
    email.split("@")[0]?.replace(/\./g, " ") ||
    "User";

  const personalTitle =
    typeof user.user_metadata?.title === "string"
      ? user.user_metadata.title.trim()
      : "";

  const roleLabel = hasExecutiveAccess
    ? branding.roleTitles.FOUNDER?.trim() ||
      resolveRoleLabel(primaryRole, branding, primaryRoleDisplayName) ||
      "Executive"
    : personalTitle ||
      resolveRoleLabel(primaryRole, branding, primaryRoleDisplayName);

  return {
    id: user.id,
    email,
    fullName,
    roles,
    primaryRole,
    roleLabel,
  };
});
