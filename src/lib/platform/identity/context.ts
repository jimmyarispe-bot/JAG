import { cookies } from "next/headers";
import { cache } from "react";
import { getAuthUser, getSessionUser, type SessionUser } from "@/lib/auth/session";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { loadUserPermissions } from "@/lib/platform/identity/permissions";
import type { ImpersonationState, OrgAssignment, UserPreferences } from "@/lib/platform/identity/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const IMPERSONATION_COOKIE = "aos_impersonate_session";

export interface IdentityContext extends SessionUser {
  effectiveUserId: string;
  permissions: string[];
  orgAssignments: OrgAssignment[];
  /** School ids the user is explicitly assigned to. Empty when unrestricted. */
  accessibleSchoolIds: string[];
  /** True for CEO/Founder/Executive Director — may access any school. */
  hasUnrestrictedSchoolAccess: boolean;
  isFounder: boolean;
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

  const { accessibleSchoolIds, hasUnrestrictedSchoolAccess } = resolveSchoolAccess(
    sessionUser,
    orgAssignments
  );
  const effectiveRoles = sessionUser.roles;

  return {
    ...sessionUser,
    effectiveUserId,
    permissions: [...permissions],
    orgAssignments,
    accessibleSchoolIds,
    hasUnrestrictedSchoolAccess,
    isFounder: effectiveRoles.includes("FOUNDER"),
    isEnterpriseAdmin: effectiveRoles.some((r) =>
      ["FOUNDER", "CEO", "EXECUTIVE_DIRECTOR"].includes(r)
    ),
    impersonation,
    preferences,
  };
});

async function loadOrgAssignments(
  supabase: AuthClient,
  userId: string
): Promise<OrgAssignment[]> {
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
}

async function loadPreferences(
  supabase: AuthClient,
  userId: string
): Promise<UserPreferences | null> {
  const { data } = await supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle();
  return data as UserPreferences | null;
}

function resolveSchoolAccess(
  sessionUser: SessionUser,
  assignments: OrgAssignment[]
): { accessibleSchoolIds: string[]; hasUnrestrictedSchoolAccess: boolean } {
  if (
    sessionUser.roles.includes("CEO") ||
    sessionUser.roles.includes("FOUNDER") ||
    sessionUser.roles.includes("EXECUTIVE_DIRECTOR")
  ) {
    return { accessibleSchoolIds: [], hasUnrestrictedSchoolAccess: true };
  }
  return {
    accessibleSchoolIds: [...new Set(assignments.map((a) => a.school_id))],
    hasUnrestrictedSchoolAccess: false,
  };
}

export function hasIdentityPermission(ctx: IdentityContext, key: string): boolean {
  return ctx.permissions.includes(key);
}

export { IMPERSONATION_COOKIE };
