import { recordActivity } from "@/lib/platform/activity";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

type CalendarEventType =
  | "calendar.created"
  | "calendar.updated"
  | "calendar.cancelled"
  | "meeting.scheduled"
  | "class.scheduled"
  | "room.reserved"
  | "resource.conflict";

export async function recordCalendarActivity(
  supabase: AuthClient,
  input: {
    eventType: CalendarEventType;
    title: string;
    summary?: string | null;
    entityId: string;
    organizationId?: string | null;
    schoolId?: string | null;
    studentId?: string | null;
    familyId?: string | null;
    actorUserId?: string | null;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  if (!input.organizationId && !input.schoolId) return;
  try {
    await recordActivity(supabase, {
      eventType: input.eventType,
      moduleKey: "platform",
      entityType: "calendar_event",
      entityId: input.entityId,
      title: input.title,
      summary: input.summary ?? undefined,
      organizationId: input.organizationId ?? undefined,
      schoolId: input.schoolId ?? undefined,
      studentId: input.studentId ?? undefined,
      familyId: input.familyId ?? undefined,
      actorUserId: input.actorUserId ?? undefined,
      sourceTable: "platform_calendar_events",
      sourceId: input.entityId,
      payload: input.payload,
    });
  } catch {
    // best-effort
  }
}
