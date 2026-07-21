/**
 * Drive OAuth scopes — metadata-only (no file contents).
 */

export const DRIVE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/drive.metadata.readonly",
] as const;

export type DriveOAuthScope = (typeof DRIVE_OAUTH_SCOPES)[number];
