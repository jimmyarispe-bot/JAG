/**
 * Google Workspace OAuth 2.0 for The JAG™ Connector Framework™.
 * Uses jag-platform callback — separate from AcademyOS /api/integrations/google.
 */

import {
  createSignedOAuthState,
  parseSignedOAuthState,
} from "@/lib/platform/integrations/core/oauth-state";
import {
  googleWorkspaceJagAuthorizeUrl,
  googleWorkspaceJagClientConfig,
} from "@/lib/connectors/google-workspace/config";
import type { GwsTokenBundle } from "@/lib/connectors/google-workspace/types";
import { GWS_SERVICES } from "@/lib/connectors/google-workspace/types";

const STATE_PREFIX = "gws";

export function createGoogleWorkspaceOAuthState(input: {
  organizationId: string;
  userId: string;
}): string {
  return createSignedOAuthState(STATE_PREFIX, input);
}

export function parseGoogleWorkspaceOAuthState(state: string) {
  return parseSignedOAuthState(STATE_PREFIX, state);
}

export function buildGoogleWorkspaceJagAuthorizeUrl(input: {
  organizationId: string;
  userId: string;
}): { authorizeUrl: string } | { error: string } {
  const cfg = googleWorkspaceJagClientConfig();
  if (!cfg.configured) {
    return {
      error:
        "Google Workspace OAuth is not configured. Set GOOGLE_WORKSPACE_CLIENT_ID and GOOGLE_WORKSPACE_CLIENT_SECRET, or use demo connect.",
    };
  }
  const state = createGoogleWorkspaceOAuthState(input);
  return {
    authorizeUrl: googleWorkspaceJagAuthorizeUrl({
      state,
      clientId: cfg.clientId,
      redirectUri: cfg.redirectUri,
    }),
  };
}

type TokenJson = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

async function tokenRequest(
  body: URLSearchParams
): Promise<
  | { ok: true; accessToken: string; refreshToken: string; expiresAt: string }
  | { ok: false; error: string }
> {
  const cfg = googleWorkspaceJagClientConfig();
  let response: Response;
  try {
    response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Token request failed.",
    };
  }
  const text = await response.text();
  let json: TokenJson = {};
  try {
    json = JSON.parse(text) as TokenJson;
  } catch {
    return { ok: false, error: "Invalid token response from Google." };
  }
  if (!response.ok || !json.access_token) {
    return {
      ok: false,
      error: json.error_description || json.error || "Token exchange failed.",
    };
  }
  const expiresIn = Number(json.expires_in ?? 3600);
  return {
    ok: true,
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? "",
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  };
}

export async function exchangeGoogleWorkspaceJagCode(input: {
  code: string;
  userEmail?: string;
  domain?: string;
}): Promise<{ ok: true; tokens: GwsTokenBundle } | { ok: false; error: string }> {
  const cfg = googleWorkspaceJagClientConfig();
  const result = await tokenRequest(
    new URLSearchParams({
      code: input.code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      grant_type: "authorization_code",
    })
  );
  if (!result.ok) return result;
  if (!result.refreshToken) {
    return {
      ok: false,
      error: "Google did not return a refresh token. Re-consent with prompt=consent.",
    };
  }
  const email = input.userEmail ?? "user@example.com";
  const domain = input.domain ?? email.split("@")[1] ?? "example.com";
  return {
    ok: true,
    tokens: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      userEmail: email,
      domain,
      servicesEnabled: GWS_SERVICES,
      demo: false,
    },
  };
}

export async function refreshGoogleWorkspaceJagTokens(
  refreshToken: string
): Promise<
  | { ok: true; accessToken: string; refreshToken: string; expiresAt: string }
  | { ok: false; error: string }
> {
  const cfg = googleWorkspaceJagClientConfig();
  const result = await tokenRequest(
    new URLSearchParams({
      refresh_token: refreshToken,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      grant_type: "refresh_token",
    })
  );
  if (!result.ok) return result;
  return {
    ok: true,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken || refreshToken,
    expiresAt: result.expiresAt,
  };
}

export function createDemoGoogleWorkspaceTokens(input?: {
  userEmail?: string;
  domain?: string;
}): GwsTokenBundle {
  const email = input?.userEmail ?? "founder@demo.academy";
  return {
    accessToken: `demo-gws-access-${Date.now()}`,
    refreshToken: `demo-gws-refresh-${Date.now()}`,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    userEmail: email,
    domain: input?.domain ?? email.split("@")[1] ?? "demo.academy",
    servicesEnabled: GWS_SERVICES,
    demo: true,
  };
}

export function isGoogleTokenExpired(expiresAt: string, skewMs = 60_000): boolean {
  return Date.parse(expiresAt) <= Date.now() + skewMs;
}
