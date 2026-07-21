import type {
  CollaborationKgKind,
  CollaborationObjectType,
} from "@/lib/platform/integrations/connectors/collaboration/entities";

/** Same canonical strings as Google Workspace / Microsoft 365. */
export const CANONICAL_TYPE: Record<CollaborationObjectType, string> = {
  channel: "person.group",
  thread: "comms.thread",
  message: "comms.message",
  user: "person.user",
  reaction: "comms.reaction",
  team: "person.group",
  chat: "comms.message",
  meet: "comms.meeting",
  recording: "document.file",
  attendance: "comms.attendance",
};

export const KG_KIND_FOR_OBJECT: Partial<
  Record<CollaborationObjectType, CollaborationKgKind>
> = {
  channel: "Organization",
  thread: "Communication",
  message: "Communication",
  user: "Person",
  reaction: "Communication",
  team: "Organization",
  chat: "Communication",
  meet: "Meeting",
  recording: "Document",
  attendance: "Meeting",
};

export function collaborationCanonicalType(objectType: string): string {
  return (
    CANONICAL_TYPE[objectType as CollaborationObjectType] ??
    `collaboration.${objectType}`
  );
}

export function collaborationKgKind(objectType: string): CollaborationKgKind | null {
  return KG_KIND_FOR_OBJECT[objectType as CollaborationObjectType] ?? null;
}
