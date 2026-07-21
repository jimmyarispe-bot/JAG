/**
 * Gmail OAuth scopes — metadata-only by default (no message body access).
 * Aligns with privacy policy storeEmailBodies: false.
 */

export const GMAIL_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/gmail.metadata",
] as const;

export type GmailOAuthScope = (typeof GMAIL_OAUTH_SCOPES)[number];

/** Optional elevated scopes — never requested by default. */
export const GMAIL_ELEVATED_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
] as const;
