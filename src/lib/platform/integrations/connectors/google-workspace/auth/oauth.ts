/**
 * Google Workspace OAuth 2.0 — uses Sprint 073 platform OAuth helpers.
 */

import {
  buildOAuthAuthorizeUrl,
  createOAuthState,
  type OAuth2Config,
} from "@/lib/platform/integrations/core/oauth";

export const GOOGLE_WORKSPACE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/gmail.metadata",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/documents.readonly",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/presentations.readonly",
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/tasks.readonly",
  "https://www.googleapis.com/auth/admin.directory.user.readonly",
  "https://www.googleapis.com/auth/admin.directory.group.readonly",
  "https://www.googleapis.com/auth/admin.directory.orgunit.readonly",
  // Google Classroom rides on this same connection rather than a second Google
  // login — one consent screen, one refresh token. An org connected before these
  // were added must reconnect once to grant them; until it does, Classroom calls
  // return 403 and the error says so.
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.rosters.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
  "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
  "https://www.googleapis.com/auth/classroom.profile.emails",
] as const;

export type GoogleWorkspaceOAuthConfig = OAuth2Config & {
  readonly clientSecret?: string;
};

export function googleWorkspaceOAuthConfig(input: {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  /** When true, request admin-level consent for domain-wide sync. */
  adminConsent?: boolean;
}): GoogleWorkspaceOAuthConfig & { clientSecret?: string } {
  // Preserve query hints on authorize URL for B4 Integration Center continuity.
  const authorizationUrl = input.adminConsent
    ? "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent&hd="
    : "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent";

  return {
    clientId: input.clientId,
    authorizationUrl,
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [...GOOGLE_WORKSPACE_OAUTH_SCOPES],
    redirectUri: input.redirectUri,
    clientSecret: input.clientSecret,
  };
}

export function buildGoogleWorkspaceAuthorizeUrl(
  config: GoogleWorkspaceOAuthConfig,
  options: {
    state?: string;
    adminConsent?: boolean;
    loginHint?: string;
    hostedDomain?: string;
  } = {}
): string {
  const state = options.state ?? createOAuthState("google");
  const extra: Record<string, string> = {
    access_type: "offline",
    prompt: "consent",
  };
  if (options.adminConsent) extra.prompt = "consent";
  if (options.loginHint) extra.login_hint = options.loginHint;
  if (options.hostedDomain) extra.hd = options.hostedDomain;

  return buildOAuthAuthorizeUrl(config, { state, extra });
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
