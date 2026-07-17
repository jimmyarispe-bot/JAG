/**
 * Authentication helpers — OAuth2, API key, service account shapes + token refresh.
 * Live token exchange is deferred; placeholders return structured AuthResult.
 */

import type { AuthMethod, AuthResult, ConnectorCredentials } from "@/lib/platform/integrations/common/types";
import { CredentialStore } from "@/lib/platform/integrations/common/auth/credential-store";

export { CredentialStore } from "@/lib/platform/integrations/common/auth/credential-store";

export type OAuth2Config = {
  clientId: string;
  clientSecret?: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
};

export type ApiKeyConfig = {
  headerName?: string;
  queryParam?: string;
};

export type ServiceAccountConfig = {
  clientEmail: string;
  privateKeyRef: string;
  scopes: string[];
};

export function buildOAuthAuthorizeUrl(
  config: OAuth2Config,
  state: string,
  extraParams: Record<string, string> = {}
): string {
  const url = new URL(config.authorizationUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes.join(" "));
  url.searchParams.set("state", state);
  for (const [k, v] of Object.entries(extraParams)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

/**
 * Placeholder token exchange — records credentials without calling vendor APIs.
 */
export async function authenticatePlaceholder(
  store: CredentialStore,
  input: {
    instanceId: string;
    method: AuthMethod;
    secrets?: Record<string, string>;
  }
): Promise<AuthResult> {
  if (input.method === "none") {
    return { ok: true, method: "none" };
  }

  const expiresAt = new Date(Date.now() + 3_600_000).toISOString();
  const credentials: ConnectorCredentials = {
    instanceId: input.instanceId,
    authMethod: input.method,
    secrets: input.secrets ?? { placeholder: "true" },
    accessToken: `placeholder-access-${input.instanceId}`,
    refreshToken: input.method === "oauth2" ? `placeholder-refresh-${input.instanceId}` : undefined,
    expiresAt,
    updatedAt: new Date().toISOString(),
  };
  store.put(credentials);

  return {
    ok: true,
    method: input.method,
    accessToken: credentials.accessToken,
    refreshToken: credentials.refreshToken,
    expiresAt,
  };
}

export async function refreshTokenPlaceholder(
  store: CredentialStore,
  instanceId: string
): Promise<AuthResult> {
  const existing = store.get(instanceId);
  if (!existing) {
    return { ok: false, method: "oauth2", error: "No credentials to refresh" };
  }
  if (existing.authMethod !== "oauth2" && existing.authMethod !== "service_account") {
    return { ok: true, method: existing.authMethod, accessToken: existing.accessToken };
  }
  if (!existing.refreshToken && existing.authMethod === "oauth2") {
    return { ok: false, method: "oauth2", error: "Missing refresh token" };
  }

  const expiresAt = new Date(Date.now() + 3_600_000).toISOString();
  store.put({
    ...existing,
    accessToken: `placeholder-access-refreshed-${instanceId}`,
    expiresAt,
    updatedAt: new Date().toISOString(),
  });

  return {
    ok: true,
    method: existing.authMethod,
    accessToken: `placeholder-access-refreshed-${instanceId}`,
    refreshToken: existing.refreshToken,
    expiresAt,
  };
}
