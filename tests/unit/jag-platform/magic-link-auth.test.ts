/**
 * JAG branded magic-link auth (Admin generateLink + Resend + establish gates).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAuthEmailCallbackLink,
  resolveTrustedAuthAppUrl,
} from "@/lib/platform/auth-email/links";
import {
  jagPlatformAuthEmailBrand,
  JAG_EXECUTIVE_PLATFORM_EMAIL_LABEL,
} from "@/lib/platform/auth-email/branding";
import { renderJagMagicLinkEmail } from "@/lib/platform/auth-email/templates";
import {
  isJagAuthCallbackContext,
  isMagicLinkAuthType,
  jagMagicLinkEstablishPath,
  resolveAuthCallbackRedirect,
} from "@/lib/auth/auth-callback";
import type { User } from "@supabase/supabase-js";

const ROOT = process.cwd();

function userWith(meta: Record<string, unknown> = {}): User {
  return { id: "u1", user_metadata: meta } as User;
}

describe("JAG magic-link email branding", () => {
  it("E. uses JAG product branding and not AcademyOS / Supabase / School Platform", () => {
    const brand = jagPlatformAuthEmailBrand();
    const rendered = renderJagMagicLinkEmail({
      brand,
      actionUrl:
        "https://preview.example/auth/callback?token_hash=abc&type=magiclink&next=%2Fjag",
      recipientName: "Ada",
    });

    expect(brand.applicationName).toBe(JAG_EXECUTIVE_PLATFORM_EMAIL_LABEL);
    expect(rendered.subject.toLowerCase()).toContain("jag");
    expect(rendered.html).toContain("The JAG™ Executive Intelligence Platform");
    expect(rendered.html.toLowerCase()).not.toContain("academyos");
    expect(rendered.html.toLowerCase()).not.toContain("school platform");
    expect(rendered.html.toLowerCase()).not.toContain("supabase");
    expect(rendered.html.toLowerCase()).not.toContain(
      "the academy way network of schools"
    );
  });
});

describe("JAG magic-link callback context", () => {
  it("F/O. magiclink + /jag routes to establish, never /dashboard", () => {
    expect(isMagicLinkAuthType("magiclink")).toBe(true);
    expect(isJagAuthCallbackContext("/jag")).toBe(true);
    expect(isJagAuthCallbackContext("/jag/login")).toBe(true);
    expect(isJagAuthCallbackContext("/dashboard")).toBe(false);

    const path = resolveAuthCallbackRedirect({
      type: "magiclink",
      next: "/jag",
      user: userWith({}),
    });
    expect(path).toBe(jagMagicLinkEstablishPath("/jag"));
    expect(path.startsWith("/api/jag-platform/auth/establish")).toBe(true);
    expect(path).toContain("next=%2Fjag");
    expect(path).not.toContain("/dashboard");
    expect(path).not.toContain("/login?");
  });

  it("P. non-JAG magiclink keeps AcademyOS default /dashboard", () => {
    expect(
      resolveAuthCallbackRedirect({
        type: "magiclink",
        next: null,
        user: userWith({}),
      })
    ).toBe("/dashboard");
  });

  it("T. AcademyOS recovery remains on AcademyOS reset path", () => {
    expect(
      resolveAuthCallbackRedirect({
        type: "recovery",
        next: "/dashboard",
        user: userWith({}),
      })
    ).toBe(`/login/reset-required?next=${encodeURIComponent("/dashboard")}`);
  });
});

describe("client / source invariants", () => {
  it("A/B. login form uses server action and never signInWithOtp", () => {
    const src = readFileSync(
      join(ROOT, "src/components/jag-platform/JagLoginForm.tsx"),
      "utf8"
    );
    expect(src).toContain("requestJagMagicLinkAction");
    expect(src).toContain("Send a magic link");
    expect(src).not.toContain("signInWithOtp");
    expect(src).not.toContain("resetPasswordForEmail");
  });

  it("K/L/N. establish signs out on denial; mints session only after authz", () => {
    const establish = readFileSync(
      join(ROOT, "src/app/api/jag-platform/auth/establish/route.ts"),
      "utf8"
    );
    expect(establish).toContain("completeJagAuthorization");
    expect(establish).toContain("signOut");
    expect(establish).toContain("encodeJagPlatformSession");
    expect(establish.indexOf("completeJagAuthorization")).toBeLessThan(
      establish.indexOf("encodeJagPlatformSession")
    );

    const login = readFileSync(
      join(ROOT, "src/lib/jag-platform/login.ts"),
      "utf8"
    );
    expect(login).toContain("authorizeJagEntry");
    expect(login).toContain("evaluateJagMfaGate");
  });

  it("M. MFA gate still points at establish for entitled users", () => {
    const login = readFileSync(
      join(ROOT, "src/lib/jag-platform/login.ts"),
      "utf8"
    );
    expect(login).toContain("jagMfaRequiredPath(establishNext)");
    expect(login).toContain("JAG_SESSION_ESTABLISH_PATH");
  });
});

describe("requestJagMagicLinkViaAuthEmail integration", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.thejag.org");
    vi.stubEnv("VERCEL_ENV", "preview");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("I. unknown email returns neutral success without generate/send", async () => {
    vi.resetModules();
    const generateMagicLink = vi.fn();
    const sendTransactionalEmail = vi.fn();
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
      getAdminAuthenticationService: () => ({ generateMagicLink }),
    }));
    vi.doMock("@/lib/platform/email/send", () => ({
      sendTransactionalEmail,
    }));

    const { requestJagMagicLinkViaAuthEmail } = await import(
      "@/lib/platform/auth-email/service"
    );
    const result = await requestJagMagicLinkViaAuthEmail({
      email: "nobody@example.com",
      next: "/jag",
      originHint: "https://jag-preview.vercel.app",
    });
    expect(result).toEqual({ ok: true });
    expect(generateMagicLink).not.toHaveBeenCalled();
    expect(sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it("C/D/E/F/G. generateLink magiclink + Resend JAG body on Preview origin", async () => {
    vi.resetModules();
    const generateMagicLink = vi.fn(async () => ({
      ok: true as const,
      data: { tokenHash: "ml_hash", actionLink: null },
    }));
    const sendTransactionalEmail = vi.fn(async () => ({
      success: true,
      id: "msg-1",
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
        generateMagicLink,
      }),
    }));
    vi.doMock("@/lib/platform/email/send", () => ({
      sendTransactionalEmail,
    }));

    const { requestJagMagicLinkViaAuthEmail } = await import(
      "@/lib/platform/auth-email/service"
    );
    const result = await requestJagMagicLinkViaAuthEmail({
      email: "ada@example.com",
      next: "/jag",
      originHint: "https://jag-abc123.vercel.app",
    });
    expect(result).toEqual({ ok: true });
    expect(generateMagicLink).toHaveBeenCalledWith(
      "ada@example.com",
      expect.objectContaining({
        redirectTo: "https://jag-abc123.vercel.app/auth/callback",
      })
    );

    const body = String(sendTransactionalEmail.mock.calls[0]?.[0]?.body ?? "");
    const subject = String(
      sendTransactionalEmail.mock.calls[0]?.[0]?.subject ?? ""
    );
    expect(subject.toLowerCase()).toContain("jag");
    expect(body).toContain("type=magiclink");
    expect(body).toContain("next=%2Fjag");
    expect(body).toContain("https://jag-abc123.vercel.app/auth/callback");
    expect(body).toContain("The JAG™ Executive Intelligence Platform");
    expect(body.toLowerCase()).not.toContain("academyos");
    expect(body.toLowerCase()).not.toContain("school platform");
  });

  it("H. rejects arbitrary origin for link host on production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    expect(resolveTrustedAuthAppUrl("https://evil.example")).toBe(
      "https://www.thejag.org"
    );
  });

  it("callback link shape includes magiclink + /jag", () => {
    const link = buildAuthEmailCallbackLink({
      tokenHash: "tok",
      type: "magiclink",
      next: "/jag",
      appUrl: "https://jag-preview.vercel.app",
    });
    const url = new URL(link);
    expect(url.searchParams.get("type")).toBe("magiclink");
    expect(url.searchParams.get("next")).toBe("/jag");
  });
});

describe("server action rate-limit / enumeration shape", () => {
  it("J. magic-link action rate-limits with neutral success", () => {
    const src = readFileSync(
      join(ROOT, "src/lib/platform/identity/magic-link-actions.ts"),
      "utf8"
    );
    expect(src).toContain("checkRateLimitAsync");
    expect(src).toContain("magiclink:ip:");
    expect(src).toContain("magiclink:email:");
    expect(src).toContain("return { ok: true }");
    expect(src).toContain("requestJagMagicLinkViaAuthEmail");
  });
});
