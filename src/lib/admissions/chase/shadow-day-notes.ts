/**
 * THE SHADOW DAY'S ACCEPT/DENY LETTER - ONE, AFTER THE LAST DAY.
 *
 * staff_shadow_day_held is due at the END of a shadow day (see
 * SHADOW_DAY_NOTES_EVENT in chase/run.ts). GA and FL book two days, and each
 * booking queued its own letter, so a leader was asked to accept or deny
 * after day one. 23 October 2026: one letter per family, timed to the latest
 * ends_at. Used by the nightly scan and by the board's shadow day dialog.
 *
 * Also records a shadow day booked on the board, which until now wrote only
 * an admissions_interviews row and never an admissions_shadow_days row.
 */
import { createServiceRoleClient } from "@/lib/supabase/server";
import { appointmentTextForFamily } from "@/lib/admissions/appointment-text";
import { shadowDayCount, shadowDayType } from "@/lib/admissions/shadow-day";

const SHADOW_DAY_NOTES_EVENT = "staff_shadow_day_held";
/** Same as NOTES_LETTER_CUTOFF_HOURS in chase/run.ts. */
const CUTOFF_HOURS = 2;
/** The admissions_shadow_days.duration_minutes default (migration 550). */
const BOARD_SHADOW_DAY_MINUTES = 360;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

/**
 * Queue the accept/deny letter at endsAt, unless one is already due at or
 * after it. Pending letters due earlier are cancelled first.
 */
export async function ensureShadowDayNotesLetter(input: {
  leadId: string;
  startsAtIso: string;
  endsAtIso: string;
}): Promise<string | null> {
  const { leadId } = input;
  const endsAt = new Date(input.endsAtIso);
  if (Number.isNaN(endsAt.getTime())) return `${leadId}: shadow day has no valid end time.`;
  if (endsAt.getTime() < Date.now() - CUTOFF_HOURS * 3_600_000) {
    return `${leadId}: shadow day is past, no notes letter queued.`;
  }

  const db: Db = createServiceRoleClient();
  const endsIso = endsAt.toISOString();

  const { data: later, error: laterError } = await db
    .from("admissions_communication_queue")
    .select("id")
    .eq("lead_id", leadId)
    .eq("trigger_event", SHADOW_DAY_NOTES_EVENT)
    .in("status", ["pending", "sending", "sent"])
    .gte("scheduled_for", endsIso)
    .limit(1);
  if (laterError) return `${leadId}: could not check for a shadow day letter: ${laterError.message}`;
  if ((later ?? []).length) return null;

  const { error: cancelError } = await db
    .from("admissions_communication_queue")
    .update({ status: "cancelled" })
    .eq("lead_id", leadId)
    .eq("trigger_event", SHADOW_DAY_NOTES_EVENT)
    .eq("status", "pending")
    .lt("scheduled_for", endsIso);
  if (cancelError) return `${leadId}: could not cancel the earlier shadow day letter: ${cancelError.message}`;

  const { data: lead } = await db
    .from("admissions_leads")
    .select("school_id, post_call_token")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead?.school_id) return `${leadId}: no campus on the lead.`;

  let token: string | null = lead.post_call_token ?? null;
  if (!token) {
    token = (globalThis.crypto.randomUUID() + globalThis.crypto.randomUUID()).replace(/-/g, "");
    const { error } = await db.from("admissions_leads").update({ post_call_token: token }).eq("id", leadId);
    if (error) return `${leadId}: could not mint a notes token: ${error.message}`;
  }

  const { data: templates } = await db
    .from("admissions_communication_templates")
    .select("id, template_key, channel, school_id")
    .eq("trigger_event", SHADOW_DAY_NOTES_EVENT)
    .eq("is_active", true)
    .or(`school_id.is.null,school_id.eq.${lead.school_id}`);
  const rows = (templates ?? []) as { id: string; template_key: string; channel: string; school_id: string | null }[];
  if (!rows.length) return `${leadId}: no active template for ${SHADOW_DAY_NOTES_EVENT}.`;
  const chosen = rows.find((t) => t.school_id) ?? rows[0];

  const { error } = await db.from("admissions_communication_queue").insert({
    lead_id: leadId,
    application_id: null,
    template_id: chosen.id,
    template_key: chosen.template_key,
    trigger_event: SHADOW_DAY_NOTES_EVENT,
    channel: chosen.channel,
    scheduled_for: endsIso,
    status: "pending",
    merge_overrides: {
      postCallToken: token,
      interviewDatetime: appointmentTextForFamily(input.startsAtIso),
      meetingLink: null,
    },
  });
  return error ? `${leadId}: ${error.message}` : null;
}

/**
 * A shadow day booked in the board's dialog: the admissions_shadow_days row
 * the scan would have written, then the accept/deny letter at its end.
 * Skips the insert when the row for this lead and start already exists.
 */
export async function recordShadowDayFromBoard(
  leadId: string,
  scheduledAtIso: string
): Promise<string | null> {
  const startsAt = new Date(scheduledAtIso);
  if (Number.isNaN(startsAt.getTime())) return `${leadId}: shadow day has no valid time.`;

  const db: Db = createServiceRoleClient();

  const { data: lead } = await db
    .from("admissions_leads")
    .select("schools(name)")
    .eq("id", leadId)
    .maybeSingle();
  const embedded = lead?.schools as { name?: string } | { name?: string }[] | null | undefined;
  const campus = (Array.isArray(embedded) ? embedded[0]?.name : embedded?.name)?.trim() || null;

  const from = new Date(startsAt.getTime() - 60_000).toISOString();
  const to = new Date(startsAt.getTime() + 60_000).toISOString();
  const { data: existing } = await db
    .from("admissions_shadow_days")
    .select("id, ends_at")
    .eq("lead_id", leadId)
    .gte("scheduled_at", from)
    .lte("scheduled_at", to)
    .limit(1);
  const known = ((existing ?? []) as { id: string; ends_at: string | null }[])[0] ?? null;

  const endsAtIso =
    known?.ends_at ?? new Date(startsAt.getTime() + BOARD_SHADOW_DAY_MINUTES * 60_000).toISOString();

  if (!known) {
    const { error } = await db.from("admissions_shadow_days").insert({
      lead_id: leadId,
      scheduled_at: startsAt.toISOString(),
      ends_at: endsAtIso,
      duration_minutes: BOARD_SHADOW_DAY_MINUTES,
      day_count: shadowDayCount(campus),
      shadow_day_type: shadowDayType(campus),
      shadow_day_status: "scheduled",
      notes: "Booked on the board.",
      host_user_id: null,
    });
    /* 23505 is the (lead_id, scheduled_at) index: already recorded. */
    if (error && error.code !== "23505") {
      return `${leadId}: the shadow day was not recorded: ${error.message}`;
    }
  }

  return ensureShadowDayNotesLetter({
    leadId,
    startsAtIso: startsAt.toISOString(),
    endsAtIso,
  });
}
