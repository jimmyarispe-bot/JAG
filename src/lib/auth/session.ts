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
import { pickPrimaryRole } from "@/lib/platform/identity/role-priority";
import {
  ensureCurrentAuthUserProvisioned,
  loadAuthProvisionState,
  needsAuthUserProvisioning,
} from "@/lib/platform/identity/provision-auth-user";
import { resolvePersonalDisplayTitle } from "@/lib/auth/display-title";

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
    supabase
      .from("users")
      .select("full_name, email, display_name, title")
      .eq("id", user.id)
      .maybeSingle(),
    loadUserRoleRows(user.id),
    loadOrganizationBranding(supabase),
  ]);

  const roles: EduRoleName[] = roleRows
    .map((row) => row.name)
    .filter((name): name is EduRoleName => Boolean(name));

  // Prefer founder when JAG_ACCESS is present; otherwise highest-priority operating role
  // (avoids TEAM_MEMBER from the auth trigger winning over EXECUTIVE_DIRECTOR).
  const authz = buildAuthzSnapshot(user.id, roles);
  const hasExecutiveAccess = hasPermission(authz, "JAG_ACCESS");
  const primaryRole: EduRoleName | null = hasExecutiveAccess
    ? (roles.find((r) => hasPermission(buildAuthzSnapshot(user.id, [r]), "JAG_ACCESS")) ??
      pickPrimaryRole(roles))
    : pickPrimaryRole(roles);
  const primaryRoleDisplayName =
    roleRows.find((row) => row.name === primaryRole)?.display_name ??
    roleRows[0]?.display_name ??
    null;
  const email = profile?.email ?? user.email ?? "";
  const metadataDisplayName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name.trim()
      : typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name.trim()
        : "";
  const fullName =
    profile?.display_name?.trim() ||
    profile?.full_name?.trim() ||
    metadataDisplayName ||
    email.split("@")[0]?.replace(/\./g, " ") ||
    "User";

  const metadataTitle =
    typeof user.user_metadata?.title === "string"
      ? user.user_metadata.title.trim()
      : "";
  // Persisted personal job title wins over role branding (Founder vs Founder & CEO).
  const personalTitle =
    profile?.title?.trim() ||
    resolvePersonalDisplayTitle(email, metadataTitle) ||
    metadataTitle;

  const roleLabel =
    personalTitle ||
    (hasExecutiveAccess
      ? branding.roleTitles.FOUNDER?.trim() ||
        resolveRoleLabel(primaryRole, branding, primaryRoleDisplayName) ||
        "Executive"
      : resolveRoleLabel(primaryRole, branding, primaryRoleDisplayName));

  return {
    id: user.id,
    email,
    fullName,
    roles,
    primaryRole,
    roleLabel,
  };
});
