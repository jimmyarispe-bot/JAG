/**
 * Sprint 003 — Permission Engine (central authorization service).
 *
 * Application code must NEVER check roles for authorization.
 * Every authorization decision goes through authorize() or hasPermission().
 * Roles only grant permissions (via ROLE_PERMISSION_GROUPS + DB grants).
 */

import {
  CATALOG_PERMISSION_ALIASES,
  isCatalogPermission,
  resolveCatalogPermission,
  type CatalogPermission,
} from "@/lib/platform/identity/permission-catalog";
import {
  permissionsForMappedRoles,
  roleMappingGrantsPermission,
} from "@/lib/platform/identity/permission-groups";
import type { PermissionKey } from "@/lib/platform/identity/types";

/** Immutable view of effective grants used for authorization decisions. */
export type AuthzSnapshot = {
  userId: string;
  /** Identity only — never use for authorization decisions at call sites. */
  roles: readonly string[];
  /** Effective permission keys (role mapping + preloaded grants). */
  permissions: ReadonlySet<string>;
};

/** Anything that can be authorized: snapshot or context with permissions. */
export type AuthzSubject =
  | AuthzSnapshot
  | {
      permissions: readonly string[] | ReadonlySet<string>;
      roles?: readonly string[];
      userId?: string;
      id?: string;
      effectiveUserId?: string;
    };

export function buildAuthzSnapshot(
  userId: string,
  roles: readonly string[],
  extraPermissions: readonly string[] = []
): AuthzSnapshot {
  const permissions = permissionsForMappedRoles(roles);
  for (const key of extraPermissions) {
    permissions.add(key as PermissionKey);
  }
  return { userId, roles, permissions };
}

export function toAuthzSnapshot(subject: AuthzSubject): AuthzSnapshot {
  if ("permissions" in subject && subject.permissions instanceof Set && "userId" in subject && "roles" in subject) {
    const snap = subject as AuthzSnapshot;
    if (typeof snap.userId === "string" && Array.isArray(snap.roles)) {
      return snap;
    }
  }

  const permissions = subject.permissions;
  const set =
    permissions instanceof Set ? permissions : new Set(permissions ?? []);
  const roles = subject.roles ?? [];
  const userId =
    ("userId" in subject && subject.userId) ||
    ("effectiveUserId" in subject && subject.effectiveUserId) ||
    ("id" in subject && subject.id) ||
    "";

  return {
    userId,
    roles,
    permissions: set,
  };
}

/**
 * Authorize a single permission key.
 * This is the only supported authorization primitive (with hasPermission).
 * Decisions use the effective permission set only — never role names.
 */
export function authorize(
  snapshot: AuthzSnapshot,
  permission: PermissionKey | string
): boolean {
  if (snapshot.permissions.has(permission)) return true;

  // Legacy catalog aliases (SYSTEM_CONFIGURATION_ACCESS ↔ SYSTEM_ADMIN_ACCESS, etc.)
  const resolved = resolveCatalogPermission(permission);
  if (resolved && resolved !== permission && snapshot.permissions.has(resolved)) {
    return true;
  }
  if (isCatalogPermission(permission)) {
    for (const [legacy, official] of Object.entries(CATALOG_PERMISSION_ALIASES)) {
      if (official === permission && snapshot.permissions.has(legacy)) {
        return true;
      }
    }
  }

  // Mapping-only snapshots (e.g. middleware) may omit a catalog key that the
  // role matrix still grants — expand once for catalog gates.
  const catalogKey = resolved ?? (isCatalogPermission(permission) ? permission : null);
  if (catalogKey && snapshot.roles.length > 0) {
    return roleMappingGrantsPermission(snapshot.roles, catalogKey);
  }

  return false;
}

export function authorizeAny(
  snapshot: AuthzSnapshot,
  permissions: readonly (PermissionKey | string)[]
): boolean {
  return permissions.some((permission) => authorize(snapshot, permission));
}

export function authorizeAll(
  snapshot: AuthzSnapshot,
  permissions: readonly (PermissionKey | string)[]
): boolean {
  return permissions.every((permission) => authorize(snapshot, permission));
}

export function authorizeCatalog(
  snapshot: AuthzSnapshot,
  permission: CatalogPermission
): boolean {
  return authorize(snapshot, permission);
}

/**
 * Public permission check — accepts AuthzSnapshot or identity-like subjects.
 * Prefer this (or authorize) at every call site.
 */
export function hasPermission(
  subject: AuthzSubject,
  permission: PermissionKey | string
): boolean {
  return authorize(toAuthzSnapshot(subject), permission);
}

export function hasAnyPermission(
  subject: AuthzSubject,
  permissions: readonly (PermissionKey | string)[]
): boolean {
  return authorizeAny(toAuthzSnapshot(subject), permissions);
}

export function hasAllPermissions(
  subject: AuthzSubject,
  permissions: readonly (PermissionKey | string)[]
): boolean {
  return authorizeAll(toAuthzSnapshot(subject), permissions);
}
