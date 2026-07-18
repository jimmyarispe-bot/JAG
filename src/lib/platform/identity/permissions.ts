/**
 * Permission loading + async checks.
 * Authorization decisions always go through authorize() / hasPermission().
 * Roles are used only to load/grant permissions — never as authz shortcuts.
 */

import { NextResponse } from "next/server";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  authorize,
  buildAuthzSnapshot,
  hasPermission as engineHasPermission,
} from "@/lib/platform/identity/authorization-service";
import {
  permissionsForMappedRoles,
  roleMappingGrantsPermission,
} from "@/lib/platform/identity/permission-groups";
import type { PermissionKey } from "@/lib/platform/identity/types";
import type { EduRoleName } from "@/types/database";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Used when enterprise permission tables/RPC are not deployed yet. */
const ROLE_PERMISSION_FALLBACK: Partial<Record<EduRoleName, PermissionKey[]>> = {
  CEO: ["certification.view", "certification.manage", "certification.admin"],
  FOUNDER: ["certification.view", "certification.manage", "certification.admin"],
  EXECUTIVE_DIRECTOR: ["certification.view", "certification.manage"],
  SCHOOL_LEADER: ["certification.view"],
};

function roleFallbackHasPermission(roles: string[], permissionKey: PermissionKey): boolean {
  if (roles.some((role) => ROLE_PERMISSION_FALLBACK[role as EduRoleName]?.includes(permissionKey))) {
    return true;
  }
  return roleMappingGrantsPermission(roles, permissionKey);
}

function collectRoleFallbackPermissions(roles: string[]): Set<string> {
  const allowed = new Set<string>();
  for (const role of roles) {
    for (const key of ROLE_PERMISSION_FALLBACK[role as EduRoleName] ?? []) {
      allowed.add(key);
    }
  }
  for (const key of permissionsForMappedRoles(roles)) {
    allowed.add(key);
  }
  return allowed;
}

function isMissingPermissionInfraError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    message.includes("has_permission") ||
    message.includes("platform_permissions") ||
    message.includes("platform_role_permissions") ||
    message.includes("user_role_ids")
  );
}

/** @deprecated Use hasPermission(subject, "JAG_ACCESS") — do not check roles. */
export function isFounderRole(roles: string[]): boolean {
  return engineHasPermission(buildAuthzSnapshot("", roles), "JAG_ACCESS");
}

/** @deprecated Use hasPermission(subject, "SYSTEM_ADMIN_ACCESS"). */
export function isEnterpriseAdminRole(roles: string[]): boolean {
  return engineHasPermission(
    buildAuthzSnapshot("", roles),
    "SYSTEM_ADMIN_ACCESS"
  );
}

/** Server-side permission check — goes through the permission engine. */
export async function userHasPermission(
  supabase: AuthClient,
  permissionKey: PermissionKey,
  userId?: string,
  authUserId?: string | null
): Promise<boolean> {
  const resolvedAuthUserId =
    authUserId === undefined ? (await supabase.auth.getUser()).data.user?.id : authUserId;
  const sessionUserId = userId ?? resolvedAuthUserId;
  if (!sessionUserId) return false;

  const roles = await loadUserRoleNames(supabase, sessionUserId);
  const snapshot = buildAuthzSnapshot(sessionUserId, roles);

  // Prefer mapped grants (deterministic) before RPC so role→permission is source of truth.
  if (authorize(snapshot, permissionKey)) return true;

  if (sessionUserId === resolvedAuthUserId) {
    const { data, error } = await supabase.rpc("has_permission", {
      permission_key: permissionKey,
    });
    if (!error) {
      if (data === true) return true;
      return false;
    }
    if (isMissingPermissionInfraError(error.message)) {
      return roleFallbackHasPermission(roles, permissionKey);
    }
    return false;
  }

  const roleIds = await loadExpandedRoleIds(supabase, sessionUserId);
  if (!roleIds.length) return roleFallbackHasPermission(roles, permissionKey);

  const { data: perms, error } = await supabase
    .from("platform_role_permissions")
    .select("permission_key, effect")
    .in("role_id", roleIds)
    .eq("permission_key", permissionKey);

  if (error && isMissingPermissionInfraError(error.message)) {
    return roleFallbackHasPermission(roles, permissionKey);
  }

  if (perms?.some((p) => p.effect === "deny")) return false;
  if (perms?.some((p) => p.effect === "allow")) return true;
  return roleFallbackHasPermission(roles, permissionKey);
}

export async function requirePermission(
  supabase: AuthClient,
  permissionKey: PermissionKey
): Promise<{ ok: true } | { ok: false; error: string }> {
  const allowed = await userHasPermission(supabase, permissionKey);
  if (!allowed) return { ok: false, error: "Forbidden" };
  return { ok: true };
}

/**
 * Load the effective permission set for a user.
 *
 * IMPORTANT: Must stay O(1) round-trips. Never call has_permission / userHasPermission
 * once per catalog key — that caused Vercel 504 FUNCTION_INVOCATION_TIMEOUT on every
 * dashboard navigation (≈160 keys × 2 role queries each).
 */
export async function loadUserPermissions(
  supabase: AuthClient,
  userId: string,
  _authUserId?: string | null
): Promise<Set<string>> {
  const roles = await loadUserRoleNames(supabase, userId);

  // Always start from role→permission mapping (no role-name superuser bypass).
  const mapped = permissionsForMappedRoles(roles);
  const granted = new Set<string>(mapped);

  let roleIds = await loadExpandedRoleIds(supabase, userId);
  if (!roleIds.length) {
    // user_role_ids RPC missing / empty — fall back to direct assignment ids
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", userId);
    roleIds = userRoles?.map((r) => r.role_id) ?? [];
  }

  if (!roleIds.length) {
    return collectRoleFallbackPermissions(roles);
  }

  const { data: perms, error } = await supabase
    .from("platform_role_permissions")
    .select("permission_key, effect")
    .in("role_id", roleIds);

  if (error && isMissingPermissionInfraError(error.message)) {
    return collectRoleFallbackPermissions(roles);
  }

  const denied = new Set(
    perms?.filter((p) => p.effect === "deny").map((p) => p.permission_key) ?? []
  );
  for (const p of perms ?? []) {
    if (p.effect === "allow" && !denied.has(p.permission_key)) {
      granted.add(p.permission_key);
    }
  }
  for (const key of mapped) {
    if (denied.has(key)) granted.delete(key);
  }
  return granted;
}

export async function getMissionControlModulesForUser(
  supabase: AuthClient,
  userId: string
): Promise<string[] | null> {
  const permissions = await loadUserPermissions(supabase, userId);
  const subject = { permissions, userId };

  if (!engineHasPermission(subject, "mission_control.access")) return [];

  // Broad operating access → all modules (permission-based, not role-based).
  if (
    engineHasPermission(subject, "schools.access_all") ||
    engineHasPermission(subject, "org.manage") ||
    engineHasPermission(subject, "founder.override")
  ) {
    return null;
  }

  const modules: string[] = [];
  if (
    engineHasPermission(subject, "admissions.view") ||
    engineHasPermission(subject, "admissions.manage")
  ) {
    modules.push("admissions");
  }
  if (engineHasPermission(subject, "finance.view")) modules.push("finance");
  if (engineHasPermission(subject, "hr.view") || engineHasPermission(subject, "hr.manage")) {
    modules.push("hr");
  }
  if (
    engineHasPermission(subject, "executive.intelligence") ||
    engineHasPermission(subject, "executive.dashboard")
  ) {
    modules.push("executive");
  }
  if (engineHasPermission(subject, "scholarships.view")) modules.push("scholarships");
  if (engineHasPermission(subject, "funding.view")) modules.push("state_funding");
  if (engineHasPermission(subject, "students.view")) modules.push("sis");
  if (engineHasPermission(subject, "work.view") || engineHasPermission(subject, "work.manage")) {
    modules.push("work");
  }
  return modules;
}

async function loadUserRoleNames(supabase: AuthClient, userId: string): Promise<string[]> {
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId);

  const roleIds = userRoles?.map((r) => r.role_id) ?? [];
  if (!roleIds.length) return [];

  const { data: roles } = await supabase.from("roles").select("name").in("id", roleIds);
  return roles?.map((r) => r.name) ?? [];
}

async function loadExpandedRoleIds(supabase: AuthClient, userId: string): Promise<string[]> {
  const { data } = await supabase.rpc("user_role_ids", { check_user_id: userId });
  return (data as string[] | null) ?? [];
}

export function permissionDeniedResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
