/**
 * Google Workspace entity object types synchronized into JAG.
 * Google Workspace remains the productivity system of record.
 * Default sync is metadata-only (no email bodies / document contents).
 */

export const GOOGLE_WORKSPACE_OBJECT_TYPES = [
  "message",
  "thread",
  "label",
  "attachment",
  "calendar_event",
  "drive_file",
  "drive_folder",
  "doc",
  "sheet",
  "slide",
  "contact",
  "meet",
  "task_list",
  "task",
  "directory_user",
  "directory_group",
  "organizational_unit",
] as const;

export type GoogleWorkspaceObjectType = (typeof GOOGLE_WORKSPACE_OBJECT_TYPES)[number];

export type GoogleWorkspaceEnvironment = "production";

export type GoogleWorkspaceRawEntity = {
  id: string;
  objectType: GoogleWorkspaceObjectType;
  organizationId: string;
  workspaceDomain: string;
  userId: string | null;
  updatedAt: string;
  version: number;
  payload: Record<string, unknown>;
};

export type GoogleWorkspaceCanonicalEntity = {
  id: string;
  externalId: string;
  organizationId: string;
  sourceSystem: "google-workspace";
  syncedAt: string;
  version: number;
  workspaceDomain: string;
  userId: string | null;
  objectType: GoogleWorkspaceObjectType;
  canonicalType: string;
  attributes: Record<string, unknown>;
};

export type GoogleWorkspacePrivacyPolicy = {
  /** Never store email bodies unless org policy enables this. Default false. */
  storeEmailBodies: boolean;
  /** Never store document contents unless org policy enables this. Default false. */
  storeDocumentContents: boolean;
};

export const DEFAULT_GOOGLE_WORKSPACE_PRIVACY: GoogleWorkspacePrivacyPolicy = {
  storeEmailBodies: false,
  storeDocumentContents: false,
};

/** Knowledge-graph canonical entity kinds (never raw Google objects). */
export const GOOGLE_WORKSPACE_KG_KINDS = [
  "Person",
  "Meeting",
  "CalendarEvent",
  "Attendee",
  "Room",
  "Resource",
  "Communication",
  "Email",
  "Conversation",
  "Attachment",
  "Document",
  "Folder",
  "Owner",
  "Permission",
  "Revision",
  "Task",
  "Organization",
] as const;

export type GoogleWorkspaceKgKind = (typeof GOOGLE_WORKSPACE_KG_KINDS)[number];
