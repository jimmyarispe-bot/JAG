/**
 * Sprint 007 — Founder Protection.
 *
 * Only identities with JAG_ACCESS may enter JAG.
 * JAG_ACCESS is granted solely via role→permission mapping (FOUNDER).
 * Call sites must never check role names — use authorize()/hasPermission().
 *
 * Everyone else is redirected into AcademyOS.
 */

import {
  authorize,
  hasPermission,
  toAuthzSnapshot,
  type AuthzSnapshot,
  type AuthzSubject,
} from "@/lib/platform/identity/authorization-service";

/** Catalog gate for the JAG application. */
export const JAG_ENTRY_PERMISSION = "JAG_ACCESS" as const;

/** AcademyOS home — redirect target when JAG entry is denied. */
export const ACADEMYOS_HOME_PATH = "/dashboard" as const;

/** True when the subject may enter JAG (permission-based only). */
export function canEnterJag(subject: AuthzSubject): boolean {
  return hasPermission(subject, JAG_ENTRY_PERMISSION);
}

/** Authorize JAG entry against a preloaded authz snapshot. */
export function authorizeJagEntry(snapshot: AuthzSnapshot): boolean {
  return authorize(snapshot, JAG_ENTRY_PERMISSION);
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
