import { describe, expect, it } from "vitest";
import {
  buildMicrosoftConnectAuthorizeUrl,
  parseMicrosoftOAuthState,
  microsoft365RedirectUri,
} from "@/lib/platform/integrations/connections";

describe("RC-3.01 — Microsoft 365 OAuth Installation", () => {
  it("builds Entra authorize URL when client credentials are configured", () => {
    const prevId = process.env.MICROSOFT_365_CLIENT_ID;
    const prevSecret = process.env.MICROSOFT_365_CLIENT_SECRET;
    process.env.MICROSOFT_365_CLIENT_ID = "ms-client-demo";
    process.env.MICROSOFT_365_CLIENT_SECRET = "ms-secret-demo";
    process.env.NEXT_PUBLIC_APP_URL = "https://jag.local";

    try {
      const result = buildMicrosoftConnectAuthorizeUrl({
        organizationId: "org-1",
        userId: "user-1",
      });
      expect("error" in result).toBe(false);
      if ("error" in result) return;
      expect(result.authorizeUrl).toContain("login.microsoftonline.com");
      expect(result.authorizeUrl).toContain("client_id=ms-client-demo");
      expect(result.authorizeUrl).toContain(
        encodeURIComponent(microsoft365RedirectUri())
      );
      const parsed = parseMicrosoftOAuthState(result.state);
      expect(parsed).toEqual({ organizationId: "org-1", userId: "user-1" });
    } finally {
      process.env.MICROSOFT_365_CLIENT_ID = prevId;
      process.env.MICROSOFT_365_CLIENT_SECRET = prevSecret;
    }
  });

  it("returns a clear error when OAuth is not configured", () => {
    const prevId = process.env.MICROSOFT_365_CLIENT_ID;
    const prevSecret = process.env.MICROSOFT_365_CLIENT_SECRET;
    const prevAzId = process.env.AZURE_AD_CLIENT_ID;
    const prevAzSecret = process.env.AZURE_AD_CLIENT_SECRET;
    const prevMsId = process.env.MICROSOFT_CLIENT_ID;
    const prevMsSecret = process.env.MICROSOFT_CLIENT_SECRET;
    delete process.env.MICROSOFT_365_CLIENT_ID;
    delete process.env.MICROSOFT_365_CLIENT_SECRET;
    delete process.env.AZURE_AD_CLIENT_ID;
    delete process.env.AZURE_AD_CLIENT_SECRET;
    delete process.env.MICROSOFT_CLIENT_ID;
    delete process.env.MICROSOFT_CLIENT_SECRET;

    try {
      const result = buildMicrosoftConnectAuthorizeUrl({
        organizationId: "org-1",
        userId: "user-1",
      });
      expect(result).toMatchObject({ error: expect.stringContaining("not configured") });
    } finally {
      process.env.MICROSOFT_365_CLIENT_ID = prevId;
      process.env.MICROSOFT_365_CLIENT_SECRET = prevSecret;
      process.env.AZURE_AD_CLIENT_ID = prevAzId;
      process.env.AZURE_AD_CLIENT_SECRET = prevAzSecret;
      process.env.MICROSOFT_CLIENT_ID = prevMsId;
      process.env.MICROSOFT_CLIENT_SECRET = prevMsSecret;
    }
  });
});
