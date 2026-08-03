/**
 * JAG login reconciliation — Supabase identity + JAG_ACCESS entitlement + MFA gate.
 *
 * Supabase Auth verifies the password. JAG_ACCESS is a separate fail-closed gate.
 * A valid Supabase account alone never grants a JAG session.
 */

import type { User, SupabaseClient } from "@supabase/supabase-js";
import { authorizeJagEntry } from "@/lib/platform/identity/founder-protection";
import { loadAuthzSnapshot } from "@/lib/platform/identity/load-authz-snapshot";
import type { JagPlatformRole } from "@/lib/jag-platform/roles";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
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
  roles: readonly string[]
): JagPlatformRole {
  if (roles.includes("FOUNDER")) return "FOUNDER";
  if (roles.includes("PLATFORM_OWNER")) return "PLATFORM_OWNER";
  if (roles.includes("PLATFORM_ADMIN")) return "PLATFORM_ADMIN";
  // JAG_ACCESS is Founder-mapped; default claim for entitled users.
  return "FOUNDER";
}

export function buildJagSessionFromUser(
  user: User,
  role: JagPlatformRole,
  maxAgeSeconds = 60 * 60 * 12
): Omit<JagPlatformSession, "exp"> & { exp: number } {
  const issuedAt = new Date().toISOString();
  return {
    userId: user.id,
    email: (user.email ?? "").toLowerCase(),
    displayName: displayNameForUser(user),
    role,
    issuedAt,
    exp: Date.now() + maxAgeSeconds * 1000,
  };
}

/**
 * After Supabase identity is verified: entitlement → MFA → session claims.
 * Does not set cookies — caller applies the signed JAG cookie when ok && !requiresMfa.
 */
export async function completeJagAuthorization(
  supabase: AuthClient,
  user: User,
  options?: { nextPath?: string }
): Promise<JagLoginSuccess | JagLoginMfaRequired | JagLoginFailure> {
  const snapshot = await loadAuthzSnapshot(supabase as SupabaseClient, user.id);
  if (!authorizeJagEntry(snapshot)) {
    return { ok: false, error: GENERIC_JAG_AUTH_FAILURE };
  }

  const mfa = await evaluateJagMfaGate(supabase as SupabaseClient, user.id, snapshot.roles);
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

  const role = resolveJagPlatformRoleFromAuthz(snapshot.roles);
  return {
    ok: true,
    requiresMfa: false,
    session: buildJagSessionFromUser(user, role),
  };
}

/**
 * Password login: Supabase Auth first; demo only when explicitly enabled (never prod fallback).
 */
export async function authenticateJagPlatformLogin(
  supabase: AuthClient,
  credentials: { email: string; password: string },
  options?: { nextPath?: string }
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
      // Identity ok but must reset — do not mint JAG session.
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
    // Entitlement failure: clear Supabase cookies so a denied JAG attempt
    // does not leave an unexpected AcademyOS session.
    if (!authorized.ok) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore — still return generic denial
      }
    }
    return authorized;
  }

  // Never fall back to demo/plaintext after a Supabase failure in production paths.
  if (isJagPlatformDemoAuthEnabled()) {
    const demo = tryAuthenticateJagPlatformDemo({ email, password });
    if (demo.ok) {
      return {
        ok: true,
        requiresMfa: false,
        session: {
          ...demo.session,
          exp: Date.now() + 60 * 60 * 12 * 1000,
        },
      };
    }
  }

  return { ok: false, error: GENERIC_JAG_AUTH_FAILURE };
}
