import type { EventPublisher } from "@/lib/platform/integrations/events/publisher";
import type { PlatformEventType } from "@/lib/platform/integrations/events/event-types";
import type { Microsoft365CanonicalEntity } from "@/lib/platform/integrations/connectors/microsoft-365/entities";
import { calendarEventForRecord } from "@/lib/platform/integrations/connectors/microsoft-365/calendar";
import { onedriveEventForRecord } from "@/lib/platform/integrations/connectors/microsoft-365/onedrive";
import { outlookEventForRecord } from "@/lib/platform/integrations/connectors/microsoft-365/outlook";
import { peopleEventForRecord } from "@/lib/platform/integrations/connectors/microsoft-365/people";
import { sharepointEventForRecord } from "@/lib/platform/integrations/connectors/microsoft-365/sharepoint";
import { teamsEventForRecord } from "@/lib/platform/integrations/connectors/microsoft-365/teams";

export function eventTypeForMicrosoftRecord(
  record: Microsoft365CanonicalEntity
): PlatformEventType | null {
  const { objectType, attributes } = record;
  switch (objectType) {
    case "message":
      return outlookEventForRecord(attributes);
    case "calendar_event":
      return calendarEventForRecord(attributes);
    case "onedrive_file":
    case "onedrive_folder":
      return onedriveEventForRecord(attributes);
    case "sharepoint_file":
    case "sharepoint_site":
      return sharepointEventForRecord(attributes);
    case "meet":
    case "chat":
    case "team":
    case "channel":
      return teamsEventForRecord(objectType, attributes);
    case "contact":
    case "directory_user":
      return peopleEventForRecord(objectType);
    default:
      return null;
  }
}

export async function publishMicrosoft365Events(
  publisher: EventPublisher,
  records: readonly Microsoft365CanonicalEntity[],
  meta: { connectorId: string; instanceId: string }
): Promise<number> {
  let published = 0;
  for (const record of records) {
    const type = eventTypeForMicrosoftRecord(record);
    if (!type) continue;
    await publisher.publish(
      type,
      {
        externalId: record.externalId,
        canonicalType: record.canonicalType,
        objectType: record.objectType,
        summary:
          record.attributes.name ??
          record.attributes.title ??
          record.attributes.subject ??
          null,
      },
      meta
    );
    published += 1;
  }
  return published;
}
