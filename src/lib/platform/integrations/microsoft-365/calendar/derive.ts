import { createHash } from "crypto";
import type {
  Microsoft365CanonicalEntity,
  Microsoft365ObjectType,
} from "@/lib/platform/integrations/connectors/microsoft-365/entities";

function digestId(kind: string, key: string): string {
  const hash = createHash("sha1").update(`${kind}:${key}`).digest("hex").slice(0, 16);
  return `jag_${kind}_${hash}`;
}

export function deriveCalendarCanonicalEntities(
  records: readonly Microsoft365CanonicalEntity[]
): Microsoft365CanonicalEntity[] {
  const derived: Microsoft365CanonicalEntity[] = [];

  for (const record of records) {
    if (record.objectType !== "calendar_event") continue;

    const attendees = Array.isArray(record.attributes.attendees)
      ? (record.attributes.attendees as string[])
      : [];

    derived.push({
      id: digestId("meeting", record.externalId),
      externalId: `meeting:${record.externalId}`,
      organizationId: record.organizationId,
      sourceSystem: "microsoft-365",
      syncedAt: record.syncedAt,
      version: record.version,
      tenantDomain: record.tenantDomain,
      userId: record.userId,
      objectType: "meet" as Microsoft365ObjectType,
      canonicalType: "comms.meeting",
      attributes: {
        kind: "Meeting",
        name: record.attributes.title ?? record.attributes.name ?? record.externalId,
        title: record.attributes.title ?? record.attributes.name ?? null,
        startAt: record.attributes.startAt ?? null,
        endAt: record.attributes.endAt ?? null,
        startedAt: record.attributes.startAt ?? null,
        durationMinutes: record.attributes.durationMinutes ?? 0,
        participantCount: record.attributes.attendeeCount ?? attendees.length,
        participants: attendees,
        meetingLink: record.attributes.meetingLink ?? null,
        calendarEventId: record.externalId,
        status: record.attributes.status ?? "confirmed",
      },
    });

    for (const email of attendees) {
      if (typeof email !== "string" || !email.includes("@")) continue;
      derived.push({
        id: digestId("attendee", `${record.externalId}:${email}`),
        externalId: `attendee:${record.externalId}:${email}`,
        organizationId: record.organizationId,
        sourceSystem: "microsoft-365",
        syncedAt: record.syncedAt,
        version: 1,
        tenantDomain: record.tenantDomain,
        userId: null,
        objectType: "contact" as Microsoft365ObjectType,
        canonicalType: "person.attendee",
        attributes: {
          kind: "Attendee",
          email,
          calendarEventId: record.externalId,
          name: email,
        },
      });
    }
  }

  return [...records, ...derived];
}
