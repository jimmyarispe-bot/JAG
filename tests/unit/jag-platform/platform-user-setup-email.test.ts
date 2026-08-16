/**
 * New JAG-only users get the existing /jag/login/forgot recovery email.
 * Existing users granted JAG access do not.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { JAG_PLATFORM_HOME_PATH } from "@/lib/jag-platform/auth";
import {
  formatJagPlatformProvisionMessage,
  jagNewUserSetupEmailRequest,
} from "@/lib/jag-platform/platform-users";
import { resolveAuthCallbackRedirect } from "@/lib/auth/auth-callback";
import type { User } from "@supabase/supabase-js";

const ROOT = process.cwd();

describe("JAG new-user setup email request", () => {
  it("reuses JAG recovery with next=/jag and reportDelivery", () => {
    const request = jagNewUserSetupEmailRequest(
      "ada@example.com",
      "https://staging.thejag.org"
    );
    expect(request).toEqual({
      email: "ada@example.com",
      next: JAG_PLATFORM_HOME_PATH,
      originHint: "https://staging.thejag.org",
      brandProfile: "jag",
      reportDelivery: true,
    });
    expect(request.next).toBe("/jag");
    expect(request.next).not.toBe("/dashboard");
    expect(request.brandProfile).not.toBe("default");
  });

  it("routes recovery next=/jag into the JAG password setup flow", () => {
    const path = resolveAuthCallbackRedirect({
      type: "recovery",
      next: "/jag",
      user: { id: "u1", user_metadata: {} } as User,
    });
    expect(path).toBe(`/jag/login/reset?next=${encodeURIComponent("/jag")}`);
    expect(path).not.toContain("/dashboard");
    expect(path).not.toContain("/login/reset-required");
  });
});

describe("administrator-facing provision messages", () => {
  it("new user success names the recipient", () => {
    expect(
      formatJagPlatformProvisionMessage({
        email: "ada@example.com",
        created: true,
        setupEmailSent: true,
      })
    ).toBe(
      "JAG access granted. A password setup email was sent to ada@example.com."
    );
  });

  it("existing user grant does not mention email", () => {
    expect(
      formatJagPlatformProvisionMessage({
        email: "ada@example.com",
        created: false,
      })
    ).toBe("JAG access granted.");
  });

  it("email failure keeps the grant and hides provider details", () => {
    const message = formatJagPlatformProvisionMessage({
      email: "ada@example.com",
      created: true,
      setupEmailSent: false,
    });
    expect(message).toBe(
      "JAG access granted, but the setup email could not be sent."
    );
    expect(message).not.toContain("resend");
    expect(message).not.toContain("API key");
    expect(message).not.toContain("SUPABASE");
  });
});

describe("provision source path", () => {
  it("sends recovery only after a new auth identity is created", () => {
    const src = readFileSync(
      join(ROOT, "src/lib/jag-platform/platform-users.ts"),
      "utf8"
    );
    expect(src).toContain("auth.admin.createUser");
    expect(src).toContain("finalizeNewJagOnlyIdentity");
    expect(src).toContain("sendJagNewUserSetupEmail");
    expect(src).toContain("requestPasswordResetViaAuthEmail");
    expect(src).toContain("jagNewUserSetupEmailRequest");
    expect(src).toContain("JAG_PLATFORM_HOME_PATH");
    expect(src).toContain('brandProfile: "jag"');
    expect(src).toContain("reportDelivery: true");
    expect(src.lastIndexOf("sendJagNewUserSetupEmail")).toBeGreaterThan(
      src.lastIndexOf("finalizeNewJagOnlyIdentity")
    );
    expect(src.lastIndexOf("sendJagNewUserSetupEmail")).toBeGreaterThan(
      src.indexOf("auth.admin.createUser")
    );
    expect(src).not.toContain("inviteUserByEmail");
  });

  it("grant-only path does not request recovery email", () => {
    const src = readFileSync(
      join(ROOT, "src/lib/jag-platform/platform-users.ts"),
      "utf8"
    );
    const grantFn = src.slice(
      src.indexOf("export async function grantJagPlatformAccess"),
      src.indexOf("export async function revokeJagPlatformAccess")
    );
    expect(grantFn).toContain("user_roles");
    expect(grantFn).not.toContain("sendJagNewUserSetupEmail");
    expect(grantFn).not.toContain("requestPasswordResetViaAuthEmail");
    expect(grantFn).not.toContain("inviteUserByEmail");
    expect(src).toContain(
      "return grantJagPlatformAccess({ userId: existingProfile.id, role });"
    );
  });

  it("UI uses the administrator message from the provision action", () => {
    const view = readFileSync(
      join(ROOT, "src/components/jag-platform/JagPlatformUsersView.tsx"),
      "utf8"
    );
    const actions = readFileSync(
      join(ROOT, "src/lib/jag-platform/platform-users-actions.ts"),
      "utf8"
    );
    expect(view).toContain("result.message");
    expect(actions).toContain("formatJagPlatformProvisionMessage");
    expect(actions).toContain("originHint");
    expect(actions).not.toContain("inviteUserByEmail");
  });
});
