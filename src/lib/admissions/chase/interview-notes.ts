/**
 * THE INTEREST MEETING'S NOTES LETTER, FOR A MEETING BOOKED ON THE BOARD.
 *
 * ensureTourNotesLetter's sibling. The nightly scan queues staff_inquiry_call_held
 * at the start time of every meeting it reads off a calendar (chase/run.ts); a
 * meeting typed into the board's dialog never got one. 23 October 2026.
 *
 * Idempotent: one letter per family per meeting start time.
 */
import { createServiceRoleClient } from "@/lib/supabase/server";
import { appointmentTextForFamily } from "@/lib/admissions/appointment-text";

const MEETING_NOTES_EVENT = "staff_inquiry_call_held";
/** Same as NOTES_LETTER_CUTOFF_HOURS in chase/run.ts. */
const CUTOFF_HOURS = 2;

export async function ensureInterviewNotesLetter(
  leadId: string,
  scheduledAtIso: string
): Promise<string | null> {
  const startsAt = new Date(scheduledAtIso);
  if (Number.isNaN(startsAt.getTime())) return `${leadId}: meeting has no valid time.`;
  if (startsAt.getTime() < Date.now() - CUTOFF_HOURS * 3_600_000) {
    return `${leadId}: meeting is past, no notes letter queued.`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;

  const { data: lead } = await db
    .from("admissions_leads")
    .select("school_id, post_call_token")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead?.school_id) return `${leadId}: no campus on the lead.`;

  const from = new Date(startsAt.getTime() - 60_000).toISOString();
  const to = new Date(startsAt.getTime() + 60_000).toISOString();
  const { data: existing } = await db
    .from("admissions_communication_queue")
    .select("id")
    .eq("lead_id", leadId)
    .eq("trigger_event", MEETING_NOTES_EVENT)
    .neq("status", "cancelled")
    .gte("scheduled_for", from)
    .lte("scheduled_for", to)
    .limit(1);
  if (existing?.length) return null;

  let token: string | null = lead.post_call_token ?? null;
  if (!token) {
    token = (globalThis.crypto.randomUUID() + globalThis.crypto.randomUUID()).replace(/-/g, "");
    const { error } = await db.from("admissions_leads").update({ post_call_token: token }).eq("id", leadId);
    if (error) return `${leadId}: could not mint a notes token: ${error.message}`;
  }

  const { data: templates } = await db
    .from("admissions_communication_templates")
    .select("id, template_key, channel, school_id")
    .eq("trigger_event", MEETING_NOTES_EVENT)
    .eq("is_active", true)
    .or(`school_id.is.null,school_id.eq.${lead.school_id}`);
  const rows = (templates ?? []) as { id: string; template_key: string; channel: string; school_id: string | null }[];
  if (!rows.length) return `${leadId}: no active template for ${MEETING_NOTES_EVENT}.`;
  const chosen = rows.find((t) => t.school_id) ?? rows[0];

  const { error } = await db.from("admissions_communication_queue").insert({
    lead_id: leadId,
    application_id: null,
    template_id: chosen.id,
    template_key: chosen.template_key,
    trigger_event: MEETING_NOTES_EVENT,
    channel: chosen.channel,
    scheduled_for: startsAt.toISOString(),
    status: "pending",
    merge_overrides: {
      postCallToken: token,
      interviewDatetime: appointmentTextForFamily(scheduledAtIso),
      meetingLink: null,
    },
  });
  return error ? `${leadId}: ${error.message}` : null;
}
