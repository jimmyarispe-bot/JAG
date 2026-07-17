/**
 * Google Workspace OAuth 2.0 — admin consent, user consent, domain selection.
 */

import type { OAuth2Config } from "@/lib/platform/integrations/common/auth";

export const GOOGLE_WORKSPACE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/gmail.metadata",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/documents.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/tasks.readonly",
  "https://www.googleapis.com/auth/admin.directory.user.readonly",
  "https://www.googleapis.com/auth/admin.directory.group.readonly",
  "https://www.googleapis.com/auth/admin.directory.orgunit.readonly",
] as const;

export function googleWorkspaceOAuthConfig(input: {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  /** When true, request admin-level consent for domain-wide sync. */
  adminConsent?: boolean;
}): OAuth2Config {
  const authUrl = input.adminConsent
    ? "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent&hd="
    : "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent";

  return {
    clientId: input.clientId,
    clientSecret: input.clientSecret,
    authorizationUrl: authUrl,
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [...GOOGLE_WORKSPACE_OAUTH_SCOPES],
    redirectUri: input.redirectUri,
  };
}

export type GoogleWorkspaceDomain = {
  domain: string;
  customerId: string;
  displayName: string;
  adminEmail: string;
};

export type GoogleWorkspaceAuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  domain: string;
  consentType: "admin" | "user";
  domains: GoogleWorkspaceDomain[];
};
