/** Google Workspace Connector™ — metadata sync types (no content parsing). */

export const GWS_CONNECTOR_ID = "google-workspace" as const;

export const GWS_SERVICES = [
  "Drive",
  "Calendar",
  "Gmail",
  "Contacts",
] as const;

export type GwsService = (typeof GWS_SERVICES)[number];

export type GwsTokenBundle = {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: string;
  readonly userEmail: string;
  readonly domain: string;
  readonly servicesEnabled: readonly GwsService[];
  readonly demo?: boolean;
};

export type GwsDriveFileMeta = {
  readonly id: string;
  readonly name: string;
  readonly mimeType: string;
  readonly kind: "pdf" | "docx" | "sheet" | "slides" | "folder" | "other";
  readonly modifiedTime: string;
  readonly parents: readonly string[];
  readonly webViewLink?: string;
};

export type GwsCalendarMeta = {
  readonly id: string;
  readonly summary: string;
  readonly primary?: boolean;
};

export type GwsCalendarEventMeta = {
  readonly id: string;
  readonly calendarId: string;
  readonly summary: string;
  readonly start: string;
  readonly end: string;
  readonly status: string;
};

export type GwsGmailMeta = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly subject: string;
  readonly timestamp: string;
  readonly labels: readonly string[];
};

export type GwsContactMeta = {
  readonly id: string;
  readonly displayName: string;
  readonly email: string | null;
  readonly organization: string | null;
};

export type GwsSyncBundle = {
  readonly drive: readonly GwsDriveFileMeta[];
  readonly calendars: readonly GwsCalendarMeta[];
  readonly events: readonly GwsCalendarEventMeta[];
  readonly messages: readonly GwsGmailMeta[];
  readonly contacts: readonly GwsContactMeta[];
};
