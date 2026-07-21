/**
 * Derive Meeting / Attendee / Room / Resource from CalendarEvent records.
 * Downstream consumers only see these canonical entities — never raw Calendar.
 */

import { createHash } from "crypto";
import type {
  GoogleWorkspaceCanonicalEntity,
  GoogleWorkspaceObjectType,
} from "@/lib/platform/integrations/connectors/google-workspace/entities";
import type { CalendarAttendeeRef } from "@/lib/platform/integrations/google-workspace/calendar/types";
import { parseCalendarAttendees } from "@/lib/platform/integrations/google-workspace/calendar/normalize";

function digestId(kind: string, key: string): string {
  const hash = createHash("sha1").update(`${kind}:${key}`).digest("hex").slice(0, 16);
  return `jag_${kind}_${hash}`;
}

function asAttendees(attrs: Record<string, unknown>): CalendarAttendeeRef[] {
  if (Array.isArray(attrs.attendees) && attrs.attendees.length) {
    if (typeof attrs.attendees[0] === "object") {
      return attrs.attendees as CalendarAttendeeRef[];
    }
  }
  return parseCalendarAttendees(attrs, String(attrs.workspaceDomain ?? ""));
}

function asRooms(attrs: Record<string, unknown>): string[] {
  if (!Array.isArray(attrs.rooms)) return [];
  return attrs.rooms.map((r) => String(r)).filter(Boolean);
}

/**
 * Expand normalized Calendar records into Meeting + Attendee + Room + Resource.
 * CalendarEvent / Meet primaries remain; derived entities are appended.
 */
export function deriveCalendarCanonicalEntities(
  records: readonly GoogleWorkspaceCanonicalEntity[]
): GoogleWorkspaceCanonicalEntity[] {
  const derived: GoogleWorkspaceCanonicalEntity[] = [];
  const seenAttendee = new Set<string>();
  const seenRoom = new Set<string>();
  const seenResource = new Set<string>();

  for (const record of records) {
    if (record.objectType === "meet") {
      // Meet sessions are already Meetings; link to calendar event when present.
      continue;
    }
    if (record.objectType !== "calendar_event") continue;

    const attendees = asAttendees({
      ...record.attributes,
      workspaceDomain: record.workspaceDomain,
    });
    const rooms = asRooms(record.attributes);
    const title = String(record.attributes.title ?? record.attributes.name ?? record.externalId);

    // Collaboration Meeting — backbone for analytics
    derived.push({
      id: digestId("meeting", record.externalId),
      externalId: `meeting:${record.externalId}`,
      organizationId: record.organizationId,
      sourceSystem: "google-workspace",
      syncedAt: record.syncedAt,
      version: record.version,
      workspaceDomain: record.workspaceDomain,
      userId: record.userId,
      objectType: "calendar_event",
      canonicalType: "comms.meeting",
      attributes: {
        kind: "Meeting",
        calendarEventId: record.externalId,
        name: title,
        title,
        startAt: record.attributes.startAt ?? null,
        endAt: record.attributes.endAt ?? null,
        durationMinutes: record.attributes.durationMinutes ?? null,
        attendeeEmails: record.attributes.attendeeEmails ?? attendees.map((a) => a.email),
        attendeeCount: record.attributes.attendeeCount ?? attendees.length,
        rooms,
        meetingLink: record.attributes.meetingLink ?? null,
        location: record.attributes.location ?? null,
        status: record.attributes.status ?? "confirmed",
        recurring: Boolean(record.attributes.recurring),
        correlationKey: record.attributes.correlationKey ?? null,
      },
    });

    for (const attendee of attendees) {
      const key = `${record.externalId}:${attendee.email}`;
      if (seenAttendee.has(key)) continue;
      seenAttendee.add(key);
      derived.push({
        id: digestId("attendee", key),
        externalId: `attendee:${key}`,
        organizationId: record.organizationId,
        sourceSystem: "google-workspace",
        syncedAt: record.syncedAt,
        version: 1,
        workspaceDomain: record.workspaceDomain,
        userId: null,
        objectType: "contact" as GoogleWorkspaceObjectType,
        canonicalType: "person.attendee",
        attributes: {
          kind: "Attendee",
          name: attendee.displayName ?? attendee.email,
          email: attendee.email,
          domain: attendee.domain,
          isInternal: attendee.isInternal,
          responseStatus: attendee.responseStatus,
          optional: attendee.optional,
          organizer: attendee.organizer,
          calendarEventId: record.externalId,
          meetingId: `meeting:${record.externalId}`,
          source: "calendar.attendee",
        },
      });
    }

    for (const room of rooms) {
      const roomKey = room.toLowerCase();
      if (!seenRoom.has(roomKey)) {
        seenRoom.add(roomKey);
        derived.push({
          id: digestId("room", roomKey),
          externalId: `room:${roomKey}`,
          organizationId: record.organizationId,
          sourceSystem: "google-workspace",
          syncedAt: record.syncedAt,
          version: 1,
          workspaceDomain: record.workspaceDomain,
          userId: null,
          objectType: "calendar_event",
          canonicalType: "comms.room",
          attributes: {
            kind: "Room",
            name: room,
            resourceType: "room",
            source: "calendar.room",
          },
        });
      }

      // Per-booking Resource link (room as booked resource on an event)
      const resourceKey = `${record.externalId}:${roomKey}`;
      if (!seenResource.has(resourceKey)) {
        seenResource.add(resourceKey);
        derived.push({
          id: digestId("resource", resourceKey),
          externalId: `resource:${resourceKey}`,
          organizationId: record.organizationId,
          sourceSystem: "google-workspace",
          syncedAt: record.syncedAt,
          version: 1,
          workspaceDomain: record.workspaceDomain,
          userId: null,
          objectType: "calendar_event",
          canonicalType: "comms.resource",
          attributes: {
            kind: "Resource",
            name: room,
            resourceType: "room",
            roomId: `room:${roomKey}`,
            calendarEventId: record.externalId,
            meetingId: `meeting:${record.externalId}`,
            source: "calendar.resource",
          },
        });
      }
    }

    // Location-only resources (e.g. "Meet" without a named room)
    const location = record.attributes.location
      ? String(record.attributes.location)
      : null;
    if (location && rooms.length === 0) {
      const locKey = location.toLowerCase();
      const resourceKey = `${record.externalId}:loc:${locKey}`;
      if (!seenResource.has(resourceKey)) {
        seenResource.add(resourceKey);
        derived.push({
          id: digestId("resource", resourceKey),
          externalId: `resource:${resourceKey}`,
          organizationId: record.organizationId,
          sourceSystem: "google-workspace",
          syncedAt: record.syncedAt,
          version: 1,
          workspaceDomain: record.workspaceDomain,
          userId: null,
          objectType: "calendar_event",
          canonicalType: "comms.resource",
          attributes: {
            kind: "Resource",
            name: location,
            resourceType: "location",
            calendarEventId: record.externalId,
            meetingId: `meeting:${record.externalId}`,
            source: "calendar.location",
          },
        });
      }
    }
  }

  return [...records, ...derived];
}
