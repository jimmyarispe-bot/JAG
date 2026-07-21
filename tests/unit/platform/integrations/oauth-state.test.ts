import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  createSignedOAuthState,
  parseSignedOAuthState,
} from "@/lib/platform/integrations/core/oauth-state";

describe("RC-6.04 signed OAuth state", () => {
  const prev = process.env.OAUTH_STATE_SECRET;

  beforeEach(() => {
    process.env.OAUTH_STATE_SECRET = "test-oauth-state-secret-32chars!!";
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.OAUTH_STATE_SECRET;
    else process.env.OAUTH_STATE_SECRET = prev;
  });

  it("round-trips org and user claims", () => {
    const state = createSignedOAuthState("gw", {
      organizationId: "org-1",
      userId: "user-1",
    });
    const claims = parseSignedOAuthState("gw", state);
    expect(claims?.organizationId).toBe("org-1");
    expect(claims?.userId).toBe("user-1");
  });

  it("rejects forged payload", () => {
    const state = createSignedOAuthState("gw", {
      organizationId: "org-1",
      userId: "user-1",
    });
    const parts = state.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({
        organizationId: "victim-org",
        userId: "user-1",
        exp: Date.now() + 60_000,
        n: "x",
      })
    ).toString("base64url");
    const forged = `${parts[0]}.${forgedPayload}.${parts[2]}`;
    expect(parseSignedOAuthState("gw", forged)).toBeNull();
  });

  it("rejects wrong prefix", () => {
    const state = createSignedOAuthState("gw", {
      organizationId: "org-1",
      userId: "user-1",
    });
    expect(parseSignedOAuthState("ms", state)).toBeNull();
  });
});
