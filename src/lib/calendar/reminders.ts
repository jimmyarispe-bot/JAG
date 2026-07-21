import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export const DEFAULT_REMINDER_OFFSETS_MINUTES = [24 * 60, 60, 15] as const;

export async function scheduleEventReminders(
  supabase: AuthClient,
  eventId: string,
  startsAt: string,
  offsets: number[] = [...DEFAULT_REMINDER_OFFSETS_MINUTES]
): Promise<void> {
  const start = new Date(startsAt).getTime();
  const rows = offsets
    .filter((m) => m > 0)
    .map((offset) => ({
      event_id: eventId,
      offset_minutes: offset,
      remind_at: new Date(start - offset * 60_000).toISOString(),
      status: "pending" as const,
    }))
    .filter((r) => new Date(r.remind_at).getTime() > Date.now() - 60_000);

  if (!rows.length) return;

  await supabase.from("platform_calendar_reminders").upsert(rows, {
    onConflict: "event_id,offset_minutes",
    ignoreDuplicates: true,
  });
}

/**
 * Process due reminders — publishes through Communications platform.
 */
export async function processDueCalendarReminders(
  supabase: AuthClient,
  limit = 50
): Promise<{ sent: number; failed: number }> {
  const now = new Date().toISOString();
  const { data: due } = await supabase
    .from("platform_calendar_reminders")
    .select("id, event_id, offset_minutes, platform_calendar_events(id, title, starts_at, school_id, organization_id, family_id, student_ids)")
    .eq("status", "pending")
    .lte("remind_at", now)
    .limit(limit);

  let sent = 0;
  let failed = 0;

  for (const row of due ?? []) {
    const event = Array.isArray(row.platform_calendar_events)
      ? row.platform_calendar_events[0]
      : row.platform_calendar_events;

    if (!event) {
      await supabase
        .from("platform_calendar_reminders")
        .update({ status: "cancelled" })
        .eq("id", row.id);
      continue;
    }

    try {
      const { data: comm } = await supabase
        .from("platform_communications")
        .insert({
          organization_id: event.organization_id,
          school_id: event.school_id,
          type: "reminder",
          direction: "outbound",
          status: "queued",
          subject: `Reminder: ${event.title}`,
          body_text: `Upcoming event in ${row.offset_minutes} minutes: ${event.title} at ${new Date(event.starts_at).toLocaleString()}`,
          family_id: event.family_id,
          student_id: Array.isArray(event.student_ids) ? event.student_ids[0] ?? null : null,
          metadata: {
            calendarEventId: event.id,
            reminderId: row.id,
            offsetMinutes: row.offset_minutes,
          },
        })
        .select("id")
        .single();

      await supabase
        .from("platform_calendar_reminders")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          communication_id: comm?.id ?? null,
        })
        .eq("id", row.id);
      sent += 1;
    } catch {
      await supabase
        .from("platform_calendar_reminders")
        .update({ status: "failed" })
        .eq("id", row.id);
      failed += 1;
    }
  }

  return { sent, failed };
}
