import type { PlatformEventType } from "@/lib/platform/integrations/events/event-types";
import type { Microsoft365ObjectType } from "@/lib/platform/integrations/connectors/microsoft-365/entities";

export const TEAMS_OBJECT_TYPES = [
  "meet",
  "chat",
  "team",
  "channel",
] as const satisfies readonly Microsoft365ObjectType[];

export function teamsEventForRecord(
  objectType: string,
  payload: Record<string, unknown>
): PlatformEventType | null {
  if (objectType === "meet") {
    if (payload.endedAt) return "MEETING_COMPLETED";
    if (Number(payload.version ?? 1) > 1) return "MEETING_UPDATED";
    return "MEETING_CREATED";
  }
  if (objectType === "chat") {
    return payload.direction === "sent" ? "EMAIL_SENT" : "EMAIL_RECEIVED";
  }
  return null;
}

export function normalizeMeetAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return {
    name: payload.name ?? payload.title,
    calendarEventId: payload.calendarEventId ?? null,
    participants: payload.participants ?? [],
    participantCount:
      payload.participantCount ?? (payload.participants as unknown[] | undefined)?.length ?? 0,
    durationMinutes: payload.durationMinutes ?? null,
    startAt: payload.startedAt ?? payload.startAt ?? null,
    endAt: payload.endedAt ?? payload.endAt ?? null,
    meetingLink: payload.joinUrl ?? payload.meetingLink ?? null,
  };
}

export function normalizeChatAttributes(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return {
    subject: payload.subject ?? payload.topic ?? "Chat",
    from: payload.from ?? null,
    to: payload.to ?? [],
    teamId: payload.teamId ?? null,
    channelId: payload.channelId ?? null,
    direction: payload.direction ?? "received",
    receivedAt: payload.receivedAt ?? payload.sentAt ?? null,
  };
}
