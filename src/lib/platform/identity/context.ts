import { cookies } from "next/headers";
import { cache } from "react";
import { getAuthUser } from "@/lib/auth/auth-user";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { createAuthClient } from "@/lib/supabase/server-auth";
import {
  hasPermission,
  toAuthzSnapshot,
} from "@/lib/platform/identity/authorization-service";
import { loadUserPermissions } from "@/lib/platform/identity/permissions";
import type { ImpersonationState, OrgAssignment, UserPreferences } from "@/lib/platform/identity/types";
import type { PermissionKey } from "@/lib/platform/identity/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const IMPERSONATION_COOKIE = "aos_impersonate_session";

export interface IdentityContext extends SessionUser {
  effectiveUserId: string;
  permissions: string[];
  orgAssignments: OrgAssignment[];
  /** School ids the user is explicitly assigned to. Empty when unrestricted. */
  accessibleSchoolIds: string[];
  /** True when permission schools.access_all / org.manage / founder.override is granted. */
  hasUnrestrictedSchoolAccess: boolean;
  /** @deprecated Prefer hasPermission(ctx, "JAG_ACCESS") — derived from permissions. */
  isFounder: boolean;
  /** @deprecated Prefer hasPermission(ctx, "SYSTEM_ADMIN_ACCESS"). */
  isEnterpriseAdmin: boolean;
  impersonation: ImpersonationState | null;
  preferences: UserPreferences | null;
}

export const getIdentityContext = cache(async (): Promise<IdentityContext | null> => {
  const { supabase, user: authUser } = await getAuthUser();
  const sessionUser = await getSessionUser();
  if (!sessionUser || !authUser) return null;

  const cookieStore = await cookies();
  const impersonationSessionId = cookieStore.get(IMPERSONATION_COOKIE)?.value;

  let effectiveUserId = sessionUser.id;
  let impersonation: ImpersonationState | null = null;

  if (impersonationSessionId) {
    const { data: impSession } = await supabase
      .from("platform_impersonation_sessions")
      .select("id, actor_user_id, target_user_id, started_at")
      .eq("id", impersonationSessionId)
      .eq("is_active", true)
      .eq("actor_user_id", sessionUser.id)
      .maybeSingle();

    if (impSession) {
      const { data: targetUser } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", impSession.target_user_id)
        .maybeSingle();

      effectiveUserId = impSession.target_user_id;
      impersonation = {
        sessionId: impSession.id,
        actorUserId: impSession.actor_user_id,
        targetUserId: impSession.target_user_id,
        targetName: targetUser?.full_name ?? "User",
        startedAt: impSession.started_at,
      };
    }
  }

  const [permissions, orgAssignments, preferences] = await Promise.all([
    loadUserPermissions(supabase, effectiveUserId, authUser.id),
    loadOrgAssignments(supabase, effectiveUserId),
    loadPreferences(supabase, effectiveUserId),
  ]);

  const permissionList = [...permissions];
  const subject = {
    permissions: permissionList,
    roles: sessionUser.roles,
    effectiveUserId,
    id: sessionUser.id,
  };

  const hasUnrestrictedSchoolAccess =
    hasPermission(subject, "schools.access_all") ||
    hasPermission(subject, "org.manage") ||
    hasPermission(subject, "founder.override");

  const accessibleSchoolIds = hasUnrestrictedSchoolAccess
    ? []
    : [...new Set(orgAssignments.map((a) => a.school_id))];

  return {
    ...sessionUser,
    effectiveUserId,
    permissions: permissionList,
    orgAssignments,
    accessibleSchoolIds,
    hasUnrestrictedSchoolAccess,
    isFounder: hasPermission(subject, "JAG_ACCESS"),
    isEnterpriseAdmin: hasPermission(subject, "SYSTEM_ADMIN_ACCESS"),
    impersonation,
    preferences,
  };
});

const loadOrgAssignmentsCached = cache(async (userId: string): Promise<OrgAssignment[]> => {
  const supabase = await createAuthClient();
  const { data: orgRows } = await supabase
    .from("user_org_assignments")
    .select("*, schools(name)")
    .eq("user_id", userId);

  if (orgRows?.length) {
    return orgRows as OrgAssignment[];
  }

  const { data: legacy } = await supabase
    .from("user_schools")
    .select("school_id, schools(name)")
    .eq("user_id", userId);

  return (
    legacy?.map((row, i) => ({
      id: row.school_id,
      school_id: row.school_id,
      campus_id: null,
      program_id: null,
      department_id: null,
      all_campuses: true,
      all_programs: true,
      is_primary: i === 0,
      schools: (Array.isArray(row.schools) ? row.schools[0] : row.schools) as { name: string } | null,
    })) ?? []
  );
});

async function loadOrgAssignments(
  _supabase: AuthClient,
  userId: string
): Promise<OrgAssignment[]> {
  return loadOrgAssignmentsCached(userId);
}

const loadPreferencesCached = cache(async (userId: string): Promise<UserPreferences | null> => {
  const supabase = await createAuthClient();
  const { data } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data as UserPreferences | null;
});

async function loadPreferences(
  _supabase: AuthClient,
  userId: string
): Promise<UserPreferences | null> {
  return loadPreferencesCached(userId);
}

/** Permission check for identity context — delegates to the permission engine. */
export function hasIdentityPermission(
  ctx: IdentityContext,
  key: PermissionKey | string
): boolean {
  return hasPermission(toAuthzSnapshot(ctx), key);
}

export { IMPERSONATION_COOKIE };
