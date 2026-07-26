import { describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import {
  authCallbackRedirectTo,
  buildEmailAuthCallbackLink,
  exchangeAuthCallbackParams,
  isPasswordSetupAuthType,
  isInviteAuthType,
  isRecoveryAuthType,
  resolveAuthCallbackRedirect,
  safeInternalPath,
} from "@/lib/auth/auth-callback";

import { ACCOUNT_ACTIVATE_PATH } from "@/lib/auth/account-activation";
import { PASSWORD_RESET_PATH } from "@/lib/auth/must-reset-password";

function userWith(meta: Record<string, unknown>): User {
  return { id: "u1", user_metadata: meta } as User;
}

describe("auth-callback helpers", () => {
  it("builds the SSR callback redirect target for generateLink", () => {
    expect(authCallbackRedirectTo("https://app.example.com/")).toBe(
      "https://app.example.com/auth/callback"
    );
  });

  it("builds email links with token_hash and type for verifyOtp", () => {
    const link = buildEmailAuthCallbackLink({
      appUrl: "https://app.example.com",
      tokenHash: "abc123",
      type: "invite",
    });
    const url = new URL(link);
    expect(url.pathname).toBe("/auth/callback");
    expect(url.searchParams.get("token_hash")).toBe("abc123");
    expect(url.searchParams.get("type")).toBe("invite");
  });

  it("rejects open redirects", () => {
    expect(safeInternalPath("https://evil.example")).toBe("/dashboard");
    expect(safeInternalPath("//evil.example")).toBe("/dashboard");
    expect(safeInternalPath("/dashboard/admin")).toBe("/dashboard/admin");
  });

  it("detects invite vs recovery auth types", () => {
    expect(isInviteAuthType("invite")).toBe(true);
    expect(isRecoveryAuthType("recovery")).toBe(true);
    expect(isInviteAuthType("recovery")).toBe(false);
  });

  it("routes invite acceptance to account activation (not login or reset)", () => {
    expect(
      resolveAuthCallbackRedirect({
        type: "invite",
        next: "/dashboard",
user: userWith({
  invite_activation: true,
  must_reset_password: true,
}),
      })
    ).toBe(`${PASSWORD_RESET_PATH}?next=${encodeURIComponent("/dashboard")}`);
  });
  it("routes must_reset_password users to password creation even without type", () => {
  it("routes invite_activation metadata to activation even without type", () => {
    expect(
      resolveAuthCallbackRedirect({
        type: null,
        next: "/exec",
        user: userWith({ invite_activation: true, must_reset_password: true }),
      })
    ).toBe(`${ACCOUNT_ACTIVATE_PATH}?next=${encodeURIComponent("/exec")}`);
  });

  it("honors next for users who do not need password setup", () => {
    expect(
      resolveAuthCallbackRedirect({
        type: "email",
        next: "/portal",
        user: userWith({ must_reset_password: false }),
      })
    ).toBe("/portal");
  });

  it("exchanges token_hash via verifyOtp", async () => {
    const verifyOtp = vi.fn(async () => ({
      data: { user: userWith({ must_reset_password: true, invite_activation: true }) },
      error: null,
    }));
    const result = await exchangeAuthCallbackParams(
      { auth: { exchangeCodeForSession: vi.fn(), verifyOtp } },
      { code: null, tokenHash: "tok", type: "invite" }
    );
    expect(result.ok).toBe(true);
    expect(verifyOtp).toHaveBeenCalledWith({
      type: "invite",
      token_hash: "tok",
    });
  });

  it("exchanges PKCE code via exchangeCodeForSession", async () => {
    const exchangeCodeForSession = vi.fn(async () => ({
      data: { user: userWith({}) },
      error: null,
    }));
    const result = await exchangeAuthCallbackParams(
      { auth: { exchangeCodeForSession, verifyOtp: vi.fn() } },
      { code: "pkce-code", tokenHash: null, type: null }
    );
    expect(result.ok).toBe(true);
    expect(exchangeCodeForSession).toHaveBeenCalledWith("pkce-code");
  });

  it("fails when auth params are missing", async () => {
    const result = await exchangeAuthCallbackParams(
      {
        auth: {
          exchangeCodeForSession: vi.fn(),
          verifyOtp: vi.fn(),
        },
      },
      { code: null, tokenHash: null, type: null }
    );
    expect(result).toEqual({ ok: false, error: "Missing code or token_hash" });
  });
});
