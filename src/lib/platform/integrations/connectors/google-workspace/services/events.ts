/**
 * Publish Sprint 073 platform events from normalized Google Workspace records.
 */

import type { EventPublisher } from "@/lib/platform/integrations/events/publisher";
import type { PlatformEventType } from "@/lib/platform/integrations/events/event-types";
import type { GoogleWorkspaceCanonicalEntity } from "@/lib/platform/integrations/connectors/google-workspace/entities";
import { eventTypeForGmailCanonical } from "@/lib/platform/integrations/google-workspace/gmail/events";
import { eventTypeForCalendarCanonical } from "@/lib/platform/integrations/google-workspace/calendar/events";
import { eventTypeForDriveCanonical } from "@/lib/platform/integrations/google-workspace/drive/events";
import { docsEventForRecord } from "@/lib/platform/integrations/connectors/google-workspace/docs";
import { sheetsEventForRecord } from "@/lib/platform/integrations/connectors/google-workspace/sheets";
import { slidesEventForRecord } from "@/lib/platform/integrations/connectors/google-workspace/slides";
import { contactsEventForRecord } from "@/lib/platform/integrations/connectors/google-workspace/contacts";
import { directoryEventForRecord } from "@/lib/platform/integrations/connectors/google-workspace/directory";

export function eventTypeForGoogleRecord(
  record: GoogleWorkspaceCanonicalEntity
): PlatformEventType | null {
  const { objectType, attributes } = record;
  switch (objectType) {
    case "message":
    case "thread":
      return eventTypeForGmailCanonical(record);
    case "calendar_event":
    case "meet":
      return eventTypeForCalendarCanonical(record);
    case "drive_file":
    case "drive_folder":
      return eventTypeForDriveCanonical(record);
    case "doc":
      return docsEventForRecord(attributes);
    case "sheet":
      return sheetsEventForRecord(attributes);
    case "slide":
      return slidesEventForRecord(attributes);
    case "contact":
      // Derived calendar Attendees / Drive Owners use contact objectType.
      if (attributes.kind === "Attendee" || attributes.kind === "Owner") return null;
      return contactsEventForRecord(attributes);
    case "directory_user":
    case "directory_group":
    case "organizational_unit":
      return directoryEventForRecord(objectType, attributes);
    default:
      return null;
  }
}

export async function publishGoogleWorkspaceEvents(
  publisher: EventPublisher,
  records: readonly GoogleWorkspaceCanonicalEntity[],
  meta: { connectorId: string; instanceId: string }
): Promise<number> {
  let published = 0;
  for (const record of records) {
    const type = eventTypeForGoogleRecord(record);
    if (!type) continue;
    await publisher.publish(
      type,
      {
        externalId: record.externalId,
        canonicalType: record.canonicalType,
        objectType: record.objectType,
        // Never include raw Google objects — attributes are already scrubbed/canonical.
        summary: record.attributes.name ?? record.attributes.title ?? record.attributes.subject ?? null,
      },
      meta
    );
    published += 1;
  }
  return published;
}
