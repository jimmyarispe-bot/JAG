/**
 * Meet domain — metadata only: participants, duration, start, end.
 */

import type { PlatformEventType } from "@/lib/platform/integrations/events/event-types";
import type { GoogleWorkspaceObjectType } from "@/lib/platform/integrations/connectors/google-workspace/entities";

export const MEET_OBJECT_TYPES = ["meet"] as const satisfies readonly GoogleWorkspaceObjectType[];

export function meetEventForRecord(payload: Record<string, unknown>): PlatformEventType {
  if (payload.endedAt) return "MEETING_COMPLETED";
  if (Number(payload.version ?? 1) > 1) return "MEETING_UPDATED";
  return "MEETING_CREATED";
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
  };
}
