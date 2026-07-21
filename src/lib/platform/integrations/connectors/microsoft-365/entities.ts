/**
 * Microsoft 365 entity object types.
 * Canonical types match Google Workspace exactly so Copilot cannot tell providers apart.
 */

export const MICROSOFT_365_OBJECT_TYPES = [
  "message",
  "thread",
  "attachment",
  "calendar_event",
  "onedrive_file",
  "onedrive_folder",
  "sharepoint_file",
  "sharepoint_site",
  "meet",
  "chat",
  "team",
  "channel",
  "contact",
  "directory_user",
  "directory_group",
  "task",
] as const;

export type Microsoft365ObjectType = (typeof MICROSOFT_365_OBJECT_TYPES)[number];

export type Microsoft365RawEntity = {
  id: string;
  objectType: Microsoft365ObjectType;
  organizationId: string;
  tenantDomain: string;
  userId: string | null;
  updatedAt: string;
  version: number;
  payload: Record<string, unknown>;
};

export type Microsoft365CanonicalEntity = {
  id: string;
  externalId: string;
  organizationId: string;
  sourceSystem: "microsoft-365";
  syncedAt: string;
  version: number;
  tenantDomain: string;
  userId: string | null;
  objectType: Microsoft365ObjectType;
  /** Same strings as Google Workspace (comms.message, comms.event, …). */
  canonicalType: string;
  attributes: Record<string, unknown>;
};

export type Microsoft365PrivacyPolicy = {
  storeEmailBodies: boolean;
  storeDocumentContents: boolean;
  storeChatBodies: boolean;
};

export const DEFAULT_MICROSOFT_365_PRIVACY: Microsoft365PrivacyPolicy = {
  storeEmailBodies: false,
  storeDocumentContents: false,
  storeChatBodies: false,
};

/** Identical KG kinds to Google Workspace. */
export const MICROSOFT_365_KG_KINDS = [
  "Person",
  "Meeting",
  "Communication",
  "Document",
  "Task",
  "Organization",
] as const;

export type Microsoft365KgKind = (typeof MICROSOFT_365_KG_KINDS)[number];
