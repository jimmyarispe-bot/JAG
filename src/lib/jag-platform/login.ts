/**
 * JAG login reconciliation — Supabase identity + org-scoped entitlement + MFA gate.
 *
 * Supabase Auth verifies the password. JAG entry is a separate fail-closed gate
 * (JAG_ACCESS for platform stewards, JAG_ORG_ACCESS for customer org admins).
 * A valid Supabase account alone never grants a JAG session.
 */

import type { User, SupabaseClient } from "@supabase/supabase-js";
import { authorizeJagEntry } from "@/lib/platform/identity/founder-protection";
import { loadAuthzSnapshot } from "@/lib/platform/identity/load-authz-snapshot";
import type { JagPlatformRole } from "@/lib/jag-platform/roles";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { resolveJagOrganizationContext } from "@/lib/jag-platform/org-context";
import {
  evaluateJagMfaGate,
  jagMfaRequiredPath,
} from "@/lib/jag-platform/mfa-gate";
import {
  JAG_PLATFORM_HOME_PATH,
  GENERIC_JAG_AUTH_FAILURE,
  isJagPlatformDemoAuthEnabled,
  tryAuthenticateJagPlatformDemo,
} from "@/lib/jag-platform/auth";
import type { JagAuthorityKind } from "@/lib/platform/identity/jag-authority";

export const JAG_SESSION_ESTABLISH_PATH =
  "/api/jag-platform/auth/establish" as const;

type AuthClient = Pick<SupabaseClient, "auth" | "from">;

export type JagLoginSuccess = {
  readonly ok: true;
  readonly session: JagPlatformSession;
  readonly requiresMfa: false;
};

export type JagLoginMfaRequired = {
  readonly ok: true;
  readonly requiresMfa: true;
  readonly requiresPasswordReset?: false;
  readonly redirectTo: string;
  /** Identity established in Supabase cookies — no JAG session yet. */
  readonly session: null;
};

export type JagLoginPasswordResetRequired = {
  readonly ok: true;
  readonly requiresMfa: false;
  readonly requiresPasswordReset: true;
  readonly redirectTo: string;
  readonly session: null;
};

export type JagLoginFailure = {
  readonly ok: false;
  readonly error: string;
};

export type JagLoginResult =
  | JagLoginSuccess
  | JagLoginMfaRequired
  | JagLoginPasswordResetRequired
  | JagLoginFailure;

function displayNameForUser(user: User): string {
  const meta = user.user_metadata ?? {};
  const first =
    typeof meta.first_name === "string"
      ? meta.first_name
      : typeof meta.firstName === "string"
        ? meta.firstName
        : "";
  const last =
    typeof meta.last_name === "string"
      ? meta.last_name
      : typeof meta.lastName === "string"
        ? meta.lastName
        : "";
  const combined = `${first} ${last}`.trim();
  if (combined) return combined;
  if (typeof meta.full_name === "string" && meta.full_name.trim()) {
    return meta.full_name.trim();
  }
  if (typeof meta.name === "string" && meta.name.trim()) {
    return meta.name.trim();
  }
  return user.email ?? "JAG User";
}

/** Map verified authz roles to a JAG platform role claim (server-derived only). */
export function resolveJagPlatformRoleFromAuthz(
  roles: readonly string[],
  authority: JagAuthorityKind
): JagPlatformRole {
  if (authority === "organization") {
    if (roles.includes("JAG_ORG_ADMIN") || roles.includes("ORG_OWNER")) {
      return "ORG_OWNER";
    }
    return "ORG_OWNER";
  }
  if (roles.includes("FOUNDER")) return "FOUNDER";
  if (roles.includes("PLATFORM_OWNER")) return "PLATFORM_OWNER";
  if (roles.includes("PLATFORM_ADMIN")) return "PLATFORM_ADMIN";
  // Platform-level JAG_ACCESS without a more specific role claim.
  return "PLATFORM_OWNER";
}

export function buildJagSessionFromUser(
  user: User,
  role: JagPlatformRole,
  authority: JagAuthorityKind,
  organizationId: string | null,
  maxAgeSeconds = 60 * 60 * 12
): Omit<JagPlatformSession, "exp"> & { exp: number } {
  const issuedAt = new Date().toISOString();
  return {
    userId: user.id,
    email: (user.email ?? "").toLowerCase(),
    displayName: displayNameForUser(user),
    role,
    authority,
    organizationId,
    issuedAt,
    exp: Date.now() + maxAgeSeconds * 1000,
  };
}

/**
 * After Supabase identity is verified: entitlement → org context → MFA → session claims.
 * Does not set cookies — caller applies the signed JAG cookie when ok && !requiresMfa.
 */
export async function completeJagAuthorization(
  supabase: AuthClient,
  user: User,
  options?: { nextPath?: string; preferredOrganizationId?: string | null }
): Promise<JagLoginSuccess | JagLoginMfaRequired | JagLoginFailure> {
  const snapshot = await loadAuthzSnapshot(supabase as SupabaseClient, user.id);
  if (!authorizeJagEntry(snapshot)) {
    return { ok: false, error: GENERIC_JAG_AUTH_FAILURE };
  }

  const orgContext = await resolveJagOrganizationContext(
    supabase as SupabaseClient,
    user.id,
    snapshot,
    options?.preferredOrganizationId
  );
  if (!orgContext) {
    return { ok: false, error: GENERIC_JAG_AUTH_FAILURE };
  }
  if (
    orgContext.authority === "organization" &&
    !orgContext.organizationId
  ) {
    return { ok: false, error: GENERIC_JAG_AUTH_FAILURE };
  }

  const mfa = await evaluateJagMfaGate(
    supabase as SupabaseClient,
    user.id,
    snapshot.roles
  );
  const establishNext = `${JAG_SESSION_ESTABLISH_PATH}?next=${encodeURIComponent(
    options?.nextPath && options.nextPath.startsWith("/jag")
      ? options.nextPath
      : JAG_PLATFORM_HOME_PATH
  )}`;

  if (mfa.blocked) {
    return {
      ok: true,
      requiresMfa: true,
      redirectTo: jagMfaRequiredPath(establishNext),
      session: null,
    };
  }

  const role = resolveJagPlatformRoleFromAuthz(
    snapshot.roles,
    orgContext.authority
  );
  return {
    ok: true,
    requiresMfa: false,
    session: buildJagSessionFromUser(
      user,
      role,
      orgContext.authority,
      orgContext.organizationId
    ),
  };
}

/**
 * Password login: Supabase Auth first; demo only when explicitly enabled (never prod fallback).
 */
export async function authenticateJagPlatformLogin(
  supabase: AuthClient,
  credentials: { email: string; password: string },
  options?: { nextPath?: string; preferredOrganizationId?: string | null }
): Promise<JagLoginResult> {
  const email = credentials.email.trim().toLowerCase();
  const password = credentials.password;
  if (!email || !password) {
    return { ok: false, error: GENERIC_JAG_AUTH_FAILURE };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!error && data.user) {
    if (data.user.user_metadata?.must_reset_password === true) {
      const next =
        options?.nextPath && options.nextPath.startsWith("/jag")
          ? options.nextPath
          : JAG_PLATFORM_HOME_PATH;
      return {
        ok: true,
        requiresMfa: false,
        requiresPasswordReset: true,
        redirectTo: `/login/reset-required?next=${encodeURIComponent(next)}`,
        session: null,
      };
    }
    const authorized = await completeJagAuthorization(
      supabase,
      data.user,
      options
    );
    if (!authorized.ok) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore — still return generic denial
      }
    }
    return authorized;
  }

  if (isJagPlatformDemoAuthEnabled()) {
    const demo = tryAuthenticateJagPlatformDemo({ email, password });
    if (demo.ok) {
      const authority: JagAuthorityKind =
        demo.session.role === "ORG_OWNER" ? "organization" : "platform";
      return {
        ok: true,
        requiresMfa: false,
        session: {
          ...demo.session,
          authority,
          organizationId:
            authority === "organization" ? "org.demo-bound" : null,
          exp: Date.now() + 60 * 60 * 12 * 1000,
        },
      };
    }
  }

  return { ok: false, error: GENERIC_JAG_AUTH_FAILURE };
}
