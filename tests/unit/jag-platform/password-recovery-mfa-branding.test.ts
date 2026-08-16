/**
 * JAG recovery MFA step-up + JAG email branding (AcademyOS template unchanged).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  jagPlatformPasswordResetEmailBrand,
  JAG_EXECUTIVE_PLATFORM_EMAIL_LABEL,
} from "@/lib/platform/auth-email/branding";
import {
  renderJagPasswordResetEmail,
  renderPasswordResetEmail,
} from "@/lib/platform/auth-email/templates";
import {
  isAal2RequiredErrorMessage,
  jagPasswordResetMfaRequiredPath,
  jagPasswordResetReturnPath,
  jagPasswordResetSuccessLoginHref,
  jagRecoveryDestination,
  passwordUpdateRequiresMfaStepUp,
} from "@/lib/jag-platform/password-reset-mfa";
import { platformDefaultEmailBrand } from "@/lib/platform/auth-email/branding";

const ROOT = process.cwd();

describe("JAG password-reset email branding", () => {
  it("A/B. uses JAG product branding and not AcademyOS copy", () => {
    const brand = jagPlatformPasswordResetEmailBrand();
    const rendered = renderJagPasswordResetEmail({
      brand,
      actionUrl:
        "https://preview.example/auth/callback?token_hash=abc&type=recovery&next=%2Fjag%2Flogin",
      recipientName: "Ada",
    });

    expect(brand.applicationName).toBe(JAG_EXECUTIVE_PLATFORM_EMAIL_LABEL);
    expect(brand.displayName).toBe(JAG_EXECUTIVE_PLATFORM_EMAIL_LABEL);
    expect(brand.fromName).toBe("The JAG™");
    expect(rendered.subject.toLowerCase()).toContain("jag");
    expect(rendered.html).toContain("The JAG™ Executive Intelligence Platform");
    expect(rendered.html.toLowerCase()).not.toContain("academyos");
    expect(rendered.html.toLowerCase()).not.toContain(
      "the academy way network of schools"
    );
    expect(rendered.text.toLowerCase()).not.toContain("academyos");
  });

  it("L. AcademyOS password-reset template remains distinct", () => {
    const academy = platformDefaultEmailBrand();
    const rendered = renderPasswordResetEmail({
      brand: academy,
      actionUrl: "https://app.example/auth/callback?token_hash=x&type=recovery",
    });
    expect(academy.applicationName).toBe("AcademyOS");
    expect(rendered.html).toContain(academy.displayName);
    expect(rendered.subject).toContain(academy.displayName);
  });
});

describe("JAG recovery MFA step-up", () => {
  it("D. AAL1 with nextLevel aal2 requires MFA before password update", async () => {
    const supabase = {
      auth: {
        mfa: {
          getAuthenticatorAssuranceLevel: async () => ({
            data: { currentLevel: "aal1", nextLevel: "aal2" },
            error: null,
          }),
        },
      },
    };
    expect(await passwordUpdateRequiresMfaStepUp(supabase)).toBe(true);
  });

  it("G. AAL2 session does not require MFA step-up", async () => {
    const supabase = {
      auth: {
        mfa: {
          getAuthenticatorAssuranceLevel: async () => ({
            data: { currentLevel: "aal2", nextLevel: "aal2" },
            error: null,
          }),
        },
      },
    };
    expect(await passwordUpdateRequiresMfaStepUp(supabase)).toBe(false);
  });

  it("E/F. MFA route returns to JAG reset, not establish or /jag home", () => {
    const path = jagPasswordResetMfaRequiredPath("/jag");
    expect(path.startsWith("/login/mfa-required?next=")).toBe(true);
    const next = new URL(path, "https://example.com").searchParams.get("next");
    expect(next).toBe("/jag/login/reset?next=%2Fjag");
    expect(path).not.toContain("auth/establish");
    expect(jagPasswordResetReturnPath("/jag")).toBe(
      "/jag/login/reset?next=%2Fjag"
    );
  });

  it("rejects open redirects in MFA return next", () => {
    expect(jagPasswordResetReturnPath("https://evil.example")).toBe(
      "/jag/login/reset?next=%2Fjag"
    );
  });

  it("JAG recovery destination is /jag and never /dashboard", () => {
    expect(jagRecoveryDestination("/jag")).toBe("/jag");
    expect(jagRecoveryDestination("/jag/login")).toBe("/jag");
    expect(jagRecoveryDestination("/jag/login/reset")).toBe("/jag");
    expect(jagRecoveryDestination("/dashboard")).toBe("/jag");
    expect(jagRecoveryDestination("https://evil.example")).toBe("/jag");
    expect(jagRecoveryDestination(null)).toBe("/jag");

    const success = jagPasswordResetSuccessLoginHref("/jag");
    expect(success).toBe("/jag/login?next=%2Fjag&reset=success");
    expect(success).not.toContain("/dashboard");
    expect(jagPasswordResetSuccessLoginHref("/jag/login")).toBe(
      "/jag/login?next=%2Fjag&reset=success"
    );
    expect(jagPasswordResetSuccessLoginHref("/dashboard")).toBe(
      "/jag/login?next=%2Fjag&reset=success"
    );
  });

  it("detects Supabase AAL2 password-update errors", () => {
    expect(
      isAal2RequiredErrorMessage(
        "AAL2 session is required to update email or password when MFA is enabled."
      )
    ).toBe(true);
  });
});

describe("client recovery surfaces (source invariants)", () => {
  it("I. reset form does not mint JAG session; routes MFA then signOut", () => {
    const src = readFileSync(
      join(ROOT, "src/components/jag-platform/JagResetPasswordForm.tsx"),
      "utf8"
    );
    expect(src).toContain("passwordUpdateRequiresMfaStepUp");
    expect(src).toContain("jagPasswordResetMfaRequiredPath");
    expect(src).toContain("signOut");
    expect(src).toContain("jagPasswordResetSuccessLoginHref");
    expect(src).not.toContain("encodeJagPlatformSession");
    expect(src).not.toContain("jag_platform_session");
    expect(src).not.toContain("auth/establish");
  });

  it("J. MFA form redirects to next path (supports JAG reset return)", () => {
    const src = readFileSync(
      join(ROOT, "src/app/login/mfa-required/MfaRequiredForm.tsx"),
      "utf8"
    );
    expect(src).toContain("window.location.href = nextPath");
    expect(src).toContain("challengeAndVerify");
    expect(src).toContain("loginPathForNext");
    expect(src).not.toContain("encodeJagPlatformSession");
    expect(src).not.toContain("auth/establish");
  });

  it("H. JAG forgot uses brandProfile jag", () => {
    const src = readFileSync(
      join(ROOT, "src/lib/platform/identity/password-reset-actions.ts"),
      "utf8"
    );
    expect(src).toContain('brandProfile: "jag"');
    expect(src).toContain("JAG_PLATFORM_HOME_PATH");
    expect(src).not.toContain("next: JAG_PLATFORM_LOGIN_PATH");
  });
});

describe("recovery link still carries JAG next", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("C. brandProfile jag still builds recovery callback with next=/jag/login", async () => {
    vi.resetModules();
    const sendTransactionalEmail = vi.fn(async () => ({
      success: true,
      id: "m1",
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
          data: { id: "user-1", email: "ada@example.com", userMetadata: {} },
        }),
        generateRecovery: async () => ({
          ok: true,
          data: { tokenHash: "hash123", actionLink: null },
        }),
      }),
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
      brandProfile: "jag",
    });
    expect(result).toEqual({ ok: true });
    const body = String(sendTransactionalEmail.mock.calls[0]?.[0]?.body ?? "");
    expect(body).toContain("type=recovery");
    expect(body).toContain("next=%2Fjag%2Flogin");
    expect(body).toContain("The JAG™ Executive Intelligence Platform");
    expect(body.toLowerCase()).not.toContain("academyos");
  });
});
