/**
 * JAG forgot-password → auth-email/Resend (no browser resetPasswordForEmail).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAuthEmailCallbackLink,
  resolveTrustedAuthAppUrl,
  safeAuthEmailNext,
} from "@/lib/platform/auth-email/links";
import { resolveAuthCallbackRedirect } from "@/lib/auth/auth-callback";
import type { User } from "@supabase/supabase-js";

const ROOT = process.cwd();

describe("safeAuthEmailNext / open redirect", () => {
  it("accepts /jag/login", () => {
    expect(safeAuthEmailNext("/jag/login")).toBe("/jag/login");
  });

  it("rejects external and protocol-relative next values", () => {
    expect(safeAuthEmailNext("https://evil.example")).toBeUndefined();
    expect(safeAuthEmailNext("//evil.example")).toBeUndefined();
    expect(safeAuthEmailNext("evil.example")).toBeUndefined();
  });
});

describe("resolveTrustedAuthAppUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses configured production app URL when hint is absent", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.thejag.org");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(resolveTrustedAuthAppUrl(null)).toBe("https://www.thejag.org");
  });

  it("accepts a legitimate Preview vercel.app origin when VERCEL_ENV=preview", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.thejag.org");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(
      resolveTrustedAuthAppUrl("https://jag-abc123.vercel.app")
    ).toBe("https://jag-abc123.vercel.app");
  });

  it("rejects arbitrary attacker origins on production", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.thejag.org");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    expect(
      resolveTrustedAuthAppUrl("https://evil-attacker.vercel.app")
    ).toBe("https://www.thejag.org");
    expect(resolveTrustedAuthAppUrl("https://evil.example")).toBe(
      "https://www.thejag.org"
    );
  });

  it("keeps production callback host production-safe when hint matches canonical", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.thejag.org");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(resolveTrustedAuthAppUrl("https://www.thejag.org")).toBe(
      "https://www.thejag.org"
    );
  });
});

describe("JAG recovery callback link shape", () => {
  it("includes type=recovery and next=/jag/login", () => {
    const link = buildAuthEmailCallbackLink({
      tokenHash: "tok_hash_example",
      type: "recovery",
      next: "/jag/login",
      appUrl: "https://jag-preview.vercel.app",
    });
    const url = new URL(link);
    expect(url.pathname).toBe("/auth/callback");
    expect(url.searchParams.get("type")).toBe("recovery");
    expect(url.searchParams.get("next")).toBe("/jag/login");
    expect(url.searchParams.get("token_hash")).toBe("tok_hash_example");
    expect(url.origin).toBe("https://jag-preview.vercel.app");
  });

  it("omits invalid next instead of open-redirecting", () => {
    const link = buildAuthEmailCallbackLink({
      tokenHash: "tok",
      type: "recovery",
      next: "https://evil.example",
      appUrl: "https://www.thejag.org",
    });
    const url = new URL(link);
    expect(url.searchParams.get("next")).toBeNull();
  });

  it("routes JAG recovery next to /jag/login/reset", () => {
    expect(
      resolveAuthCallbackRedirect({
        type: "recovery",
        next: "/jag/login",
        user: { id: "u1", user_metadata: {} } as User,
      })
    ).toBe(`/jag/login/reset?next=${encodeURIComponent("/jag/login")}`);
  });
});

describe("requestPasswordResetViaAuthEmail JAG integration", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.thejag.org");
    vi.stubEnv("VERCEL_ENV", "preview");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("unknown email returns neutral success and does not generate/send", async () => {
    vi.resetModules();
    const generateRecovery = vi.fn();
    const deliverSend = vi.fn();

    vi.doMock("@/lib/supabase/server", () => ({
      createServiceRoleClient: () => ({
        from: () => ({
          select: () => ({
            ilike: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      }),
    }));
    vi.doMock("@/lib/platform/authentication", () => ({
      getAdminAuthenticationService: () => ({
        getUserById: vi.fn(),
        generateRecovery,
      }),
    }));
    vi.doMock("@/lib/platform/email/send", () => ({
      sendTransactionalEmail: deliverSend,
    }));

    const { requestPasswordResetViaAuthEmail } = await import(
      "@/lib/platform/auth-email/service"
    );
    const result = await requestPasswordResetViaAuthEmail({
      email: "nobody@example.com",
      next: "/jag/login",
      originHint: "https://jag-preview.vercel.app",
    });
    expect(result).toEqual({ ok: true });
    expect(generateRecovery).not.toHaveBeenCalled();
    expect(deliverSend).not.toHaveBeenCalled();
  });

  it("builds JAG next into recovery link when profile + Auth user exist", async () => {
    vi.resetModules();
    const generateRecovery = vi.fn(async () => ({
      ok: true as const,
      data: { tokenHash: "hash123", actionLink: null },
    }));
    const sendTransactionalEmail = vi.fn(async () => ({
      success: true,
      id: "mail-1",
    }));

    vi.doMock("@/lib/supabase/server", () => ({
      createServiceRoleClient: () => ({
        from: () => ({
          select: () => ({
            ilike: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "user-1",
                  full_name: "Ada",
                  email: "ada@example.com",
                },
                error: null,
              }),
            }),
          }),
        }),
      }),
    }));
    vi.doMock("@/lib/platform/authentication", () => ({
      getAdminAuthenticationService: () => ({
        getUserById: async () => ({
          ok: true,
          data: {
            id: "user-1",
            email: "ada@example.com",
            userMetadata: {},
          },
        }),
        generateRecovery,
      }),
    }));
    vi.doMock("@/lib/platform/auth-email/branding", () => ({
      loadEmailBrandForUserEmail: async () => ({
        displayName: "JAG",
        applicationName: "JAG",
        primaryColor: "#000",
        secondaryColor: "#111",
        supportEmail: null,
        logoUrl: null,
      }),
      loadOrganizationEmailBrand: async () => null,
      platformDefaultEmailBrand: () => ({}),
    }));
    vi.doMock("@/lib/platform/email/send", () => ({
      sendTransactionalEmail,
    }));

    const { requestPasswordResetViaAuthEmail } = await import(
      "@/lib/platform/auth-email/service"
    );
    const result = await requestPasswordResetViaAuthEmail({
      email: "ada@example.com",
      next: "/jag/login",
      originHint: "https://jag-preview.vercel.app",
    });
    expect(result).toEqual({ ok: true });
    expect(generateRecovery).toHaveBeenCalled();
    expect(sendTransactionalEmail).toHaveBeenCalled();
    const body = String(sendTransactionalEmail.mock.calls[0]?.[0]?.body ?? "");
    expect(body).toContain("/auth/callback");
    expect(body).toContain("type=recovery");
    expect(body).toContain("next=%2Fjag%2Flogin");
    expect(body).toContain("https://jag-preview.vercel.app");
  });

  it("delivery failure still returns neutral success", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/server", () => ({
      createServiceRoleClient: () => ({
        from: () => ({
          select: () => ({
            ilike: () => ({
              maybeSingle: async () => ({
                data: { id: "user-1", full_name: "Ada", email: "ada@example.com" },
                error: null,
              }),
            }),
          }),
        }),
      }),
    }));
    vi.doMock("@/lib/platform/authentication", () => ({
      getAdminAuthenticationService: () => ({
        getUserById: async () => ({
          ok: true,
          data: { id: "user-1", email: "ada@example.com", userMetadata: {} },
        }),
        generateRecovery: async () => ({
          ok: true,
          data: { tokenHash: "h", actionLink: null },
        }),
      }),
    }));
    vi.doMock("@/lib/platform/auth-email/branding", () => ({
      loadEmailBrandForUserEmail: async () => ({
        displayName: "JAG",
        applicationName: "JAG",
        primaryColor: "#000",
        secondaryColor: "#111",
        supportEmail: null,
        logoUrl: null,
      }),
      loadOrganizationEmailBrand: async () => null,
      platformDefaultEmailBrand: () => ({}),
    }));
    vi.doMock("@/lib/platform/email/send", () => ({
      sendTransactionalEmail: async () => ({
        success: false,
        error: "resend down",
      }),
    }));

    const { requestPasswordResetViaAuthEmail } = await import(
      "@/lib/platform/auth-email/service"
    );
    const result = await requestPasswordResetViaAuthEmail({
      email: "ada@example.com",
      next: "/jag/login",
    });
    expect(result).toEqual({ ok: true });
  });
});

describe("JagForgotPasswordForm client boundary", () => {
  it("invokes server recovery and does not call browser resetPasswordForEmail", () => {
    const src = readFileSync(
      join(ROOT, "src/components/jag-platform/JagForgotPasswordForm.tsx"),
      "utf8"
    );
    expect(src).toContain("requestJagPasswordResetAction");
    expect(src).not.toContain("resetPasswordForEmail");
    expect(src).not.toContain("createClient");
    expect(src).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(src).not.toContain("RESEND_API_KEY");
  });

  it("Jag reset form does not mint jag_platform_session_v2", () => {
    const src = readFileSync(
      join(ROOT, "src/components/jag-platform/JagResetPasswordForm.tsx"),
      "utf8"
    );
    expect(src).toContain("updateUser");
    expect(src).toContain("signOut");
    expect(src).not.toContain("jag_platform_session");
    expect(src).not.toContain("encodeJagPlatformSession");
  });
});

describe("AcademyOS compatibility", () => {
  it("requestPasswordResetAction remains available without next", async () => {
    const mod = await import(
      "@/lib/platform/identity/password-reset-actions"
    );
    expect(typeof mod.requestPasswordResetAction).toBe("function");
    expect(typeof mod.requestJagPasswordResetAction).toBe("function");
  });

  it("AcademyOS forgot form still exists as a separate surface", () => {
    const src = readFileSync(
      join(ROOT, "src/app/login/forgot/ForgotPasswordForm.tsx"),
      "utf8"
    );
    expect(src).toContain("resetPasswordForEmail");
  });
});
