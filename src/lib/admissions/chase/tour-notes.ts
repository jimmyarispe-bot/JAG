/**
 * THE TOUR'S NOTES LETTER, FROM EVERY DOOR THAT BOOKS A TOUR.
 *
 * Danni, 22 October 2026: "Gabrianna Carvajal - She completed the tour. I did
 * not receive the prompt to send her the application or to schedule the shadow
 * days."
 *
 * The letter was only ever queued by the nightly calendar scan, and only for a
 * tour row the scan itself had just written. A tour entered by hand on the
 * board (scheduleAppointmentAndAdvance, scheduleTour), or recorded before
 * migration 539 shipped, never got one - and on every later night the scan saw
 * the row already there and skipped the family entirely.
 *
 * Idempotent: one letter per family per tour start time, whoever asks first.
 */
import { createServiceRoleClient } from "@/lib/supabase/server";
import { appointmentTextForFamily } from "@/lib/admissions/appointment-text";

const TOUR_NOTES_EVENT = "staff_tour_held";
/** Same as NOTES_LETTER_CUTOFF_HOURS in chase/run.ts. */
const CUTOFF_HOURS = 2;

export async function ensureTourNotesLetter(
  leadId: string,
  scheduledAtIso: string
): Promise<string | null> {
  const startsAt = new Date(scheduledAtIso);
  if (Number.isNaN(startsAt.getTime())) return `${leadId}: tour has no valid time.`;
  if (startsAt.getTime() < Date.now() - CUTOFF_HOURS * 3_600_000) {
    return `${leadId}: tour is past, no notes letter queued.`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;

  const { data: lead } = await db
    .from("admissions_leads")
    .select("school_id, post_call_token")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead?.school_id) return `${leadId}: no campus on the lead.`;

  // Already queued for this tour? A minute either side absorbs ISO formatting.
  const from = new Date(startsAt.getTime() - 60_000).toISOString();
  const to = new Date(startsAt.getTime() + 60_000).toISOString();
  const { data: existing } = await db
    .from("admissions_communication_queue")
    .select("id")
    .eq("lead_id", leadId)
    .eq("trigger_event", TOUR_NOTES_EVENT)
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
    .eq("trigger_event", TOUR_NOTES_EVENT)
    .eq("is_active", true)
    .or(`school_id.is.null,school_id.eq.${lead.school_id}`);
  const rows = (templates ?? []) as { id: string; template_key: string; channel: string; school_id: string | null }[];
  if (!rows.length) return `${leadId}: no active template for ${TOUR_NOTES_EVENT}.`;
  const chosen = rows.find((t) => t.school_id) ?? rows[0];

  const { error } = await db.from("admissions_communication_queue").insert({
    lead_id: leadId,
    application_id: null,
    template_id: chosen.id,
    template_key: chosen.template_key,
    trigger_event: TOUR_NOTES_EVENT,
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
