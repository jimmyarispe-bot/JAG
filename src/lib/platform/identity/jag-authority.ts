/**
 * JAG authority model — platform steward vs customer organization administrator.
 *
 * Platform stewards: JAG_ACCESS (Founder / PLATFORM_OWNER).
 * Customer org admins: JAG_ORG_ACCESS only — never FOUNDER / JAG_PLATFORM_ADMIN.
 */

import {
  authorize,
  hasPermission,
  type AuthzSnapshot,
  type AuthzSubject,
} from "@/lib/platform/identity/authorization-service";

export const JAG_PLATFORM_ENTRY_PERMISSION = "JAG_ACCESS" as const;
export const JAG_ORG_ENTRY_PERMISSION = "JAG_ORG_ACCESS" as const;
export const JAG_PLATFORM_ADMIN_PERMISSION = "JAG_PLATFORM_ADMIN" as const;

export type JagAuthorityKind = "platform" | "organization";

/** True when the subject may enter any JAG surface (platform or org-scoped). */
export function canEnterJagWorkspace(subject: AuthzSubject): boolean {
  return (
    hasPermission(subject, JAG_PLATFORM_ENTRY_PERMISSION) ||
    hasPermission(subject, JAG_ORG_ENTRY_PERMISSION)
  );
}

export function authorizeJagWorkspaceEntry(snapshot: AuthzSnapshot): boolean {
  return (
    authorize(snapshot, JAG_PLATFORM_ENTRY_PERMISSION) ||
    authorize(snapshot, JAG_ORG_ENTRY_PERMISSION)
  );
}

/** Platform control-plane steward (cross-tenant). */
export function isJagPlatformSteward(snapshot: AuthzSnapshot): boolean {
  return authorize(snapshot, JAG_PLATFORM_ENTRY_PERMISSION);
}

/** Customer org administrator (must be membership-bound). */
export function isJagOrganizationOperator(snapshot: AuthzSnapshot): boolean {
  return (
    authorize(snapshot, JAG_ORG_ENTRY_PERMISSION) &&
    !authorize(snapshot, JAG_PLATFORM_ENTRY_PERMISSION)
  );
}

export function resolveJagAuthorityKind(
  snapshot: AuthzSnapshot
): JagAuthorityKind | null {
  if (isJagPlatformSteward(snapshot)) return "platform";
  if (authorize(snapshot, JAG_ORG_ENTRY_PERMISSION)) return "organization";
  return null;
}
