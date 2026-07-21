/**
 * Microsoft 365 → JAG canonical types.
 * MUST match Google Workspace strings exactly for Copilot neutrality.
 */

import type {
  Microsoft365KgKind,
  Microsoft365ObjectType,
} from "@/lib/platform/integrations/connectors/microsoft-365/entities";

/** Same canonical type strings as Google Workspace. */
export const CANONICAL_TYPE: Record<Microsoft365ObjectType, string> = {
  message: "comms.email",
  thread: "comms.conversation",
  attachment: "comms.attachment",
  calendar_event: "comms.calendar_event",
  onedrive_file: "document.file",
  onedrive_folder: "document.folder",
  sharepoint_file: "document.file",
  sharepoint_site: "document.folder",
  meet: "comms.meeting",
  chat: "comms.message",
  team: "person.group",
  channel: "person.group",
  contact: "person.contact",
  directory_user: "person.user",
  directory_group: "person.group",
  task: "work.task",
};

export const KG_KIND_FOR_OBJECT: Partial<
  Record<Microsoft365ObjectType, Microsoft365KgKind>
> = {
  message: "Communication",
  thread: "Communication",
  attachment: "Communication",
  chat: "Communication",
  calendar_event: "Meeting",
  meet: "Meeting",
  onedrive_file: "Document",
  onedrive_folder: "Document",
  sharepoint_file: "Document",
  sharepoint_site: "Document",
  contact: "Person",
  directory_user: "Person",
  directory_group: "Organization",
  team: "Organization",
  channel: "Organization",
  task: "Task",
};

export function microsoft365CanonicalType(objectType: string): string {
  return (
    CANONICAL_TYPE[objectType as Microsoft365ObjectType] ?? `microsoft-365.${objectType}`
  );
}

export function microsoft365KgKind(objectType: string): Microsoft365KgKind | null {
  return KG_KIND_FOR_OBJECT[objectType as Microsoft365ObjectType] ?? null;
}
