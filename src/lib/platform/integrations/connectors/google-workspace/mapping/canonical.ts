/**
 * Object-type → canonical type mapping. Never exposes raw Google objects.
 */

import type { GoogleWorkspaceObjectType } from "@/lib/platform/integrations/connectors/google-workspace/entities";
import type { GoogleWorkspaceKgKind } from "@/lib/platform/integrations/connectors/google-workspace/entities";

export const CANONICAL_TYPE: Record<GoogleWorkspaceObjectType, string> = {
  message: "comms.email",
  label: "comms.label",
  thread: "comms.conversation",
  attachment: "comms.attachment",
  calendar_event: "comms.calendar_event",
  drive_file: "document.file",
  drive_folder: "document.folder",
  doc: "document.doc",
  sheet: "document.sheet",
  slide: "document.slide",
  contact: "person.contact",
  meet: "comms.meeting",
  task_list: "work.task_list",
  task: "work.task",
  directory_user: "person.user",
  directory_group: "person.group",
  organizational_unit: "org.unit",
};

export const KG_KIND_FOR_OBJECT: Partial<Record<GoogleWorkspaceObjectType, GoogleWorkspaceKgKind>> = {
  message: "Email",
  thread: "Conversation",
  label: "Communication",
  attachment: "Attachment",
  calendar_event: "CalendarEvent",
  meet: "Meeting",
  drive_file: "Document",
  drive_folder: "Folder",
  doc: "Document",
  sheet: "Document",
  slide: "Document",
  contact: "Person",
  directory_user: "Person",
  directory_group: "Organization",
  organizational_unit: "Organization",
  task: "Task",
  task_list: "Task",
};

export function googleWorkspaceCanonicalType(objectType: string): string {
  return (
    CANONICAL_TYPE[objectType as GoogleWorkspaceObjectType] ?? `google-workspace.${objectType}`
  );
}

export function googleWorkspaceKgKind(objectType: string): GoogleWorkspaceKgKind | null {
  return KG_KIND_FOR_OBJECT[objectType as GoogleWorkspaceObjectType] ?? null;
}
