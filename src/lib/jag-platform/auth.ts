/**
 * JAG Platform authentication boundary (Phase 1).
 * Demo accounts + provisioned founders — not AcademyOS login.
 */

import { findFounderCredentials } from "@/lib/jag-business/store";
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

/** Phase 1 demo accounts — replace with IdP later. */
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

export type JagPlatformAuthResult =
  | { readonly ok: true; readonly session: JagPlatformSession }
  | { readonly ok: false; readonly error: string };

export function authenticateJagPlatform(
  credentials: JagPlatformCredentials
): JagPlatformAuthResult {
  const email = credentials.email.trim().toLowerCase();
  const password = credentials.password;
  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }
  const account = JAG_PLATFORM_DEMO_ACCOUNTS.find(
    (a) => a.email === email && a.password === password
  );
  if (account) {
    return {
      ok: true,
      session: {
        userId: account.userId,
        email: account.email,
        displayName: account.displayName,
        role: account.role,
        issuedAt: new Date().toISOString(),
      },
    };
  }

  const provisioned = findFounderCredentials(email);
  if (provisioned && provisioned.password === password) {
    const { founder } = provisioned.organization;
    return {
      ok: true,
      session: {
        userId: founder.userId,
        email: founder.email,
        displayName: `${founder.firstName} ${founder.lastName}`.trim(),
        role: "FOUNDER",
        issuedAt: new Date().toISOString(),
      },
    };
  }

  return { ok: false, error: "Invalid credentials for The JAG™ Platform." };
}

export const JAG_PLATFORM_LOGIN_PATH = "/jag/login" as const;
export const JAG_PLATFORM_HOME_PATH = "/jag" as const;
export const ACADEMYOS_LAUNCH_PATH = "/dashboard" as const;
