/**
 * Sprint 009 — Platform Administration.
 *
 * Hub sections for organizations, identity, subscriptions, audit, and security.
 * Section visibility and page access use the centralized authorization service
 * (authorize() / hasPermission()) — never role-name checks.
 */

import {
  hasAnyPermission,
  hasPermission,
  type AuthzSubject,
} from "@/lib/platform/identity/authorization-service";
import type { PermissionKey } from "@/lib/platform/identity/types";

export const PLATFORM_ADMINISTRATION_NAV = [
  {
    id: "organizations",
    label: "Organizations",
    description: "First-class organizations: type, owner, subscription, schools, and users",
    href: "/dashboard/admin/organizations",
    permission: "org.view" as PermissionKey,
  },
  {
    id: "users",
    label: "Users",
    description: "User directory, assignments, and access scopes",
    href: "/dashboard/admin/users",
    permission: "users.view" as PermissionKey,
  },
  {
    id: "roles",
    label: "Roles",
    description: "Official platform roles and custom role definitions",
    href: "/dashboard/admin/roles",
    permission: "roles.view" as PermissionKey,
  },
  {
    id: "permissions",
    label: "Permissions",
    description: "Permission catalog and role permission matrix",
    href: "/dashboard/admin/permissions",
    permission: "roles.view" as PermissionKey,
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    description: "Commercial subscriptions, plans, and renewals",
    href: "/dashboard/admin/subscriptions",
    permission: "SYSTEM_ADMIN_ACCESS" as PermissionKey,
  },
  {
    id: "audit_log",
    label: "Audit Log",
    description: "Security events, permission changes, and access history",
    href: "/dashboard/admin/audit",
    permission: "AUDIT_ACCESS" as PermissionKey,
  },
  {
    id: "support_access",
    label: "Support Access",
    description: "Impersonation and support-mode access controls",
    href: "/dashboard/admin/support",
    permission: "impersonate.users" as PermissionKey,
  },
  {
    id: "feature_flags",
    label: "Feature Flags",
    description: "Release flags and controlled feature rollouts",
    href: "/dashboard/admin/feature-flags",
    permission: "SYSTEM_ADMIN_ACCESS" as PermissionKey,
  },
  {
    id: "api_keys",
    label: "API Keys",
    description: "API credentials, scoped tokens, and developer keys",
    href: "/dashboard/admin/api-keys",
    permission: "SYSTEM_ADMIN_ACCESS" as PermissionKey,
  },
  {
    id: "security",
    label: "Security",
    description: "Security dashboard, MFA posture, and threat signals",
    href: "/dashboard/admin/security",
    permission: "security.view" as PermissionKey,
  },
] as const;

export type PlatformAdministrationNavId =
  (typeof PLATFORM_ADMINISTRATION_NAV)[number]["id"];

export type PlatformAdministrationNavItem =
  (typeof PLATFORM_ADMINISTRATION_NAV)[number];

/** Permissions that grant entry to the Platform Administration hub. */
export const PLATFORM_ADMINISTRATION_ENTRY_PERMISSIONS = [
  "SYSTEM_ADMIN_ACCESS",
  "USER_MANAGEMENT_ACCESS",
  "org.view",
  "users.view",
  "roles.view",
  "security.view",
  "AUDIT_ACCESS",
  "impersonate.users",
] as const satisfies readonly PermissionKey[];

export function canAccessPlatformAdministration(subject: AuthzSubject): boolean {
  return hasAnyPermission(subject, PLATFORM_ADMINISTRATION_ENTRY_PERMISSIONS);
}

export function canAccessPlatformAdminSection(
  subject: AuthzSubject,
  item: PlatformAdministrationNavItem
): boolean {
  return hasPermission(subject, item.permission);
}

export function visiblePlatformAdministrationNav(
  subject: AuthzSubject
): PlatformAdministrationNavItem[] {
  return PLATFORM_ADMINISTRATION_NAV.filter((item) =>
    canAccessPlatformAdminSection(subject, item)
  );
}

/** True for Sprint 009 Platform Administration routes. */
export function isPlatformAdministrationRoute(pathname: string): boolean {
  return pathname === "/dashboard/admin" || pathname.startsWith("/dashboard/admin/");
}
