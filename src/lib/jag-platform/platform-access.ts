/**
 * JAG platform access — Layer 1 identity, independent of AcademyOS membership.
 *
 * Effective JAG permissions are the intersection of a subject's granted keys
 * with the JAG_ACCESS + JAG_PLATFORM_ADMIN groups. AcademyOS roles and
 * organization membership are not part of this set.
 */

import {
  PERMISSION_GROUP_DEFINITIONS,
  permissionsForMappedRoles,
} from "@/lib/platform/identity/permission-groups";
import type { PermissionKey } from "@/lib/platform/identity/types";

/** Roles that confer JAG platform (Layer 1) access. */
export const JAG_PLATFORM_ACCESS_ROLES = [
  "FOUNDER",
  "PLATFORM_OWNER",
  "PLATFORM_ADMIN",
] as const;

export type JagPlatformAccessRole =
  (typeof JAG_PLATFORM_ACCESS_ROLES)[number];

/**
 * Role granted when adding JAG platform access to an existing person.
 * Matches FOUNDER's JAG_ACCESS + JAG_PLATFORM_ADMIN groups without
 * replacing AcademyOS roles (e.g. CEO).
 */
export const JAG_PLATFORM_GRANT_ROLE = "PLATFORM_OWNER" as const;

export const JAG_PLATFORM_USERS_PATH = "/jag/users" as const;

/** Service-role RPC — explicit args only; never user_metadata. */
export const JAG_ONLY_PROVISION_RPC = "provision_jag_only_identity" as const;

const JAG_ONLY_METADATA_PRIVILEGE_KEYS = [
  "skip_default_org_membership",
  "invite_organization_id",
  "role",
  "bootstrap_role",
] as const;

/** Display fields only — no privilege or org-selection keys. */
export function buildJagOnlyAuthMetadata(input: {
  firstName: string;
  lastName: string;
  fullName: string;
}): {
  full_name: string;
  first_name: string;
  last_name: string;
} {
  return {
    full_name: input.fullName,
    first_name: input.firstName,
    last_name: input.lastName,
  };
}

export function jagOnlyAuthMetadataHasPrivilegeSignals(
  metadata: Record<string, unknown>
): boolean {
  return JAG_ONLY_METADATA_PRIVILEGE_KEYS.some((key) =>
    Object.prototype.hasOwnProperty.call(metadata, key)
  );
}

export function isJagPlatformAccessRole(
  value: string
): value is JagPlatformAccessRole {
  return (JAG_PLATFORM_ACCESS_ROLES as readonly string[]).includes(value);
}

export function isJagPlatformUsersRoute(pathname: string): boolean {
  return (
    pathname === JAG_PLATFORM_USERS_PATH ||
    pathname.startsWith(`${JAG_PLATFORM_USERS_PATH}/`)
  );
}

/** Catalog + expanded keys that constitute JAG platform access. */
export function jagPlatformPermissionUniverse(): PermissionKey[] {
  const keys = new Set<PermissionKey>();
  for (const group of ["JAG_ACCESS", "JAG_PLATFORM_ADMIN"] as const) {
    for (const key of PERMISSION_GROUP_DEFINITIONS[group].permissions) {
      keys.add(key);
    }
  }
  return [...keys].sort();
}

/** Subject's granted keys that belong to the JAG platform universe. */
export function effectiveJagPlatformPermissions(
  roles: readonly string[]
): PermissionKey[] {
  const granted = permissionsForMappedRoles(roles);
  if (!granted.has("JAG_ACCESS") && !granted.has("JAG_PLATFORM_ADMIN")) {
    return [];
  }
  return jagPlatformPermissionUniverse().filter((key) => granted.has(key));
}

export function hasJagPlatformAccess(roles: readonly string[]): boolean {
  return permissionsForMappedRoles(roles).has("JAG_ACCESS");
}

export function jagPlatformAccessRolesFrom(
  roles: readonly string[]
): JagPlatformAccessRole[] {
  return roles.filter(isJagPlatformAccessRole);
}

export function academyOsRolesFrom(roles: readonly string[]): string[] {
  return roles.filter((role) => !isJagPlatformAccessRole(role));
}

export function jagPlatformPermissionsEqual(
  leftRoles: readonly string[],
  rightRoles: readonly string[]
): boolean {
  const left = effectiveJagPlatformPermissions(leftRoles);
  const right = effectiveJagPlatformPermissions(rightRoles);
  if (left.length !== right.length) return false;
  return left.every((key, index) => key === right[index]);
}

/** Production snapshot used by equality tests — not a live query. */
export const JIMMY_ARISPE_JAG_ROLES = ["FOUNDER"] as const;
export const STACY_KENWORTHY_ACADEMYOS_ROLES = ["CEO"] as const;
export const STACY_KENWORTHY_AFTER_JAG_GRANT_ROLES = [
  "CEO",
  "PLATFORM_OWNER",
] as const;
