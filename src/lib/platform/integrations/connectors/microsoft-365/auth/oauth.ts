/**
 * Microsoft 365 OAuth 2.0 (Azure AD / Entra ID) — Sprint 073 helpers.
 */

import {
  buildOAuthAuthorizeUrl,
  createOAuthState,
  type OAuth2Config,
} from "@/lib/platform/integrations/core/oauth";

export const MICROSOFT_365_OAUTH_SCOPES = [
  "openid",
  "profile",
  "offline_access",
  "User.Read.All",
  "Mail.Read",
  "Calendars.Read",
  "Files.Read.All",
  "Sites.Read.All",
  "Chat.Read",
  "ChannelMessage.Read.All",
  "Team.ReadBasic.All",
  "Contacts.Read",
  "Group.Read.All",
  "OnlineMeetings.Read",
] as const;

export type Microsoft365OAuthConfig = OAuth2Config & {
  readonly clientSecret?: string;
  readonly tenant?: string;
};

export function microsoft365OAuthConfig(input: {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  tenant?: string;
}): Microsoft365OAuthConfig {
  const tenant = input.tenant ?? "common";
  return {
    clientId: input.clientId,
    clientSecret: input.clientSecret,
    authorizationUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    scopes: [...MICROSOFT_365_OAUTH_SCOPES],
    redirectUri: input.redirectUri,
    tenant,
  };
}

export function buildMicrosoft365AuthorizeUrl(
  config: Microsoft365OAuthConfig,
  options: { state?: string; loginHint?: string } = {}
): string {
  const state = options.state ?? createOAuthState("microsoft");
  const extra: Record<string, string> = { response_mode: "query" };
  if (options.loginHint) extra.login_hint = options.loginHint;
  return buildOAuthAuthorizeUrl(config, { state, extra });
}

export type Microsoft365Tenant = {
  tenantId: string;
  displayName: string;
  defaultDomain: string;
};

export type Microsoft365AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tenantId: string;
  tenantDomain: string;
  consentType: "admin" | "user";
  tenants: Microsoft365Tenant[];
};
