import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  authorize,
  authorizeAll,
  toAuthzSnapshot,
} from "@/lib/platform/identity/authorization-service";
import { getIdentityContext } from "@/lib/platform/identity/context";
import {
  ACADEMYOS_HOME_PATH,
  evaluateJagProtection,
} from "@/lib/platform/identity/founder-protection";
import {
  FINANCE_DENIED_REDIRECT,
  evaluateFinancialSecurity,
} from "@/lib/platform/identity/financial-security";
import {
  PLATFORM_ADMINISTRATION_ENTRY_PERMISSIONS,
  canAccessPlatformAdministration,
} from "@/lib/dashboard/platform-administration";
import { authorizeRoute } from "@/lib/platform/identity/route-authorization";
import { enforcePrivilegedMfa } from "@/lib/platform/identity/mfa-enforce";
import { createAuthClient } from "@/lib/supabase/server-auth";
import type { CatalogPermission } from "@/lib/platform/identity/permission-catalog";
import type { PermissionKey } from "@/lib/platform/identity/types";

function snapshotFromContext(ctx: NonNullable<Awaited<ReturnType<typeof getIdentityContext>>>) {
  return toAuthzSnapshot(ctx);
}

export async function requirePagePermission(permission: PermissionKey | PermissionKey[]) {
  const ctx = await getIdentityContext();
  if (!ctx) redirect("/login");

  const snapshot = snapshotFromContext(ctx);
  const keys = Array.isArray(permission) ? permission : [permission];

  // Any-of semantics for legacy callers that pass alternative permissions
  if (keys.some((key) => authorize(snapshot, key))) {
    return ctx;
  }

  redirect("/dashboard");
}

/** Require one or more catalog permissions (all required). */
export async function requireCatalogAccess(permission: CatalogPermission | CatalogPermission[]) {
  const ctx = await getIdentityContext();
  if (!ctx) redirect("/login");

  const snapshot = snapshotFromContext(ctx);
  const keys = Array.isArray(permission) ? permission : [permission];

  if (!authorizeAll(snapshot, keys)) {
    if (keys.includes("JAG_ACCESS")) redirect(ACADEMYOS_HOME_PATH);
    if (keys.includes("ACADEMYOS_ACCESS")) redirect("/login");
    redirect(ACADEMYOS_HOME_PATH);
  }

  return ctx;
}

/**
 * Sprint 007 — JAG application gate (Founder Protection).
 * Uses JAG_ACCESS via the permission engine; denied users go to AcademyOS.
 */
export async function requireJagAccess() {
  const ctx = await getIdentityContext();
  if (!ctx) redirect("/login");

  const decision = evaluateJagProtection(ctx);
  if (!decision.allowed) {
    redirect(decision.redirectTo ?? ACADEMYOS_HOME_PATH);
  }

  return ctx;
}

/**
 * AcademyOS application gate — requires ACADEMYOS_ACCESS.
 */
export async function requireAcademyOsAccess() {
  return requireCatalogAccess("ACADEMYOS_ACCESS");
}

/**
 * Sprint 008 — Financial Security gate.
 * Requires FINANCE_ACCESS via the permission engine.
 */
export async function requireFinanceAccess() {
  const ctx = await getIdentityContext();
  if (!ctx) redirect("/login");

  if (!authorize(toAuthzSnapshot(ctx), "ACADEMYOS_ACCESS")) {
    redirect("/login");
  }

  const decision = evaluateFinancialSecurity(ctx);
  if (!decision.allowed) {
    redirect(decision.redirectTo ?? FINANCE_DENIED_REDIRECT);
  }

  return ctx;
}

/**
 * Sprint 009 — Platform Administration hub/section gate.
 * Requires any platform-admin entry permission via the permission engine.
 */
export async function requirePlatformAdministrationAccess() {
  const ctx = await getIdentityContext();
  if (!ctx) redirect("/login");

  if (!authorize(toAuthzSnapshot(ctx), "ACADEMYOS_ACCESS")) {
    redirect("/login");
  }

  if (!canAccessPlatformAdministration(ctx)) {
    redirect(ACADEMYOS_HOME_PATH);
  }

  return ctx;
}

/** Require a specific Platform Administration section permission. */
export async function requirePlatformAdminSection(
  permission: PermissionKey | PermissionKey[]
) {
  await requirePlatformAdministrationAccess();
  return requirePagePermission(permission);
}

export { PLATFORM_ADMINISTRATION_ENTRY_PERMISSIONS };

/**
 * Centralized route authorization for the current request path.
 * Prefer Next.js middleware; layouts call this as defense in depth.
 */
export async function requireAuthorizedRoute(pathname?: string, search: string = "") {
  const ctx = await getIdentityContext();
  if (!ctx) redirect("/login");

  let path = pathname;
  let query = search;
  if (!path) {
    const headerStore = await headers();
    const full = headerStore.get("x-pathname") ?? headerStore.get("x-url") ?? "";
    if (full) {
      try {
        const url = full.startsWith("http") ? new URL(full) : new URL(full, "http://local");
        path = url.pathname;
        query = url.search;
      } catch {
        path = full;
      }
    }
  }

  if (!path) return ctx;

  const snapshot = snapshotFromContext(ctx);
  const decision = authorizeRoute(snapshot, path, query);
  if (!decision.ok) {
    redirect(decision.redirectTo);
  }

  // B.1 — MFA step-up / enrollment gate for privileged sessions
  const supabase = await createAuthClient();
  await enforcePrivilegedMfa(supabase, ctx, path);

  return ctx;
}

export async function requireAuthenticatedIdentity() {
  const ctx = await getIdentityContext();
  if (!ctx) redirect("/login");
  return ctx;
}
