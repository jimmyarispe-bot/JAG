/**
 * JAG GA auth reconciliation — identity, entitlement, session integrity, demo fail-closed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import {
  authenticateJagPlatform,
  GENERIC_JAG_AUTH_FAILURE,
  isJagPlatformDemoAuthEnabled,
  tryAuthenticateJagPlatformDemo,
} from "@/lib/jag-platform/auth";
import {
  authenticateJagPlatformLogin,
  completeJagAuthorization,
} from "@/lib/jag-platform/login";
import {
  decodeJagPlatformSession,
  encodeJagPlatformSession,
  type JagPlatformSession,
} from "@/lib/jag-platform/session";
import { authorizeJagEntry } from "@/lib/platform/identity/founder-protection";
import { buildAuthzSnapshot } from "@/lib/platform/identity/authorization-service";
import * as loadAuthz from "@/lib/platform/identity/load-authz-snapshot";
import * as mfaGate from "@/lib/jag-platform/mfa-gate";
import * as orgContext from "@/lib/jag-platform/org-context";

const SIGNING_SECRET = "test-jag-session-signing-secret-32chars!!";

function stubUser(overrides?: Partial<User>): User {
  return {
    id: "user-founder-1",
    email: "founder@example.com",
    user_metadata: { first_name: "Ada", last_name: "Lovelace" },
    app_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    ...overrides,
  } as User;
}

function mockSupabase(options: {
  signIn?: {
    user: User | null;
    error: { message: string } | null;
  };
  aal?: string;
}) {
  return {
    auth: {
      signInWithPassword: vi.fn(async () => ({
        data: {
          user: options.signIn?.user ?? null,
          session: options.signIn?.user ? {} : null,
        },
        error: options.signIn?.error ?? null,
      })),
      signOut: vi.fn(async () => ({ error: null })),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn(async () => ({
          data: { currentLevel: options.aal ?? "aal1" },
          error: null,
        })),
      },
    },
    from: vi.fn(),
  };
}

describe("JAG session HMAC protection", () => {
  beforeEach(() => {
    vi.stubEnv("VAULT_ENCRYPTION_KEY", SIGNING_SECRET);
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("I. accepts a valid protected JAG session", async () => {
    const session: Omit<JagPlatformSession, "exp"> = {
      userId: "u1",
      email: "founder@example.com",
      displayName: "Founder",
      role: "FOUNDER",
      authority: "platform",
      organizationId: "org-academy",
      issuedAt: new Date().toISOString(),
    };
    const token = await encodeJagPlatformSession(session);
    expect(token).toBeTruthy();
    const decoded = await decodeJagPlatformSession(token);
    expect(decoded?.userId).toBe("u1");
    expect(decoded?.role).toBe("FOUNDER");
    expect(decoded?.authority).toBe("platform");
    expect(decoded?.organizationId).toBe("org-academy");
    expect(decoded?.exp).toBeTypeOf("number");
  });

  it("G. rejects a tampered JAG session cookie", async () => {
    const token = await encodeJagPlatformSession({
      userId: "u1",
      email: "founder@example.com",
      displayName: "Founder",
      role: "FOUNDER",
      authority: "platform",
      organizationId: null,
      issuedAt: new Date().toISOString(),
    });
    expect(token).toBeTruthy();
    const parts = token!.split(".");
    const payload = JSON.parse(
      Buffer.from(parts[1]!, "base64url").toString("utf8")
    ) as Record<string, unknown>;
    payload.role = "PLATFORM_OWNER";
    const tampered = `${parts[0]}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${parts[2]}`;
    expect(await decodeJagPlatformSession(tampered)).toBeNull();
  });

  it("H. rejects an expired JAG session cookie", async () => {
    const token = await encodeJagPlatformSession({
      userId: "u1",
      email: "founder@example.com",
      displayName: "Founder",
      role: "FOUNDER",
      authority: "platform",
      organizationId: null,
      issuedAt: new Date().toISOString(),
      exp: Date.now() - 1000,
    });
    expect(token).toBeTruthy();
    expect(await decodeJagPlatformSession(token)).toBeNull();
  });

  it("rejects legacy unsigned base64 JSON cookies", async () => {
    const legacy = Buffer.from(
      JSON.stringify({
        userId: "u1",
        email: "founder@example.com",
        displayName: "Founder",
        role: "FOUNDER",
        issuedAt: new Date().toISOString(),
      })
    ).toString("base64url");
    expect(await decodeJagPlatformSession(legacy)).toBeNull();
  });

  it("fails closed when no signing secret is configured", async () => {
    vi.stubEnv("VAULT_ENCRYPTION_KEY", "");
    vi.stubEnv("OAUTH_STATE_SECRET", "");
    vi.stubEnv("CRON_SECRET", "");
    const token = await encodeJagPlatformSession({
      userId: "u1",
      email: "a@b.c",
      displayName: "X",
      role: "FOUNDER",
      authority: "platform",
      organizationId: null,
      issuedAt: new Date().toISOString(),
    });
    expect(token).toBeNull();
  });

  it("rejects organization authority without organizationId", async () => {
    const token = await encodeJagPlatformSession({
      userId: "u1",
      email: "admin@customer.org",
      displayName: "Admin",
      role: "ORG_OWNER",
      authority: "organization",
      organizationId: null,
      issuedAt: new Date().toISOString(),
    });
    expect(token).toBeNull();
  });
});

describe("JAG entitlement + Supabase login orchestration", () => {
  beforeEach(() => {
    vi.stubEnv("VAULT_ENCRYPTION_KEY", SIGNING_SECRET);
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("ENFORCE_MFA", "false");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("A. valid Supabase identity + JAG_ACCESS can proceed", async () => {
    const user = stubUser();
    vi.spyOn(loadAuthz, "loadAuthzSnapshot").mockResolvedValue(
      buildAuthzSnapshot(user.id, ["FOUNDER"])
    );
    vi.spyOn(orgContext, "resolveJagOrganizationContext").mockResolvedValue({
      authority: "platform",
      organizationId: "org-academy",
      membershipRole: "owner",
    });
    vi.spyOn(mfaGate, "evaluateJagMfaGate").mockResolvedValue({
      applies: true,
      blocked: false,
      aal2: true,
    });

    const supabase = mockSupabase({
      signIn: { user, error: null },
    });
    const result = await authenticateJagPlatformLogin(supabase as never, {
      email: "founder@example.com",
      password: "correct-password",
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.requiresMfa || !result.session) return;
    expect(result.session.userId).toBe(user.id);
    expect(result.session.role).toBe("FOUNDER");
    expect(result.session.authority).toBe("platform");
    expect(result.session.organizationId).toBe("org-academy");
  });

  it("B. valid Supabase identity without JAG_ACCESS is denied (no session)", async () => {
    const user = stubUser({ id: "teacher-1", email: "teacher@school.org" });
    vi.spyOn(loadAuthz, "loadAuthzSnapshot").mockResolvedValue(
      buildAuthzSnapshot(user.id, ["Teacher"])
    );
    expect(authorizeJagEntry(buildAuthzSnapshot(user.id, ["Teacher"]))).toBe(
      false
    );

    const supabase = mockSupabase({
      signIn: { user, error: null },
    });
    const result = await authenticateJagPlatformLogin(supabase as never, {
      email: "teacher@school.org",
      password: "correct-password",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe(GENERIC_JAG_AUTH_FAILURE);
  });

  it("C. invalid password is denied (no session)", async () => {
    const supabase = mockSupabase({
      signIn: { user: null, error: { message: "Invalid login credentials" } },
    });
    // Disable demo so invalid password cannot match demo fixtures.
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("JAG_PLATFORM_ALLOW_DEMO_AUTH", "");

    const result = await authenticateJagPlatformLogin(supabase as never, {
      email: "founder@example.com",
      password: "wrong-password",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe(GENERIC_JAG_AUTH_FAILURE);
  });

  it("D. production rejects demo credentials", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("JAG_PLATFORM_ALLOW_DEMO_AUTH", "");
    expect(isJagPlatformDemoAuthEnabled()).toBe(false);

    const demo = tryAuthenticateJagPlatformDemo({
      email: "founder@jag.platform",
      password: "jag-founder",
    });
    expect(demo.ok).toBe(false);

    const supabase = mockSupabase({
      signIn: { user: null, error: { message: "Invalid login credentials" } },
    });
    const result = await authenticateJagPlatformLogin(supabase as never, {
      email: "founder@jag.platform",
      password: "jag-founder",
    });
    expect(result.ok).toBe(false);
  });

  it("J. MFA-required user cannot receive final JAG session before MFA", async () => {
    const user = stubUser();
    vi.spyOn(loadAuthz, "loadAuthzSnapshot").mockResolvedValue(
      buildAuthzSnapshot(user.id, ["FOUNDER"])
    );
    vi.spyOn(orgContext, "resolveJagOrganizationContext").mockResolvedValue({
      authority: "platform",
      organizationId: "org-academy",
      membershipRole: "owner",
    });
    vi.spyOn(mfaGate, "evaluateJagMfaGate").mockResolvedValue({
      applies: true,
      blocked: true,
      aal2: false,
    });

    const result = await completeJagAuthorization(
      mockSupabase({}) as never,
      user
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.requiresMfa).toBe(true);
    expect(result.session).toBeNull();
    if (!result.requiresMfa) return;
    expect(result.redirectTo).toContain("/login/mfa-required");
    expect(result.redirectTo).toContain(
      encodeURIComponent("/api/jag-platform/auth/establish")
    );
  });

  it("F. recovery alone does not create a JAG session (establish still needs entitlement)", async () => {
    const user = stubUser({ id: "no-access", email: "user@school.org" });
    vi.spyOn(loadAuthz, "loadAuthzSnapshot").mockResolvedValue(
      buildAuthzSnapshot(user.id, ["Teacher"])
    );
    const result = await completeJagAuthorization(
      mockSupabase({}) as never,
      user
    );
    expect(result.ok).toBe(false);
  });

  it("does not accept provisioned founder plaintext via authenticateJagPlatform", () => {
    // In-memory founder passwords are no longer a login path.
    const result = authenticateJagPlatform({
      email: "ada@northwind.test",
      password: "any-provisioned-password",
    });
    expect(result.ok).toBe(false);
  });
});

describe("K. AcademyOS auth helper surfaces remain distinct", () => {
  it("keeps JAG login paths separate from AcademyOS /login", async () => {
    const { JAG_PLATFORM_LOGIN_PATH, JAG_PLATFORM_FORGOT_PASSWORD_PATH } =
      await import("@/lib/jag-platform/auth");
    expect(JAG_PLATFORM_LOGIN_PATH).toBe("/jag/login");
    expect(JAG_PLATFORM_FORGOT_PASSWORD_PATH).toBe("/jag/login/forgot");
    expect(JAG_PLATFORM_LOGIN_PATH).not.toBe("/login");
  });
});
