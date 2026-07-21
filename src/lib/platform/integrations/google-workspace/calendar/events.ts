import type { PlatformEventType } from "@/lib/platform/integrations/events/event-types";
import type { GoogleWorkspaceCanonicalEntity } from "@/lib/platform/integrations/connectors/google-workspace/entities";

export function calendarEventForRecord(
  payload: Record<string, unknown>
): PlatformEventType {
  const status = String(payload.status ?? "confirmed");
  const endAt = String(payload.endAt ?? "");
  if (status === "completed" || (endAt && endAt < new Date().toISOString())) {
    return "MEETING_COMPLETED";
  }
  if (payload.updated === true || Number(payload.version ?? 1) > 1) {
    return "MEETING_UPDATED";
  }
  return "MEETING_CREATED";
}

export function meetEventForRecord(payload: Record<string, unknown>): PlatformEventType {
  if (payload.endAt || payload.endedAt) return "MEETING_COMPLETED";
  if (Number(payload.version ?? 1) > 1) return "MEETING_UPDATED";
  return "MEETING_CREATED";
}

export function eventTypeForCalendarCanonical(
  record: GoogleWorkspaceCanonicalEntity
): PlatformEventType | null {
  // Derived Attendee / Room / Resource / Meeting-from-event must not re-emit.
  const kind = String(record.attributes.kind ?? "");
  if (kind === "Attendee" || kind === "Room" || kind === "Resource") {
    return null;
  }
  if (String(record.externalId).startsWith("meeting:")) {
    // Derived Meeting companion — emit CALENDAR_UPDATED once per event via primary.
    return null;
  }

  switch (record.objectType) {
    case "calendar_event":
      // Skip derived Meeting companions (already filtered by externalId prefix).
      if (kind === "Meeting") return null;
      return calendarEventForRecord(record.attributes);
    case "meet":
      return meetEventForRecord(record.attributes);
    default:
      return null;
  }
}
