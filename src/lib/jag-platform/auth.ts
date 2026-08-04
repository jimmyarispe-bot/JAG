/**
 * JAG Platform authentication boundary.
 *
 * Production human password authority: Supabase Auth (see login.ts).
 * Demo accounts: non-production / explicit opt-in only — never a production fallback.
 * Provisioned in-memory founder passwords are NOT accepted for login.
 */

import type { JagPlatformRole } from "@/lib/jag-platform/roles";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

export type JagPlatformCredentials = {
  readonly email: string;
  readonly password: string;
};

type DemoAccount = {
  readonly email: string;
  readonly password: string;
  readonly userId: string;
  readonly displayName: string;
  readonly role: JagPlatformRole;
};

/**
 * Local/demo accounts — never accepted when production demo auth is disabled.
 * Passwords here are test fixtures only; production rejects this path.
 */
export const JAG_PLATFORM_DEMO_ACCOUNTS: readonly DemoAccount[] = Object.freeze([
  {
    email: "founder@jag.platform",
    password: "jag-founder",
    userId: "jag-user-founder",
    displayName: "JAG Founder",
    role: "FOUNDER",
  },
  {
    email: "owner@jag.platform",
    password: "jag-owner",
    userId: "jag-user-owner",
    displayName: "Platform Owner",
    role: "PLATFORM_OWNER",
  },
  {
    email: "admin@jag.platform",
    password: "jag-admin",
    userId: "jag-user-admin",
    displayName: "Platform Admin",
    role: "PLATFORM_ADMIN",
  },
  {
    email: "org@jag.platform",
    password: "jag-org",
    userId: "jag-user-org",
    displayName: "Organization Owner",
    role: "ORG_OWNER",
  },
  {
    email: "publisher@jag.platform",
    password: "jag-publisher",
    userId: "jag-user-publisher",
    displayName: "Marketplace Publisher",
    role: "MARKETPLACE_PUBLISHER",
  },
  {
    email: "auditor@jag.platform",
    password: "jag-auditor",
    userId: "jag-user-auditor",
    displayName: "Platform Auditor",
    role: "AUDITOR",
  },
]);

/** Generic failure — do not reveal account existence, entitlement, or MFA details. */
export const GENERIC_JAG_AUTH_FAILURE =
  "Invalid credentials for The JAG™ Platform." as const;

export type JagPlatformAuthResult =
  | { readonly ok: true; readonly session: Omit<JagPlatformSession, "exp"> & { exp?: number } }
  | { readonly ok: false; readonly error: string };

/**
 * Demo/test credentials are allowed only in development, vitest, or explicit opt-in.
 * Production and Vercel production always fail closed for this path.
 */
export function isJagPlatformDemoAuthEnabled(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.JAG_PLATFORM_ALLOW_DEMO_AUTH === "true") return true;
  if (process.env.NODE_ENV === "test") return true;
  if (process.env.NODE_ENV === "development") return true;
  return false;
}

/** Demo-only authentication — never call as a production fallback after Supabase failure. */
export function tryAuthenticateJagPlatformDemo(
  credentials: JagPlatformCredentials
): JagPlatformAuthResult {
  if (!isJagPlatformDemoAuthEnabled()) {
    return { ok: false, error: GENERIC_JAG_AUTH_FAILURE };
  }
  const email = credentials.email.trim().toLowerCase();
  const password = credentials.password;
  if (!email || !password) {
    return { ok: false, error: GENERIC_JAG_AUTH_FAILURE };
  }
  const account = JAG_PLATFORM_DEMO_ACCOUNTS.find(
    (a) => a.email === email && a.password === password
  );
  if (!account) {
    return { ok: false, error: GENERIC_JAG_AUTH_FAILURE };
  }
  const authority =
    account.role === "ORG_OWNER" ? ("organization" as const) : ("platform" as const);
  return {
    ok: true,
    session: {
      userId: account.userId,
      email: account.email,
      displayName: account.displayName,
      role: account.role,
      authority,
      organizationId: authority === "organization" ? "org.demo-bound" : null,
      issuedAt: new Date().toISOString(),
    },
  };
}

/**
 * @deprecated Production login uses `authenticateJagPlatformLogin` (Supabase + JAG_ACCESS).
 * Kept for unit tests that exercise demo accounts under non-production NODE_ENV.
 * Provisioned founder plaintext passwords are intentionally not accepted.
 */
export function authenticateJagPlatform(
  credentials: JagPlatformCredentials
): JagPlatformAuthResult {
  return tryAuthenticateJagPlatformDemo(credentials);
}

export const JAG_PLATFORM_LOGIN_PATH = "/jag/login" as const;
export const JAG_PLATFORM_FORGOT_PASSWORD_PATH = "/jag/login/forgot" as const;
export const JAG_PLATFORM_RESET_PASSWORD_PATH = "/jag/login/reset" as const;
export const JAG_PLATFORM_HOME_PATH = "/jag" as const;
export const ACADEMYOS_LAUNCH_PATH = "/dashboard" as const;
