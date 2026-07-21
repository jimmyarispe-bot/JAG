/**
 * P1.03 — User management service (create, invite, assign, CSV).
 * Permission gates use the session client; Auth Admin API uses service role.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { requirePermission } from "@/lib/platform/identity/permissions";
import { logSecurityEvent } from "@/lib/platform/identity/security";
import { recordActivity } from "@/lib/platform/activity";
import {
  sendInvitationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "@/lib/platform/email";
import { resolveActorUserId } from "@/lib/platform/shared/context";
import {
  resolveUserManagementRole,
  resolveUserManagementStatus,
  type UserManagementRoleValue,
  type UserManagementStatus,
} from "@/lib/platform/identity/user-management-catalog";

export type ManagedUserInput = {
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  email: string;
  phone?: string | null;
  organizationId: string;
  schoolIds: string[];
  role: UserManagementRoleValue;
  department?: string | null;
  managerUserId?: string | null;
  status: UserManagementStatus;
};

export type ManagedUserResult = {
  success: true;
  userId: string;
  email: string;
  invited: boolean;
} | {
  success: false;
  error: string;
};

function fullName(input: Pick<ManagedUserInput, "firstName" | "lastName" | "preferredName">) {
  const preferred = input.preferredName?.trim();
  if (preferred) return preferred;
  return `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
}

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
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

async function assertNoError(
  step: string,
  error: { message: string } | null
): Promise<void> {
  if (error) throw new Error(`${step}: ${error.message}`);
}

async function attachMembershipAndScope(
  admin: ReturnType<typeof createServiceRoleClient>,
  input: {
    userId: string;
    email: string;
    fullName: string;
    organizationId: string;
    schoolIds: string[];
    role: UserManagementRoleValue;
    status: UserManagementStatus;
    isFounder: boolean;
  }
) {
  const roleId = await resolveRoleId(admin, input.role);
  if (!roleId) {
    throw new Error(`Role ${input.role} is not seeded in the database`);
  }

  const profile = await admin.from("users").upsert(
    {
      id: input.userId,
      email: input.email,
      full_name: input.fullName,
    },
    { onConflict: "id" }
  );
  await assertNoError("public.users profile", profile.error);

  const roleRow = await admin.from("user_roles").upsert(
    { user_id: input.userId, role_id: roleId },
    { onConflict: "user_id,role_id" }
  );
  await assertNoError("user_roles assignment", roleRow.error);

  const membershipStatus =
    input.status === "pending_invite"
      ? "invited"
      : input.status === "inactive"
        ? "suspended"
        : "active";

  const membership = await admin.from("user_organization_memberships").upsert(
    {
      organization_id: input.organizationId,
      user_id: input.userId,
      membership_role: input.isFounder ? "owner" : "member",
      status: membershipStatus,
      is_primary: true,
      permissions: input.isFounder
        ? ["org.view", "org.manage", "users.view", "users.manage"]
        : ["org.view"],
      invited_at: input.status === "pending_invite" ? new Date().toISOString() : null,
      joined_at: input.status === "active" ? new Date().toISOString() : null,
    },
    { onConflict: "organization_id,user_id" }
  );
  await assertNoError("organization membership", membership.error);

  for (const schoolId of input.schoolIds) {
    const assignment = await admin.from("user_org_assignments").upsert(
      {
        user_id: input.userId,
        school_id: schoolId,
        campus_id: null,
        program_id: null,
        department_id: null,
        all_campuses: true,
        all_programs: true,
      },
      { onConflict: "user_id,school_id,campus_id,program_id,department_id" }
    );
    await assertNoError(`school assignment (${schoolId})`, assignment.error);

    const schoolLink = await admin.from("user_schools").upsert(
      { user_id: input.userId, school_id: schoolId },
      { onConflict: "user_id,school_id", ignoreDuplicates: true }
    );
    await assertNoError(`user_schools (${schoolId})`, schoolLink.error);
  }
}

export async function createManagedUser(
  input: ManagedUserInput
): Promise<ManagedUserResult> {
  const supabase = await createAuthClient();
  const gate = await requirePermission(supabase, "users.manage");
  if (!gate.ok) return { success: false, error: gate.error };

  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) return { success: false, error: "Valid email is required" };
  if (!input.firstName.trim() || !input.lastName.trim()) {
    return { success: false, error: "First and last name are required" };
  }
  if (!input.organizationId) {
    return { success: false, error: "Organization is required" };
  }
  if (!input.role) return { success: false, error: "Role is required" };

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch {
    return {
      success: false,
      error: "Server is missing SUPABASE_SERVICE_ROLE_KEY for user provisioning",
    };
  }

  const name = fullName(input);
  const metadata = {
    full_name: name,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    preferred_name: input.preferredName?.trim() || null,
    phone: input.phone?.trim() || null,
    department: input.department?.trim() || null,
    manager_user_id: input.managerUserId || null,
    organization_id: input.organizationId,
    status: input.status,
  };

  let userId: string;
  let invited = false;

  try {
    if (input.status === "pending_invite") {
      // Create Auth user without relying on Supabase SMTP; deliver invite via Resend.
      const { data, error } = await admin.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: metadata,
      });
      if (error || !data.user) {
        return { success: false, error: error?.message ?? "Invite failed" };
      }
      userId = data.user.id;
      invited = true;

      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: { redirectTo: `${appUrl()}/login` },
      });
      if (linkError) {
        return { success: false, error: linkError.message };
      }
      const inviteLink =
        linkData.properties?.action_link ?? `${appUrl()}/login`;
      const inviteMail = await sendInvitationEmail({
        to: email,
        inviteLink,
        recipientName: name,
      });
      if (!inviteMail.success && process.env.NODE_ENV === "production") {
        return {
          success: false,
          error: inviteMail.error ?? "Failed to send invitation email",
        };
      }
    } else {
      const tempPassword = `Tmp-${crypto.randomUUID()}!aA1`;
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: metadata,
        ...(input.status === "inactive" ? { ban_duration: "876000h" } : {}),
      });
      if (error || !data.user) {
        return { success: false, error: error?.message ?? "Create user failed" };
      }
      userId = data.user.id;

      if (input.status === "active") {
        await sendWelcomeEmail({
          to: email,
          loginLink: `${appUrl()}/login`,
          recipientName: name,
        });
      }
    }

    await attachMembershipAndScope(admin, {
      userId,
      email,
      fullName: name,
      organizationId: input.organizationId,
      schoolIds: input.schoolIds,
      role: input.role,
      status: input.status,
      isFounder: input.role === "FOUNDER",
    });
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "User provisioning failed",
    };
  }

  const actorUserId = await resolveActorUserId(supabase);
  await logSecurityEvent(supabase, {
    eventType: "role_assignment",
    userId,
    summary: invited ? `Invited ${email}` : `Created user ${email}`,
    metadata: { role: input.role, status: input.status, school_ids: input.schoolIds },
  });
  await recordActivity(supabase, {
    eventType: invited ? "identity.user_invited" : "identity.user_created",
    moduleKey: "identity",
    entityType: "user",
    entityId: userId,
    title: invited ? "User invited" : "User created",
    summary: `${name} (${email}) · ${input.role}`,
    organizationId: input.organizationId,
    schoolId: input.schoolIds[0] ?? null,
    actorUserId,
    payload: { email, role: input.role, status: input.status },
    sourceTable: "users",
    sourceId: userId,
  });

  return { success: true, userId, email, invited };
}

export async function inviteManagedUsers(input: {
  emails: string[];
  role: UserManagementRoleValue;
  organizationId: string;
  schoolIds: string[];
}): Promise<{ success: true; created: number; errors: string[] } | { success: false; error: string }> {
  const results: string[] = [];
  let created = 0;
  for (const raw of input.emails) {
    const email = raw.trim().toLowerCase();
    if (!email) continue;
    const local = email.split("@")[0] ?? "User";
    const parts = local.split(/[._-]/).filter(Boolean);
    const firstName = (parts[0] ?? "Invited").replace(/^\w/, (c) => c.toUpperCase());
    const lastName = (parts[1] ?? "User").replace(/^\w/, (c) => c.toUpperCase());
    const result = await createManagedUser({
      firstName,
      lastName,
      email,
      organizationId: input.organizationId,
      schoolIds: input.schoolIds,
      role: input.role,
      status: "pending_invite",
    });
    if (result.success) created += 1;
    else results.push(`${email}: ${result.error}`);
  }
  if (created === 0 && results.length) {
    return { success: false, error: results.join("; ") };
  }
  return { success: true, created, errors: results };
}

export type CsvUserRow = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  school: string;
  department: string;
  phone: string;
  status: string;
};

export function parseUserCsv(text: string): CsvUserRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = splitCsvLine(lines[0]!).map((h) => h.toLowerCase());
  const idx = (names: string[]) =>
    header.findIndex((h) => names.some((n) => h === n || h.includes(n)));

  const iFirst = idx(["first name", "firstname", "first"]);
  const iLast = idx(["last name", "lastname", "last"]);
  const iEmail = idx(["email"]);
  const iRole = idx(["role"]);
  const iSchool = idx(["school"]);
  const iDept = idx(["department", "dept"]);
  const iPhone = idx(["phone"]);
  const iStatus = idx(["status"]);

  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    return {
      firstName: cols[iFirst] ?? "",
      lastName: cols[iLast] ?? "",
      email: cols[iEmail] ?? "",
      role: cols[iRole] ?? "",
      school: cols[iSchool] ?? "",
      department: cols[iDept] ?? "",
      phone: cols[iPhone] ?? "",
      status: cols[iStatus] ?? "Active",
    };
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export async function importUsersFromCsv(input: {
  csvText: string;
  organizationId: string;
  schools: Array<{ id: string; name: string }>;
}): Promise<{ success: true; created: number; errors: string[] } | { success: false; error: string }> {
  const rows = parseUserCsv(input.csvText);
  if (!rows.length) return { success: false, error: "No data rows found in CSV" };

  const errors: string[] = [];
  let created = 0;

  for (const row of rows) {
    const role = resolveUserManagementRole(row.role);
    if (!role) {
      errors.push(`${row.email || row.firstName}: unknown role "${row.role}"`);
      continue;
    }
    const schoolIds = input.schools
      .filter((s) => {
        if (!row.school.trim()) return false;
        return s.name.toLowerCase() === row.school.trim().toLowerCase();
      })
      .map((s) => s.id);

    const result = await createManagedUser({
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone || null,
      organizationId: input.organizationId,
      schoolIds,
      role,
      department: row.department || null,
      status: resolveUserManagementStatus(row.status),
    });
    if (result.success) created += 1;
    else errors.push(`${row.email}: ${result.error}`);
  }

  if (created === 0) {
    return { success: false, error: errors.join("; ") || "No users imported" };
  }
  return { success: true, created, errors };
}

export async function assignUserRole(input: {
  userId: string;
  role: UserManagementRoleValue;
  replace?: boolean;
}): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createAuthClient();
  const gate = await requirePermission(supabase, "users.manage");
  if (!gate.ok) return { success: false, error: gate.error };

  const { data: role } = await supabase
    .from("roles")
    .select("id")
    .eq("name", input.role)
    .maybeSingle();
  if (!role) return { success: false, error: `Role ${input.role} not found` };

  if (input.replace) {
    await supabase.from("user_roles").delete().eq("user_id", input.userId);
  }
  const { error } = await supabase.from("user_roles").upsert(
    { user_id: input.userId, role_id: role.id },
    { onConflict: "user_id,role_id" }
  );
  if (error) return { success: false, error: error.message };

  await logSecurityEvent(supabase, {
    eventType: "role_assignment",
    userId: input.userId,
    summary: `Assigned role ${input.role}`,
  });
  return { success: true };
}

export async function setUserActiveState(input: {
  userId: string;
  active: boolean;
}): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createAuthClient();
  const gate = await requirePermission(supabase, "users.manage");
  if (!gate.ok) return { success: false, error: gate.error };

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch {
    return { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const { error } = await admin.auth.admin.updateUserById(input.userId, {
    ban_duration: input.active ? "none" : "876000h",
    user_metadata: {
      status: input.active ? "active" : "inactive",
    },
  });
  if (error) return { success: false, error: error.message };

  await admin
    .from("user_organization_memberships")
    .update({ status: input.active ? "active" : "suspended" })
    .eq("user_id", input.userId);

  await logSecurityEvent(supabase, {
    eventType: "permission_change",
    userId: input.userId,
    summary: input.active ? "User activated" : "User deactivated",
  });
  return { success: true };
}

export async function resetUserPassword(userId: string): Promise<
  { success: true } | { success: false; error: string }
> {
  const supabase = await createAuthClient();
  const gate = await requirePermission(supabase, "users.manage");
  if (!gate.ok) return { success: false, error: gate.error };

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch {
    return { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError || !userData.user?.email) {
    return { success: false, error: userError?.message ?? "User not found" };
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: userData.user.email,
    options: { redirectTo: `${appUrl()}/login` },
  });
  if (linkError) return { success: false, error: linkError.message };

  const link =
    linkData.properties?.action_link ??
    `${appUrl()}/login`;

  const emailResult = await sendPasswordResetEmail({
    to: userData.user.email,
    resetLink: link,
    recipientName:
      (userData.user.user_metadata?.full_name as string | undefined) ?? undefined,
  });

  if (!emailResult.success && process.env.NODE_ENV === "production") {
    return { success: false, error: emailResult.error ?? "Failed to send reset email" };
  }

  await logSecurityEvent(supabase, {
    eventType: "sensitive_access",
    userId,
    summary: `Password reset link issued for ${userData.user.email}`,
  });
  return { success: true };
}

export async function deleteManagedUser(userId: string): Promise<
  { success: true } | { success: false; error: string }
> {
  const supabase = await createAuthClient();
  const gate = await requirePermission(supabase, "users.manage");
  if (!gate.ok) return { success: false, error: gate.error };

  const founderGate = await requirePermission(supabase, "users.manage");
  // Founder-only delete: check FOUNDER role via has_role through permissions context
  const { data: roles } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "");
  const isFounder = (roles ?? []).some((row) => {
    const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
    return (role as { name?: string } | null)?.name === "FOUNDER";
  });
  if (!isFounder) {
    return { success: false, error: "Only Founders can delete users" };
  }
  void founderGate;

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch {
    return { success: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { success: false, error: error.message };

  await admin.from("user_roles").delete().eq("user_id", userId);
  await admin.from("user_schools").delete().eq("user_id", userId);
  await admin.from("user_org_assignments").delete().eq("user_id", userId);
  await admin.from("user_organization_memberships").delete().eq("user_id", userId);
  await admin.from("users").delete().eq("id", userId);

  await logSecurityEvent(supabase, {
    eventType: "role_removal",
    userId,
    summary: "User deleted by Founder",
  });
  return { success: true };
}
