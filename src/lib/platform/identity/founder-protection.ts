/**
 * Founder / JAG entry protection.
 *
 * Platform stewards enter via JAG_ACCESS.
 * Customer organization administrators enter via JAG_ORG_ACCESS.
 * Call sites must never check role names — use authorize()/hasPermission().
 *
 * Denied callers are redirected into AcademyOS (not left on a JAG URL).
 */

import {
  toAuthzSnapshot,
  type AuthzSnapshot,
  type AuthzSubject,
} from "@/lib/platform/identity/authorization-service";
import {
  authorizeJagWorkspaceEntry,
  canEnterJagWorkspace,
  JAG_PLATFORM_ENTRY_PERMISSION,
} from "@/lib/platform/identity/jag-authority";

/** @deprecated Prefer authorizeJagWorkspaceEntry — kept for import stability. */
export const JAG_ENTRY_PERMISSION = JAG_PLATFORM_ENTRY_PERMISSION;

/** AcademyOS home — redirect target when JAG entry is denied. */
export const ACADEMYOS_HOME_PATH = "/dashboard" as const;

/** True when the subject may enter JAG (platform or org-scoped). */
export function canEnterJag(subject: AuthzSubject): boolean {
  return canEnterJagWorkspace(subject);
}

/** Authorize JAG entry against a preloaded authz snapshot. */
export function authorizeJagEntry(snapshot: AuthzSnapshot): boolean {
  return authorizeJagWorkspaceEntry(snapshot);
}

/**
 * Evaluate JAG route protection.
 * Denied callers are sent to AcademyOS — never left on a JAG URL.
 */
export function evaluateJagProtection(subject: AuthzSubject): {
  allowed: boolean;
  redirectTo: typeof ACADEMYOS_HOME_PATH | null;
} {
  const snapshot = toAuthzSnapshot(subject);
  if (authorizeJagEntry(snapshot)) {
    return { allowed: true, redirectTo: null };
  }
  return { allowed: false, redirectTo: ACADEMYOS_HOME_PATH };
}
