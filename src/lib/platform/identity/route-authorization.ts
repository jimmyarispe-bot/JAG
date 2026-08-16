/**
 * Enterprise IAM — centralized route authorization policies.
 *
 * Maps URL paths to required catalog permissions. Used by Next.js middleware
 * and server layout guards.
 *
 * Sprint 007 — Founder Protection: JAG routes require JAG_ACCESS only.
 * Sprint 008 — Financial Security: finance surfaces require FINANCE_ACCESS.
 */

import type { CatalogPermission } from "@/lib/platform/identity/permission-catalog";
import {
  authorize,
  authorizeAll,
  type AuthzSnapshot,
} from "@/lib/platform/identity/authorization-service";
import {
  ACADEMYOS_HOME_PATH,
  JAG_ENTRY_PERMISSION,
  authorizeJagEntry,
} from "@/lib/platform/identity/founder-protection";
import {
  FINANCE_DENIED_REDIRECT,
  FINANCE_ENTRY_PERMISSION,
  authorizeFinanceEntry,
  isFinancialSecurityRoute,
} from "@/lib/platform/identity/financial-security";
import {
  PLATFORM_ADMINISTRATION_ENTRY_PERMISSIONS,
  isPlatformAdministrationRoute,
} from "@/lib/dashboard/platform-administration";
import { isJagPlatformUsersRoute } from "@/lib/jag-platform/platform-access";

export type RouteAuthzDecision =
  | { ok: true; required: readonly CatalogPermission[] }
  | { ok: false; required: readonly CatalogPermission[]; missing: CatalogPermission; redirectTo: string };

/** True for JAG application surfaces. */
export function isJagRoute(pathname: string): boolean {
  return (
    pathname === "/jag" ||
    pathname.startsWith("/jag/") ||
    pathname === "/exec" ||
    pathname.startsWith("/exec/") ||
    pathname.startsWith("/dashboard/jag")
  );
}

/** True for AcademyOS application surfaces (excludes JAG nested under /dashboard/jag). */
export function isAcademyOsRoute(pathname: string): boolean {
  if (isJagRoute(pathname)) return false;
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/cloud") ||
    pathname.startsWith("/operations") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/organizations") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/platform")
  );
}

/** @deprecated Prefer isFinancialSecurityRoute — kept for callers. */
export function isFinanceRoute(pathname: string, search: string = ""): boolean {
  return isFinancialSecurityRoute(pathname, search);
}

export function isPayrollRoute(pathname: string, search: string = ""): boolean {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const view = (params.get("view") ?? "").toLowerCase();
  if (view === "payroll") return true;
  if (pathname.toLowerCase().includes("payroll")) return true;
  if (pathname.startsWith("/dashboard/hr") && view === "payroll") return true;
  return false;
}

/**
 * Resolve catalog permissions required for a route.
 * More specific module gates are additive on top of application scope.
 */
export function requiredPermissionsForRoute(
  pathname: string,
  search: string = ""
): CatalogPermission[] {
  // Sprint 007 — JAG is Founder-protected via JAG_ACCESS alone.
  // /jag/users is platform administration, not org-scoped JAG entry.
  if (isJagRoute(pathname)) {
    if (isJagPlatformUsersRoute(pathname)) {
      return [JAG_ENTRY_PERMISSION, "JAG_PLATFORM_ADMIN"];
    }
    return [JAG_ENTRY_PERMISSION];
  }

  const required: CatalogPermission[] = [];

  if (isAcademyOsRoute(pathname)) {
    required.push("ACADEMYOS_ACCESS");
  }

  // Sprint 008 — Financial Security: FINANCE_ACCESS for all finance surfaces.
  if (isFinancialSecurityRoute(pathname, search)) {
    required.push(FINANCE_ENTRY_PERMISSION);
  }

  // Sprint 009 — Platform Administration routes still require AcademyOS;
  // section-level permissions are enforced in admin layout / page guards.
  if (isPlatformAdministrationRoute(pathname) && !required.includes("ACADEMYOS_ACCESS")) {
    required.push("ACADEMYOS_ACCESS");
  }

  return required;
}

export function deniedRedirectFor(
  missing: CatalogPermission,
  _pathname: string
): string {
  if (missing === JAG_ENTRY_PERMISSION) {
    return ACADEMYOS_HOME_PATH;
  }
  if (missing === "ACADEMYOS_ACCESS") {
    return "/login";
  }
  if (missing === FINANCE_ENTRY_PERMISSION) {
    return FINANCE_DENIED_REDIRECT;
  }
  return ACADEMYOS_HOME_PATH;
}

/** Evaluate route access against a preloaded authz snapshot. */
export function authorizeRoute(
  snapshot: AuthzSnapshot,
  pathname: string,
  search: string = ""
): RouteAuthzDecision {
  // Sprint 007 — Founder Protection (permission engine only).
  if (isJagRoute(pathname)) {
    if (isJagPlatformUsersRoute(pathname)) {
      if (
        !authorize(snapshot, JAG_ENTRY_PERMISSION) ||
        !authorize(snapshot, "JAG_PLATFORM_ADMIN")
      ) {
        return {
          ok: false,
          required: [JAG_ENTRY_PERMISSION, "JAG_PLATFORM_ADMIN"],
          missing: authorize(snapshot, JAG_ENTRY_PERMISSION)
            ? "JAG_PLATFORM_ADMIN"
            : JAG_ENTRY_PERMISSION,
          redirectTo: "/jag",
        };
      }
      return { ok: true, required: [JAG_ENTRY_PERMISSION, "JAG_PLATFORM_ADMIN"] };
    }
    if (authorizeJagEntry(snapshot)) {
      return { ok: true, required: [JAG_ENTRY_PERMISSION] };
    }
    return {
      ok: false,
      required: [JAG_ENTRY_PERMISSION],
      missing: JAG_ENTRY_PERMISSION,
      redirectTo: ACADEMYOS_HOME_PATH,
    };
  }

  // Sprint 009 — Platform Administration (permission engine only).
  if (isPlatformAdministrationRoute(pathname) && !isFinancialSecurityRoute(pathname, search)) {
    if (!authorize(snapshot, "ACADEMYOS_ACCESS")) {
      return {
        ok: false,
        required: ["ACADEMYOS_ACCESS"],
        missing: "ACADEMYOS_ACCESS",
        redirectTo: "/login",
      };
    }
    const hasAdminEntry = PLATFORM_ADMINISTRATION_ENTRY_PERMISSIONS.some((permission) =>
      authorize(snapshot, permission)
    );
    if (!hasAdminEntry) {
      return {
        ok: false,
        required: ["ACADEMYOS_ACCESS", "SYSTEM_ADMIN_ACCESS"],
        missing: "SYSTEM_ADMIN_ACCESS",
        redirectTo: ACADEMYOS_HOME_PATH,
      };
    }
    return {
      ok: true,
      required: ["ACADEMYOS_ACCESS"],
    };
  }

  // Sprint 008 — Financial Security (permission engine only).
  if (isFinancialSecurityRoute(pathname, search)) {
    const required: CatalogPermission[] = [];
    if (isAcademyOsRoute(pathname)) {
      required.push("ACADEMYOS_ACCESS");
    }
    required.push(FINANCE_ENTRY_PERMISSION);

    if (!authorizeAll(snapshot, required)) {
      const missing =
        required.find((permission) => !authorize(snapshot, permission)) ??
        FINANCE_ENTRY_PERMISSION;
      return {
        ok: false,
        required,
        missing,
        redirectTo: deniedRedirectFor(missing, pathname),
      };
    }

    // Defense in depth — explicit finance gate even when ACADEMYOS is also required.
    if (!authorizeFinanceEntry(snapshot)) {
      return {
        ok: false,
        required,
        missing: FINANCE_ENTRY_PERMISSION,
        redirectTo: FINANCE_DENIED_REDIRECT,
      };
    }

    return { ok: true, required };
  }

  const required = requiredPermissionsForRoute(pathname, search);
  if (required.length === 0) {
    return { ok: true, required };
  }

  if (authorizeAll(snapshot, required)) {
    return { ok: true, required };
  }

  const missing =
    required.find((permission) => !authorize(snapshot, permission)) ?? required[0];

  return {
    ok: false,
    required,
    missing,
    redirectTo: deniedRedirectFor(missing, pathname),
  };
}
