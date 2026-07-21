import { describe, expect, it } from "vitest";
import {
  buildGoogleConnectAuthorizeUrl,
  parseGoogleOAuthState,
  googleWorkspaceRedirectUri,
} from "@/lib/platform/integrations/connections";

describe("RC-2.01 — Google Workspace OAuth Installation", () => {
  it("builds authorize URL when client credentials are configured", () => {
    const prevId = process.env.GOOGLE_WORKSPACE_CLIENT_ID;
    const prevSecret = process.env.GOOGLE_WORKSPACE_CLIENT_SECRET;
    process.env.GOOGLE_WORKSPACE_CLIENT_ID = "google-client-demo";
    process.env.GOOGLE_WORKSPACE_CLIENT_SECRET = "google-secret-demo";
    process.env.NEXT_PUBLIC_APP_URL = "https://jag.local";

    try {
      const result = buildGoogleConnectAuthorizeUrl({
        organizationId: "org-1",
        userId: "user-1",
      });
      expect("error" in result).toBe(false);
      if ("error" in result) return;
      expect(result.authorizeUrl).toContain("accounts.google.com");
      expect(result.authorizeUrl).toContain("client_id=google-client-demo");
      expect(result.authorizeUrl).toContain(
        encodeURIComponent(googleWorkspaceRedirectUri())
      );
      const parsed = parseGoogleOAuthState(result.state);
      expect(parsed).toEqual({ organizationId: "org-1", userId: "user-1" });
    } finally {
      process.env.GOOGLE_WORKSPACE_CLIENT_ID = prevId;
      process.env.GOOGLE_WORKSPACE_CLIENT_SECRET = prevSecret;
    }
  });

  it("returns a clear error when OAuth is not configured", () => {
    const prevId = process.env.GOOGLE_WORKSPACE_CLIENT_ID;
    const prevSecret = process.env.GOOGLE_WORKSPACE_CLIENT_SECRET;
    const prevGid = process.env.GOOGLE_CLIENT_ID;
    const prevGsecret = process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_WORKSPACE_CLIENT_ID;
    delete process.env.GOOGLE_WORKSPACE_CLIENT_SECRET;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    try {
      const result = buildGoogleConnectAuthorizeUrl({
        organizationId: "org-1",
        userId: "user-1",
      });
      expect(result).toMatchObject({ error: expect.stringContaining("not configured") });
    } finally {
      process.env.GOOGLE_WORKSPACE_CLIENT_ID = prevId;
      process.env.GOOGLE_WORKSPACE_CLIENT_SECRET = prevSecret;
      process.env.GOOGLE_CLIENT_ID = prevGid;
      process.env.GOOGLE_CLIENT_SECRET = prevGsecret;
    }
  });
});
