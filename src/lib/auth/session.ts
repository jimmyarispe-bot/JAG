import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import type { EduRoleName } from "@/types/database";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { loadOrganizationBranding, resolveRoleLabel } from "@/lib/branding";
import { FALLBACK_ROLE_LABELS } from "@/lib/branding/defaults";
import {
  buildAuthzSnapshot,
  hasPermission,
} from "@/lib/platform/identity/authorization-service";

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

/** Single getUser() per React request — shared by layout, pages, and identity context. */
export const getAuthUser = cache(async (): Promise<{
  supabase: Awaited<ReturnType<typeof createAuthClient>>;
  user: User | null;
}> => {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
});

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const { supabase, user } = await getAuthUser();
  if (!user) return null;

  const [{ data: profile }, { data: userRoleRows }, branding] = await Promise.all([
    supabase.from("users").select("full_name, email").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role_id").eq("user_id", user.id),
    loadOrganizationBranding(supabase),
  ]);

  const roleIds = userRoleRows?.map((row) => row.role_id) ?? [];

  let roles: EduRoleName[] = [];
  let primaryRoleDisplayName: string | null = null;
  if (roleIds.length > 0) {
    const { data: roleRows } = await supabase
      .from("roles")
      .select("name, display_name")
      .in("id", roleIds);

    roles =
      roleRows
        ?.map((row) => row.name)
        .filter((name): name is EduRoleName => Boolean(name)) ?? [];

    primaryRoleDisplayName = roleRows?.[0]?.display_name ?? null;
  }

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
