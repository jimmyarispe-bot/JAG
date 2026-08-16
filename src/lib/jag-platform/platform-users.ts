/**
 * JAG platform user management — Layer 1 only.
 * Never writes user_organization_memberships, user_org_assignments, or user_schools.
 * Never uses /dashboard/admin/users or JAG_ORG_STAFF.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { requirePermission } from "@/lib/platform/identity/permissions";
import { logSecurityEvent } from "@/lib/platform/identity/security";
import {
  academyOsRolesFrom,
  buildJagOnlyAuthMetadata,
  effectiveJagPlatformPermissions,
  hasJagPlatformAccess,
  isJagPlatformAccessRole,
  jagPlatformAccessRolesFrom,
  JAG_ONLY_PROVISION_RPC,
  JAG_PLATFORM_GRANT_ROLE,
  type JagPlatformAccessRole,
} from "@/lib/jag-platform/platform-access";

export type JagPlatformUserLayer = {
  readonly jag: {
    readonly active: boolean;
    readonly roles: readonly string[];
    readonly permissions: readonly string[];
  };
  readonly academyOs: {
    readonly active: boolean;
    readonly roles: readonly string[];
    readonly organizations: readonly {
      readonly id: string;
      readonly name: string;
      readonly slug: string;
      readonly membershipRole: string;
      readonly status: string;
    }[];
    readonly schools: readonly string[];
  };
};

export type JagPlatformDirectoryUser = {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly layers: JagPlatformUserLayer;
};

export type JagPlatformUserResult =
  | { success: true; userId: string; created: boolean }
  | { success: false; error: string };

async function requireJagPlatformAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
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
  return { ok: true };
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

async function loadUserRoles(
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

async function loadLayers(
  admin: ReturnType<typeof createServiceRoleClient>,
  userId: string
): Promise<JagPlatformUserLayer> {
  const roles = await loadUserRoles(admin, userId);
  const { data: memberships } = await admin
    .from("user_organization_memberships")
    .select("organization_id, membership_role, status, org_organizations(name, slug)")
    .eq("user_id", userId);
  const { data: assignments } = await admin
    .from("user_org_assignments")
    .select("schools(name)")
    .eq("user_id", userId);

  const organizations = (memberships ?? []).map((row) => {
    const org = Array.isArray(row.org_organizations)
      ? row.org_organizations[0]
      : row.org_organizations;
    return {
      id: row.organization_id as string,
      name: (org as { name?: string } | null)?.name ?? "Organization",
      slug: (org as { slug?: string } | null)?.slug ?? "",
      membershipRole: row.membership_role as string,
      status: row.status as string,
    };
  });

  const schools = (assignments ?? [])
    .map((row) => {
      const school = Array.isArray(row.schools) ? row.schools[0] : row.schools;
      return (school as { name?: string } | null)?.name;
    })
    .filter((name): name is string => Boolean(name));

  return {
    jag: {
      active: hasJagPlatformAccess(roles),
      roles: jagPlatformAccessRolesFrom(roles),
      permissions: effectiveJagPlatformPermissions(roles),
    },
    academyOs: {
      active: organizations.some((org) => org.status === "active"),
      roles: academyOsRolesFrom(roles),
      organizations,
      schools,
    },
  };
}

export async function listJagPlatformUsers(): Promise<
  | { success: true; users: JagPlatformDirectoryUser[] }
  | { success: false; error: string }
> {
  const gate = await requireJagPlatformAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = adminClient();
  } catch {
    return { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const { data: roleRows } = await admin
    .from("roles")
    .select("id, name")
    .in("name", ["FOUNDER", "PLATFORM_OWNER", "PLATFORM_ADMIN"]);
  const roleIds = (roleRows ?? []).map((row) => row.id);
  if (!roleIds.length) return { success: true, users: [] };

  const { data: assignments } = await admin
    .from("user_roles")
    .select("user_id")
    .in("role_id", roleIds);
  const userIds = [...new Set((assignments ?? []).map((row) => row.user_id))];
  if (!userIds.length) return { success: true, users: [] };

  const { data: users } = await admin
    .from("users")
    .select("id, email, full_name, display_name, first_name, last_name")
    .in("id", userIds)
    .order("full_name");

  const directory: JagPlatformDirectoryUser[] = [];
  for (const user of users ?? []) {
    const layers = await loadLayers(admin, user.id);
    directory.push({
      id: user.id,
      email: user.email,
      displayName:
        user.display_name?.trim() ||
        user.full_name?.trim() ||
        `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
        user.email,
      layers,
    });
  }
  return { success: true, users: directory };
}

export async function inspectJagPlatformUser(
  userId: string
): Promise<
  | { success: true; user: JagPlatformDirectoryUser }
  | { success: false; error: string }
> {
  const gate = await requireJagPlatformAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = adminClient();
  } catch {
    return { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const { data: user } = await admin
    .from("users")
    .select("id, email, full_name, display_name, first_name, last_name")
    .eq("id", userId)
    .maybeSingle();
  if (!user) return { success: false, error: "User not found" };

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      displayName:
        user.display_name?.trim() ||
        user.full_name?.trim() ||
        `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
        user.email,
      layers: await loadLayers(admin, user.id),
    },
  };
}

/**
 * Grant JAG platform access to an existing identity.
 * Inserts user_roles only. Does not create auth users or touch AcademyOS scope.
 */
export async function grantJagPlatformAccess(input: {
  userId: string;
  role?: JagPlatformAccessRole;
}): Promise<JagPlatformUserResult> {
  const gate = await requireJagPlatformAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const role = input.role ?? JAG_PLATFORM_GRANT_ROLE;
  if (role === "FOUNDER") {
    return { success: false, error: "FOUNDER cannot be assigned from JAG platform users" };
  }
  if (!isJagPlatformAccessRole(role)) {
    return { success: false, error: "Select a JAG platform role" };
  }

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = adminClient();
  } catch {
    return { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const { data: existing } = await admin
    .from("users")
    .select("id, email")
    .eq("id", input.userId)
    .maybeSingle();
  if (!existing) return { success: false, error: "User not found" };

  const roleId = await resolveRoleId(admin, role);
  if (!roleId) return { success: false, error: `Role ${role} is not seeded` };

  const { error } = await admin.from("user_roles").upsert(
    { user_id: input.userId, role_id: roleId },
    { onConflict: "user_id,role_id" }
  );
  if (error) return { success: false, error: error.message };

  const supabase = await createAuthClient();
  await logSecurityEvent(supabase, {
    eventType: "role_assignment",
    userId: input.userId,
    summary: `Granted JAG platform access (${role})`,
    metadata: { jag_platform_only: true, role },
  });

  return { success: true, userId: input.userId, created: false };
}

/**
 * Revoke JAG platform access roles only. Never removes FOUNDER, AcademyOS roles,
 * memberships, or school assignments.
 */
export async function revokeJagPlatformAccess(input: {
  userId: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const gate = await requireJagPlatformAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = adminClient();
  } catch {
    return { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const roles = await loadUserRoles(admin, input.userId);
  if (roles.includes("FOUNDER") && !roles.includes("PLATFORM_OWNER") && !roles.includes("PLATFORM_ADMIN")) {
    return {
      success: false,
      error: "Cannot revoke JAG access from a FOUNDER-only identity here",
    };
  }

  const { data: roleRows } = await admin
    .from("roles")
    .select("id")
    .in("name", ["PLATFORM_OWNER", "PLATFORM_ADMIN"]);
  const roleIds = (roleRows ?? []).map((row) => row.id);
  if (roleIds.length) {
    const { error } = await admin
      .from("user_roles")
      .delete()
      .eq("user_id", input.userId)
      .in("role_id", roleIds);
    if (error) return { success: false, error: error.message };
  }

  const supabase = await createAuthClient();
  await logSecurityEvent(supabase, {
    eventType: "role_removal",
    userId: input.userId,
    summary: "Revoked JAG platform access",
    metadata: { jag_platform_only: true },
  });
  return { success: true };
}

function isMissingJagOnlyProvisionRpc(message: string | undefined): boolean {
  const text = (message ?? "").toLowerCase();
  return (
    text.includes(JAG_ONLY_PROVISION_RPC) &&
    (text.includes("does not exist") || text.includes("42883"))
  );
}

async function finalizeNewJagOnlyIdentity(
  admin: ReturnType<typeof createServiceRoleClient>,
  input: {
    userId: string;
    email: string;
    fullName: string;
    firstName: string;
    lastName: string;
    role: JagPlatformAccessRole;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error: rpcError } = await admin.rpc(JAG_ONLY_PROVISION_RPC, {
    p_user_id: input.userId,
    p_role: input.role,
    p_strip_default_org: true,
  });

  if (!rpcError) return { ok: true };
  if (!isMissingJagOnlyProvisionRpc(rpcError.message)) {
    return { ok: false, error: rpcError.message };
  }

  // Migration 224 not applied yet — authorized new-user cleanup only.
  await admin.from("users").upsert(
    {
      id: input.userId,
      email: input.email,
      full_name: input.fullName,
      display_name: input.fullName,
      first_name: input.firstName,
      last_name: input.lastName,
    },
    { onConflict: "id" }
  );

  const roleId = await resolveRoleId(admin, input.role);
  if (!roleId) return { ok: false, error: `Role ${input.role} is not seeded` };
  const { error: roleError } = await admin.from("user_roles").upsert(
    { user_id: input.userId, role_id: roleId },
    { onConflict: "user_id,role_id" }
  );
  if (roleError) return { ok: false, error: roleError.message };

  await admin
    .from("user_organization_memberships")
    .delete()
    .eq("user_id", input.userId);
  await admin.from("user_org_assignments").delete().eq("user_id", input.userId);
  await admin.from("user_schools").delete().eq("user_id", input.userId);

  const { data: defaultRole } = await admin
    .from("roles")
    .select("id")
    .eq("name", "TEAM_MEMBER")
    .maybeSingle();
  if (defaultRole?.id) {
    await admin
      .from("user_roles")
      .delete()
      .eq("user_id", input.userId)
      .eq("role_id", defaultRole.id);
  }
  return { ok: true };
}

export async function provisionJagPlatformUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  role?: JagPlatformAccessRole;
}): Promise<JagPlatformUserResult> {
  const gate = await requireJagPlatformAdmin();
  if (!gate.ok) return { success: false, error: gate.error };

  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const role = input.role ?? JAG_PLATFORM_GRANT_ROLE;
  if (!email.includes("@")) return { success: false, error: "Valid email is required" };
  if (!firstName || !lastName) {
    return { success: false, error: "First and last name are required" };
  }
  if (role === "FOUNDER") {
    return { success: false, error: "FOUNDER cannot be assigned from JAG platform users" };
  }

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = adminClient();
  } catch {
    return { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const { data: existingProfile } = await admin
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existingProfile?.id) {
    return grantJagPlatformAccess({ userId: existingProfile.id, role });
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: buildJagOnlyAuthMetadata({
      firstName,
      lastName,
      fullName,
    }),
  });
  if (error || !data.user) {
    const already =
      error?.message?.toLowerCase().includes("already") ||
      error?.message?.toLowerCase().includes("registered");
    if (already) {
      const { data: retry } = await admin
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (retry?.id) return grantJagPlatformAccess({ userId: retry.id, role });
    }
    return { success: false, error: error?.message ?? "Create user failed" };
  }

  const userId = data.user.id;
  const finalized = await finalizeNewJagOnlyIdentity(admin, {
    userId,
    email,
    fullName,
    firstName,
    lastName,
    role,
  });
  if (!finalized.ok) return { success: false, error: finalized.error };

  const supabase = await createAuthClient();
  await logSecurityEvent(supabase, {
    eventType: "role_assignment",
    userId,
    summary: `Provisioned JAG-only platform user ${email}`,
    metadata: { jag_platform_only: true, role, trusted_rpc: JAG_ONLY_PROVISION_RPC },
  });

  return { success: true, userId, created: true };
}
