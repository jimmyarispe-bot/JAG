import type { PlatformEventType } from "@/lib/platform/integrations/events/event-types";
import type { Microsoft365ObjectType } from "@/lib/platform/integrations/connectors/microsoft-365/entities";

export const CALENDAR_OBJECT_TYPES = [
  "calendar_event",
] as const satisfies readonly Microsoft365ObjectType[];

export function calendarEventForRecord(payload: Record<string, unknown>): PlatformEventType {
  const status = String(payload.status ?? "confirmed");
  const endAt = String(payload.endAt ?? "");
  if (status === "completed" || (endAt && endAt < new Date().toISOString())) {
    return "MEETING_COMPLETED";
  }
  if (payload.updated === true || Number(payload.version ?? 1) > 1) return "MEETING_UPDATED";
  return "MEETING_CREATED";
}

export function normalizeCalendarAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return {
    title: payload.title ?? payload.subject ?? payload.name,
    startAt: payload.startAt,
    endAt: payload.endAt,
    durationMinutes: payload.durationMinutes,
    attendees: payload.attendees ?? [],
    attendeeCount: payload.attendeeCount ?? (payload.attendees as unknown[] | undefined)?.length ?? 0,
    rooms: payload.rooms ?? [],
    recurrence: payload.recurrence ?? null,
    recurring: Boolean(payload.recurring),
    meetingLink: payload.meetingLink ?? payload.joinUrl ?? null,
    location: payload.location ?? null,
    status: payload.status ?? "confirmed",
  };
}
