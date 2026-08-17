/**
 * JAG platform user administration — edit, deactivate, reactivate, resend setup.
 * Layer 1 only. Never writes user_organization_memberships, user_org_assignments,
 * or user_schools.
 *
 * Deactivation is reversible and non-destructive: the auth identity is banned and
 * stamped with `jag_deactivated_at` in user_metadata. Roles, grants and
 * platform_security_events rows are left intact so audit history stays
 * referentially complete. Nothing here deletes an auth user or a profile row.
 */

import { JAG_PLATFORM_HOME_PATH } from "@/lib/jag-platform/auth";
import { isJagPlatformAccessRole } from "@/lib/jag-platform/platform-access";
import { requestPasswordResetViaAuthEmail } from "@/lib/platform/auth-email";
import { getAdminAuthenticationService } from "@/lib/platform/authentication";
import { requirePermission } from "@/lib/platform/identity/permissions";
import { logSecurityEvent } from "@/lib/platform/identity/security";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import {
  isJagAssignableRole,
  JAG_ASSIGNABLE_ROLES,
  JAG_DEACTIVATED_METADATA_KEY,
  type JagPlatformUserStatus,
} from "@/lib/jag-platform/platform-user-admin-shared";

export type { JagPlatformUserStatus };

type Failure = { success: false; error: string };
type Success = { success: true };

// ---------------------------------------------------------------------------
// Guards / helpers
// ---------------------------------------------------------------------------

async function requireJagPlatformAdminActor(): Promise<
  { ok: true; actorUserId: string | null } | { ok: false; error: string }
> {
  const supabase = await createAuthClient();
  const gate = await requirePermission(supabase, "JAG_PLATFORM_ADMIN");
  if (!gate.ok) {
    return { ok: false, error: "JAG platform administrator access required" };
  }
  const access = await requirePermission(supabase, "JAG_ACCESS");
  if (!access.ok) {
    return { ok: false, error: "JAG platform administrator access required" };
  }
  const { data } = await supabase.auth.getUser();
  return { ok: true, actorUserId: data.user?.id ?? null };
}

function adminClient() {
  return createServiceRoleClient();
}

async function resolveRoleId(
  admin: ReturnType<typeof createServiceRoleClient>,
  roleName: string
): Promise<string | null> {
  const { data } = await admin
    .from("roles")
    .select("id")
    .eq("name", roleName)
    .maybeSingle();
  return data?.id ?? null;
}

async function loadRoleNames(
  admin: ReturnType<typeof createServiceRoleClient>,
  userId: string
): Promise<string[]> {
  const { data } = await admin
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId);
  return (data ?? [])
    .map((row) => {
      const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
      return (role as { name?: string } | null)?.name;
    })
    .filter((name): name is string => Boolean(name));
}

/** FOUNDER identities are managed outside this screen and are never mutated here. */
function isFounderOnlyProtected(roles: readonly string[]): boolean {
  return roles.includes("FOUNDER");
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

/**
 * Read deactivation status for the given identities.
 * Never throws — a lookup failure degrades to "active" so the directory
 * still renders.
 */
export async function listJagPlatformUserStatuses(
  userIds: readonly string[]
): Promise<readonly JagPlatformUserStatus[]> {
  const gate = await requireJagPlatformAdminActor();
  if (!gate.ok) return [];
  if (!userIds.length) return [];

  const authAdmin = getAdminAuthenticationService();
  const statuses = await Promise.all(
    userIds.map(async (userId): Promise<JagPlatformUserStatus> => {
      try {
        const result = await authAdmin.getUserById(userId);
        const raw = result.ok
          ? result.data?.userMetadata?.[JAG_DEACTIVATED_METADATA_KEY]
          : null;
        return {
          userId,
          deactivatedAt: typeof raw === "string" && raw.trim() ? raw : null,
        };
      } catch {
        return { userId, deactivatedAt: null };
      }
    })
  );
  return statuses;
}

// ---------------------------------------------------------------------------
// Edit
// ---------------------------------------------------------------------------

/**
 * Update a JAG platform identity's display name, JAG role and/or email.
 * Every field is optional — only supplied fields are written.
 *
 * Email changes rewrite the login identity and the recovery-email lookup key,
 * so the auth record and the profile row are kept in lockstep.
 */
export async function updateJagPlatformUser(input: {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}): Promise<Success | Failure> {
  const gate = await requireJagPlatformAdminActor();
  if (!gate.ok) return { success: false, error: gate.error };

  const userId = input.userId.trim();
  if (!userId) return { success: false, error: "User is required" };

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = adminClient();
  } catch {
    return { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const { data: profile } = await admin
    .from("users")
    .select("id, email, first_name, last_name")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return { success: false, error: "User not found" };

  const roles = await loadRoleNames(admin, userId);
  const changed: string[] = [];

  // --- Role -----------------------------------------------------------------
  const requestedRole = input.role?.trim();
  if (requestedRole) {
    if (!isJagPlatformAccessRole(requestedRole)) {
      return { success: false, error: "Select a JAG platform role" };
    }
    if (requestedRole === "FOUNDER") {
      return {
        success: false,
        error: "FOUNDER cannot be assigned from JAG platform users",
      };
    }
    if (isFounderOnlyProtected(roles)) {
      return {
        success: false,
        error: "FOUNDER identities cannot be re-roled from this screen",
      };
    }
    if (!isJagAssignableRole(requestedRole)) {
      return { success: false, error: "Select a JAG platform role" };
    }

    const roleId = await resolveRoleId(admin, requestedRole);
    if (!roleId) {
      return { success: false, error: `Role ${requestedRole} is not seeded` };
    }
    const { error: upsertError } = await admin
      .from("user_roles")
      .upsert(
        { user_id: userId, role_id: roleId },
        { onConflict: "user_id,role_id" }
      );
    if (upsertError) return { success: false, error: upsertError.message };

    const superseded = JAG_ASSIGNABLE_ROLES.filter((r) => r !== requestedRole);
    if (superseded.length) {
      const { data: supersededRows } = await admin
        .from("roles")
        .select("id")
        .in("name", superseded as unknown as string[]);
      const supersededIds = (supersededRows ?? []).map((row) => row.id);
      if (supersededIds.length) {
        await admin
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .in("role_id", supersededIds);
      }
    }
    changed.push(`role=${requestedRole}`);
  }

  // --- Name -----------------------------------------------------------------
  const firstName = input.firstName?.trim();
  const lastName = input.lastName?.trim();
  const nameTouched = firstName !== undefined || lastName !== undefined;
  const nextFirst = firstName ?? profile.first_name ?? "";
  const nextLast = lastName ?? profile.last_name ?? "";
  const fullName = `${nextFirst} ${nextLast}`.trim();

  if (nameTouched) {
    if (!nextFirst || !nextLast) {
      return { success: false, error: "First and last name are required" };
    }
    const { error: nameError } = await admin
      .from("users")
      .update({
        first_name: nextFirst,
        last_name: nextLast,
        full_name: fullName,
        display_name: fullName,
      })
      .eq("id", userId);
    if (nameError) return { success: false, error: nameError.message };
    changed.push("name");
  }

  // --- Email ----------------------------------------------------------------
  const email = input.email?.trim().toLowerCase();
  const emailTouched = Boolean(email) && email !== profile.email?.toLowerCase();

  if (emailTouched && email) {
    if (!email.includes("@")) {
      return { success: false, error: "Valid email is required" };
    }
    const { data: clash } = await admin
      .from("users")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (clash?.id && clash.id !== userId) {
      return { success: false, error: "That email is already in use" };
    }

    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    });
    if (authError) return { success: false, error: authError.message };

    const { error: profileError } = await admin
      .from("users")
      .update({ email })
      .eq("id", userId);
    if (profileError) return { success: false, error: profileError.message };
    changed.push("email");
  }

  // --- Auth display metadata ------------------------------------------------
  if (nameTouched) {
    await getAdminAuthenticationService().updateMetadata(userId, {
      full_name: fullName,
      first_name: nextFirst,
      last_name: nextLast,
    });
  }

  if (!changed.length) return { success: true };

  const supabase = await createAuthClient();
  await logSecurityEvent(supabase, {
    eventType: "permission_change",
    userId,
    actorUserId: gate.actorUserId ?? undefined,
    summary: `Updated JAG platform user (${changed.join(", ")})`,
    metadata: { jag_platform_only: true, fields: changed },
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Deactivate / reactivate
// ---------------------------------------------------------------------------

/**
 * Soft delete. Bans the auth identity so sign-in is refused and stamps
 * `jag_deactivated_at`. Roles, profile and audit rows are preserved.
 */
export async function deactivateJagPlatformUser(input: {
  userId: string;
}): Promise<Success | Failure> {
  const gate = await requireJagPlatformAdminActor();
  if (!gate.ok) return { success: false, error: gate.error };

  const userId = input.userId.trim();
  if (!userId) return { success: false, error: "User is required" };
  if (gate.actorUserId && gate.actorUserId === userId) {
    return { success: false, error: "You cannot deactivate your own account" };
  }

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = adminClient();
  } catch {
    return { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const { data: profile } = await admin
    .from("users")
    .select("id, email")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return { success: false, error: "User not found" };

  const roles = await loadRoleNames(admin, userId);
  if (isFounderOnlyProtected(roles)) {
    return {
      success: false,
      error: "FOUNDER identities cannot be deactivated from this screen",
    };
  }

  const deactivatedAt = new Date().toISOString();
  const banned = await getAdminAuthenticationService().setUserBanned(
    userId,
    true,
    { [JAG_DEACTIVATED_METADATA_KEY]: deactivatedAt }
  );
  if (!banned.ok) return { success: false, error: banned.error };

  const supabase = await createAuthClient();
  await logSecurityEvent(supabase, {
    eventType: "role_removal",
    userId,
    actorUserId: gate.actorUserId ?? undefined,
    summary: `Deactivated JAG platform user ${profile.email}`,
    metadata: {
      jag_platform_only: true,
      reversible: true,
      deactivated_at: deactivatedAt,
    },
  });

  return { success: true };
}

/** Undo {@link deactivateJagPlatformUser}. Clears the ban and the stamp. */
export async function reactivateJagPlatformUser(input: {
  userId: string;
}): Promise<Success | Failure> {
  const gate = await requireJagPlatformAdminActor();
  if (!gate.ok) return { success: false, error: gate.error };

  const userId = input.userId.trim();
  if (!userId) return { success: false, error: "User is required" };

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = adminClient();
  } catch {
    return { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const { data: profile } = await admin
    .from("users")
    .select("id, email")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return { success: false, error: "User not found" };

  const cleared = await getAdminAuthenticationService().setUserBanned(
    userId,
    false,
    { [JAG_DEACTIVATED_METADATA_KEY]: null }
  );
  if (!cleared.ok) return { success: false, error: cleared.error };

  const supabase = await createAuthClient();
  await logSecurityEvent(supabase, {
    eventType: "role_assignment",
    userId,
    actorUserId: gate.actorUserId ?? undefined,
    summary: `Reactivated JAG platform user ${profile.email}`,
    metadata: { jag_platform_only: true },
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Resend setup email
// ---------------------------------------------------------------------------

/**
 * Re-send the JAG-branded password-setup email.
 * so the administrator gets a truthful delivered / not-delivered answer.
 */
export async function resendJagPlatformSetupEmail(input: {
  userId: string;
  originHint?: string;
}): Promise<Success | Failure> {
  const gate = await requireJagPlatformAdminActor();
  if (!gate.ok) return { success: false, error: gate.error };

  const userId = input.userId.trim();
  if (!userId) return { success: false, error: "User is required" };

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = adminClient();
  } catch {
    return { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const { data: profile } = await admin
    .from("users")
    .select("id, email")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.email) return { success: false, error: "User not found" };

  const result = await requestPasswordResetViaAuthEmail({
    email: profile.email,
    next: JAG_PLATFORM_HOME_PATH,
    ...(input.originHint ? { originHint: input.originHint } : {}),
    brandProfile: "jag",
  });

  if (!result.ok) {
    console.error("[jag-platform-users] resend setup email failed");
    return { success: false, error: result.error };
  }

  const supabase = await createAuthClient();
  await logSecurityEvent(supabase, {
    eventType: "sensitive_access",
    userId,
    actorUserId: gate.actorUserId ?? undefined,
    summary: `Re-sent JAG platform setup email to ${profile.email}`,
    metadata: { jag_platform_only: true },
  });

  return { success: true };
}
