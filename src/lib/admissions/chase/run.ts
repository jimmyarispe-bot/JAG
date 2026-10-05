import "server-only";

/**
 * The 11pm scan: look at the calendars, then decide the night's letters.
 *
 * ITS OWN JOB, AND NOT NEGOTIABLE. processAllPlatformQueues runs thirty-odd
 * jobs in one invocation against a 60-second ceiling, and googleWorkspace.sync
 * alone reports 605 seconds and has never once completed - which is why its
 * status read "Running" from 9 September to 1 October under a green Connected
 * badge with 0 records imported. Anything put inside that runner inherits all
 * of it. This route is small, bounded, and has one thing to do.
 *
 * ORDER MATTERS. The calendars are read FIRST, and only then is anything
 * decided. That is the whole reason Jimmy's 11pm checkpoints are better than
 * the hour-based clock they replaced: under the old design all three letters
 * were queued the moment the invitation went out and the scan's job was to
 * cancel them in time, so a family who booked at nine in the morning could
 * still be chased at two in the afternoon. Nothing is queued in advance here.
 * A reminder cannot be sent against stale information because the information
 * is read before the reminder exists.
 *
 * WHAT IT WRITES, AND WHAT IT REFUSES TO WRITE.
 *
 *   It records a booking it finds - an admissions_interviews row, the stage,
 *   and the two letters that go with it - because a family booking a meeting
 *   is a fact about the calendar and not a judgement about a child. Jimmy's
 *   rule that "a student does not move from one stage to the next without the
 *   school leader moving him/her" is about decisions. This is the same thing
 *   scheduleInterview already does when a leader types the time in by hand.
 *
 *   It queues letters. It does not send them: the parent reminders land at
 *   8am and the escalation at 7am, hours after this runs.
 *
 *   It never advances a lead past the interest meeting, never accepts, denies
 *   or declines anybody, and never writes to a child's record.
 */

import { appointmentTextForFamily } from "@/lib/admissions/appointment-text";
import { onInterviewScheduled } from "@/lib/admissions/communications/triggers";
import {
  matchBookingToLead,
  readSharedCalendarBookings,
  type CalendarBooking,
} from "@/lib/admissions/chase/calendar";
import { decideChase, type ChaseDecision } from "@/lib/admissions/chase/clock";
import { easternDateKey, easternHour } from "@/lib/platform/time/eastern";
import { getPrimaryOrganizationId } from "@/lib/configuration/context";
import { ensureGoogleWorkspaceAccessToken } from "@/lib/platform/integrations/google-workspace/sync/token-bridge";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * The earliest Eastern hour at which a night's scan may run.
 *
 * NOT "EXACTLY 11PM", AND THE DIFFERENCE IS DAYLIGHT SAVING. Vercel schedules
 * in UTC, so 03:00 UTC is 11pm Eastern through the school year and 10pm
 * Eastern once the clocks go back on the first Sunday in November. A guard
 * that insisted on 23 would silently stop running for five months of the year
 * - at the start of November, with nobody told - which is the exact shape of
 * every fault this platform has had: correct-looking, quiet, and wrong.
 *
 * So the rule is "late enough", paired with a once-per-Eastern-date claim in
 * interest_meeting_scan_runs. Schedule it once or three times; the first run
 * after 10pm does the night's work and the rest find the night already taken.
 * That also means a retry, a manual press, or a second cron cannot double-send.
 */
export const EARLIEST_SCAN_HOUR_EASTERN = 22;

export const REMINDER_1_EVENT = "parent_interest_meeting_not_booked_1";
export const REMINDER_2_EVENT = "parent_interest_meeting_not_booked_2";
export const ESCALATION_EVENT = "staff_interest_meeting_no_response";

/**
 * "RECORD your notes for ..." - to the school leader, at the appointment
 * time, at every campus.
 *
 * THE EVENT KEEPS ITS ORIGINAL NAME. It was coined on 4 October for a GA and
 * FL letter after the inquiry call; renaming it would touch six files to
 * change nothing a human sees. The label in TRIGGER_EVENT_LABELS, which is
 * what Jimmy reads in the template admin, was updated instead.
 */
export const POST_CALL_EVENT = "staff_inquiry_call_held";

/*
 * THE TEN-MINUTE DELAY IS GONE, and the constants with it. Until 5 October
 * this letter went ten minutes after the appointment ENDED. Jimmy moved it to
 * the appointment's start time, so there is nothing left to offset and
 * nothing to guess when Google sends no end time.
 *
 * CalendarBooking.endsAt is still read - tourDurationMinutes uses it - so the
 * work that added it is not wasted.
 */

/** Only used when Google sends a tour event with no end time. */
export const DEFAULT_TOUR_MINUTES = 60;

/** The letter that actually carries the booking link today. */
const BOOKING_LINK_TEMPLATE_KEY = "inquiry_thank_you_email";

/**
 * How far back a lead can be and still be chased.
 *
 * Ninety days, and the number is a judgement rather than a rule. The first
 * night this runs it decides how much history wakes up: every open inquiry
 * inside the window starts its chase at the first letter tonight. Wider and
 * families who inquired in the spring get an email about a meeting they have
 * long since stopped wanting; narrower and this summer's genuinely open
 * inquiries are abandoned in silence.
 */
const LEAD_LOOKBACK_DAYS = 90;

export interface ScanOptions {
  readonly now?: Date;
  /** Run outside 11pm Eastern. For a human pressing the button. */
  readonly force?: boolean;
  /** Decide everything, write nothing. The safe first run. */
  readonly dryRun?: boolean;
  /**
   * Hold a 7am escalation that would land at the weekend until Monday.
   * See ChaseInput.holdWeekendEscalation - Jimmy has not ruled on it yet.
   */
  readonly holdWeekendEscalation?: boolean;
}

export interface ScanReport {
  readonly ran: boolean;
  readonly why?: string;
  readonly dryRun: boolean;
  readonly easternDate: string;
  readonly calendarsRead: readonly string[];
  readonly calendarsSkipped: readonly string[];
  readonly calendarProblems: readonly string[];
  /** A campus whose booking contact has not shared a calendar. Loud on purpose. */
  readonly campusesWithNoCalendar: readonly string[];
  readonly bookingsSeen: number;
  readonly bookingsMatched: number;
  readonly bookingsAmbiguous: readonly string[];
  /** New, still to come, and the family and campus were told. */
  readonly bookingsRecorded: readonly string[];
  /** New, but already in the past: the row is written and nobody is told. */
  readonly bookingsNotNotified: readonly string[];
  /**
   * A GA or FL booking whose post-call letter could not be queued, and why.
   *
   * Almost always one thing: staff_inquiry_call_held is seeded switched off,
   * because Jimmy reads the exact words a human will see before they ship.
   * Reported rather than silent, so "the letters are off" and "the scan is
   * broken" cannot look the same from the outside.
   */
  readonly postCallSkipped: readonly string[];
  /**
   * A tour the family booked after being invited to one. New on 4 October:
   * before it, a booked tour hit the "this family already has an
   * appointment" guard and told nobody at all.
   */
  readonly toursRecorded: readonly string[];
  readonly leadsConsidered: number;
  readonly letters: readonly {
    readonly leadId: string;
    readonly action: ChaseDecision["action"];
    readonly detail: string;
  }[];
  readonly errors: readonly string[];
}

type LeadRow = {
  id: string;
  school_id: string | null;
  /**
   * The campus name, embedded, because the GA/FL fork is keyed on it - see
   * the long note in tour.ts about why the name and not a column. PostgREST
   * returns an embedded row as an object or a one-element array.
   */
  schools?: { name?: string } | { name?: string }[] | null;
  lead_stage: string | null;
  guardian_email: string | null;
  created_at: string;
  notes: string | null;
};

export async function runInterestMeetingScan(
  supabase: AuthClient,
  options: ScanOptions = {}
): Promise<ScanReport> {
  const now = options.now ?? new Date();
  const dryRun = options.dryRun ?? false;
  const errors: string[] = [];

  const empty = (ran: boolean, why?: string): ScanReport => ({
    ran,
    why,
    dryRun,
    easternDate: easternDateKey(now),
    calendarsRead: [],
    calendarsSkipped: [],
    calendarProblems: [],
    campusesWithNoCalendar: [],
    bookingsSeen: 0,
    bookingsMatched: 0,
    bookingsAmbiguous: [],
    bookingsRecorded: [],
    bookingsNotNotified: [],
    postCallSkipped: [],
    toursRecorded: [],
    leadsConsidered: 0,
    letters: [],
    errors,
  });

  const easternDate = easternDateKey(now);

  if (!options.force && easternHour(now) < EARLIEST_SCAN_HOUR_EASTERN) {
    return empty(false, `Too early - it is ${easternHour(now)}:00 in Eastern.`);
  }

  /*
   * CLAIM THE NIGHT BEFORE DOING ANYTHING.
   *
   * One row per Eastern date, the date as the primary key, inserted with
   * ignoreDuplicates. Whoever inserts it owns the night; everybody else - a
   * second cron, a Vercel retry on a slow response, somebody pressing the
   * button twice - gets an empty result back and stops. Without it, two runs
   * an hour apart would each find the same families still unbooked and queue
   * the same reminder twice, and the family would get it twice in one morning.
   *
   * The claim is taken FIRST, before Google is called, because the window that
   * matters is the whole run and not the write at the end of it.
   *
   * A dry run claims nothing. It is meant to be repeatable.
   */
  if (!dryRun) {
    const { data: claimed, error: claimError } = await supabase
      .from("interest_meeting_scan_runs")
      .upsert(
        { eastern_date: easternDate, started_at: now.toISOString() },
        { onConflict: "eastern_date", ignoreDuplicates: true }
      )
      .select("eastern_date");

    if (claimError) {
      errors.push(`Could not claim the night: ${claimError.message}`);
      return empty(false, "Could not claim the night.");
    }
    if (!claimed?.length && !options.force) {
      return empty(false, `Tonight (${easternDate}) has already been scanned.`);
    }
  }

  const organizationId = await getPrimaryOrganizationId(supabase);
  if (!organizationId) return empty(false, "No organization.");

  const tokens = await ensureGoogleWorkspaceAccessToken(supabase, organizationId);
  if ("error" in tokens) {
    /*
     * STOP. Do not fall through to the chase.
     *
     * Without the calendars this job cannot tell a family who booked from one
     * who did not, and carrying on would email every family who has booked a
     * meeting to ask why they have not booked a meeting - then telephone them
     * about it two days later. A night with no reminders is recoverable. A
     * night of reminders sent to the wrong people is not.
     */
    return empty(false, `Google is not reachable: ${tokens.error}`);
  }

  const calendars = await readSharedCalendarBookings(tokens.accessToken, {
    from: new Date(now.getTime() - 45 * 86400000),
    to: new Date(now.getTime() + 180 * 86400000),
  });
  if ("error" in calendars) return empty(false, calendars.error);

  /* ------------------------------------------------------------------ */
  /* Which campus can this job actually see?                            */
  /* ------------------------------------------------------------------ */

  /*
   * The probe found Danni's calendar unshared, which left The Academy FL
   * invisible - and an invisible campus is worse than a broken one, because
   * every family at it gets chased three times and telephoned no matter how
   * promptly they book. So the job checks, every night, that each campus's
   * booking contact is a calendar it can read, and says so when one is not.
   */
  const { data: bookingContacts } = await supabase
    .from("school_admissions_contacts")
    .select("email, is_booking_contact, schools(name)")
    .eq("is_booking_contact", true);

  const readable = new Set(calendars.calendarsRead);
  const campusesWithNoCalendar: string[] = [];
  for (const contact of (bookingContacts ?? []) as {
    email: string | null;
    schools: { name?: string } | { name?: string }[] | null;
  }[]) {
    const email = contact.email?.trim().toLowerCase();
    if (!email || readable.has(email)) continue;
    const school = Array.isArray(contact.schools) ? contact.schools[0] : contact.schools;
    campusesWithNoCalendar.push(`${school?.name ?? "A campus"} (${email})`);
  }

  /* ------------------------------------------------------------------ */
  /* The leads in play                                                  */
  /* ------------------------------------------------------------------ */

  const since = new Date(now.getTime() - LEAD_LOOKBACK_DAYS * 86400000).toISOString();
  const { data: leadRows, error: leadError } = await supabase
    .from("admissions_leads")
    .select("id, school_id, lead_stage, guardian_email, created_at, notes, schools(name)")
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(1000);

  if (leadError) {
    errors.push(`Could not read the leads: ${leadError.message}`);
    return empty(false, "Could not read the leads.");
  }

  const leads = (leadRows ?? []) as LeadRow[];
  const leadIds = leads.map((l) => l.id);

  /** guardian address -> every lead carrying it. A list, because of siblings. */
  const leadsByEmail = new Map<string, string[]>();
  for (const lead of leads) {
    const email = lead.guardian_email?.trim().toLowerCase();
    if (!email) continue;
    leadsByEmail.set(email, [...(leadsByEmail.get(email) ?? []), lead.id]);
  }

  /* ------------------------------------------------------------------ */
  /* What has already happened to each of them                          */
  /* ------------------------------------------------------------------ */

  const [interviews, comms, queued, calls] = await Promise.all([
    supabase
      .from("admissions_interviews")
      .select("lead_id, scheduled_at, interview_type")
      .in("lead_id", leadIds.length ? leadIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("admissions_communications")
      .select("lead_id, template_key, trigger_event, sent_at, delivery_status")
      .in("lead_id", leadIds.length ? leadIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("admissions_communication_queue")
      .select("lead_id, trigger_event, status")
      .eq("status", "pending")
      .in("lead_id", leadIds.length ? leadIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("lead_call_outcomes")
      .select("lead_id, called_at")
      .in("lead_id", leadIds.length ? leadIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  /** An interest meeting already on the books. A shadow day is not one. */
  const bookedAt = new Map<string, Date>();
  for (const row of (interviews.data ?? []) as {
    lead_id: string;
    scheduled_at: string;
    interview_type: string | null;
  }[]) {
    if (row.interview_type === "initial_assessment") continue;
    const at = new Date(row.scheduled_at);
    const held = bookedAt.get(row.lead_id);
    if (!held || at < held) bookedAt.set(row.lead_id, at);
  }

  type CommRow = {
    lead_id: string;
    template_key: string | null;
    trigger_event: string | null;
    sent_at: string;
    delivery_status: string;
  };

  const commsByLead = new Map<string, CommRow[]>();
  for (const row of (comms.data ?? []) as CommRow[]) {
    commsByLead.set(row.lead_id, [...(commsByLead.get(row.lead_id) ?? []), row]);
  }

  /*
   * SENT, not queued and not failed.
   *
   * delivery_status is the only honest record of what a family has actually
   * received. A row with status 'failed' - Resend refusing the address, a
   * bounced domain - must NOT count as a contact, or the chase would march on
   * to the escalation and tell a school leader the family had been emailed
   * three times when they had been emailed none. Treating a failure as a
   * contact is how a platform lies to the person it is meant to be helping.
   */
  const sentAt = (leadId: string, predicate: (r: CommRow) => boolean): Date | null => {
    let found: Date | null = null;
    for (const row of commsByLead.get(leadId) ?? []) {
      if (row.delivery_status !== "sent") continue;
      if (!predicate(row)) continue;
      const at = new Date(row.sent_at);
      if (!found || at < found) found = at;
    }
    return found;
  };

  /*
   * A letter already waiting in the queue counts as done for tonight.
   *
   * Without this, a scan that runs twice - a manual press after the cron, a
   * Vercel retry on a slow response - queues a second copy of the same
   * reminder, and the family gets it twice in one morning. The decision is
   * "has this family been dealt with", not "has a letter physically left".
   */
  const queuedEvents = new Map<string, Set<string>>();
  for (const row of (queued.data ?? []) as { lead_id: string; trigger_event: string }[]) {
    const set = queuedEvents.get(row.lead_id) ?? new Set<string>();
    set.add(row.trigger_event);
    queuedEvents.set(row.lead_id, set);
  }

  const calledAt = new Map<string, Date>();
  for (const row of (calls.data ?? []) as { lead_id: string; called_at: string }[]) {
    calledAt.set(row.lead_id, new Date(row.called_at));
  }

  /* ------------------------------------------------------------------ */
  /* 1. Record the bookings                                             */
  /* ------------------------------------------------------------------ */

  const bookingsAmbiguous: string[] = [];
  const bookingsRecorded: string[] = [];
  const bookingsNotNotified: string[] = [];
  const postCallSkipped: string[] = [];
  const toursRecorded: string[] = [];

  /*
   * Families who already have a tour row.
   *
   * THE STAGE ALONE WOULD ALMOST DO IT: recording a tour moves the family off
   * tour_requested, so the next night's run no longer matches. Almost is not
   * enough. If the insert succeeds and the stage update fails - two separate
   * statements, no transaction between them - the family stays at
   * tour_requested and tomorrow's scan inserts a second tour row for the same
   * appointment. This set is what makes that impossible, and the stage write
   * failing is already reported as an error above.
   */
  const { data: existingTours } = await supabase
    .from("admissions_tours")
    .select("lead_id")
    .in("lead_id", leadIds.length ? leadIds : ["00000000-0000-0000-0000-000000000000"]);

  const alreadyRecordedTour = new Set<string>(
    ((existingTours ?? []) as { lead_id: string }[]).map((t) => t.lead_id)
  );
  let bookingsMatched = 0;

  /**
   * id -> lead, so the booking loop can ask which campus a lead belongs to.
   * The loop matches on an email address and has only ever held the id.
   */
  const leadById = new Map<string, LeadRow>(leads.map((l) => [l.id, l]));

  for (const booking of calendars.bookings) {
    const match = matchBookingToLead(booking, leadsByEmail);
    if (!match) continue;

    if ("ambiguous" in match) {
      bookingsAmbiguous.push(describe(booking, match.ambiguous));

      /*
       * UNMATCHABLE STILL MEANS UNCHASED.
       *
       * The first dry run, 2 October: ten families would have been sent "we
       * have not managed to find a time yet", and TWO of them were sitting in
       * this list. They had booked. The matcher simply could not tell which of
       * two children with the same guardian address the meeting was for.
       *
       * Being unsure which sibling a meeting belongs to is not a reason to
       * email their parent asking why they have not booked one. So every
       * candidate is marked as booked for the purposes of the chase - which
       * suppresses it - while nothing is recorded against any child, because
       * that part genuinely is unknown and a person should decide it.
       *
       * The asymmetry is deliberate: silence is recoverable, a wrong letter
       * is not.
       */
      for (const candidate of match.ambiguous) {
        if (!bookedAt.has(candidate)) bookedAt.set(candidate, new Date(booking.startsAt));
      }
      continue;
    }

    bookingsMatched++;
    const leadId = match.leadId;

    /*
     * ── IS THIS A TOUR? ─────────────────────────────────────────────────
     *
     * The scan matches a calendar event to a family by the parent's email
     * address and nothing else - that is the whole design, and it is why the
     * probe asked about attendee addresses before a line of this was written.
     * An event carries no label saying which KIND of appointment it is, and
     * Nina's three Google schedules all sit on the same calendar.
     *
     * THE FAMILY'S STAGE IS THE DISCRIMINATOR, not the calendar, not the
     * event title. A family at Tour Requested was emailed the tour calendar
     * and asked to book; the next thing they book is a tour. A family who has
     * not been asked is booking the inquiry call. The stage is a fact the
     * platform set itself, which makes it a better witness than an event
     * summary a parent never sees and Google is free to reword.
     *
     * THIS BLOCK COMES BEFORE THE bookedAt GUARD BELOW, and that is the point
     * of it. That guard says "this family already has an appointment, there
     * is nothing new here" - true for a second inquiry call, and exactly
     * wrong for a tour, which by definition happens to a family who already
     * had one. Until today a booked tour hit that guard and told nobody.
     */
    const tourLead = leadById.get(leadId) ?? null;
    if (tourLead && tourLead.lead_stage === "tour_requested") {
      if (alreadyRecordedTour.has(leadId)) continue;
      alreadyRecordedTour.add(leadId);
      toursRecorded.push(`${leadId} <- tour ${appointmentTextForFamily(booking.startsAt)}`);
      if (dryRun) continue;

      const { error: tourError } = await supabase.from("admissions_tours").insert({
        lead_id: leadId,
        scheduled_at: booking.startsAt,
        tour_type: "in_person",
        tour_status: "scheduled",
        duration_minutes: tourDurationMinutes(booking),
        notes: `Booked by the family. ${booking.summary ?? "Google Calendar"}.`,
        host_user_id: null,
      });

      if (tourError) {
        /* CHECKED, not awaited and discarded. A refused insert that moved the
           stage anyway is how 28 families came to sit in "Tour Scheduled"
           with no tour behind it. */
        errors.push(`Could not record the tour for ${leadId}: ${tourError.message}`);
        continue;
      }

      const { error: tourStageError } = await supabase
        .from("admissions_leads")
        .update({ lead_stage: "tour_scheduled", updated_at: new Date().toISOString() })
        .eq("id", leadId);

      if (tourStageError) {
        errors.push(
          `Tour recorded for ${leadId} but the stage did not move: ${tourStageError.message}`
        );
      }

      /*
       * NO LETTER, DELIBERATELY. Google has already sent this family a
       * calendar invitation for the tour they just booked - that is what an
       * appointment schedule does. A second email from us saying the same
       * thing is noise, and there is no approved wording for it. If Jimmy
       * wants a confirmation he will say the words and it is one queueLetter
       * call beside this comment.
       *
       * THE STAGE DOES NOT ADVANCE PAST tour_scheduled HERE EITHER. A tour
       * that has been BOOKED is a fact about a calendar; a tour that was HELD
       * is a judgement about whether a family turned up, and nothing in this
       * codebase makes that judgement for the interest meeting either - a
       * school leader moves the card. The same hand moves this one.
       */
      continue;
    }

    /* Already known about. Nothing to do, and nothing to tell anyone twice. */
    if (bookedAt.has(leadId)) continue;

    /*
     * A MEETING THAT HAS ALREADY HAPPENED IS RECORDED, AND NOBODY IS TOLD.
     *
     * The first dry run found seventeen bookings and SIXTEEN were in the past
     * - 19 August, 25 August, 1 September, 22 September. Recording a booking
     * fires the family's confirmation and the staff notice, so a real run
     * would have posted sixteen letters in October reading "your interest
     * meeting is Wednesday, 19 August 2026 at 9:00 AM", to families who either
     * came or did not, six weeks ago.
     *
     * The ROW is still worth writing: it is what stops those families being
     * chased, and it makes the pipeline true. The LETTER is worth nothing to
     * anybody. So the two are separated here, which they never were before
     * because nothing had ever looked at a calendar.
     *
     * The boundary is the start time against now. A meeting at three o'clock
     * this afternoon is still ahead of the family and is announced normally.
     */
    const startsAt = new Date(booking.startsAt);
    const alreadyHappened = startsAt.getTime() < now.getTime();

    bookedAt.set(leadId, startsAt);
    const when = appointmentTextForFamily(booking.startsAt);
    if (alreadyHappened) {
      bookingsNotNotified.push(`${leadId} <- ${when} (already happened; recorded, nobody told)`);
    } else {
      bookingsRecorded.push(`${leadId} <- ${when}`);
    }
    if (dryRun) continue;

    const { error } = await supabase.from("admissions_interviews").insert({
      lead_id: leadId,
      scheduled_at: booking.startsAt,
      interview_type: "virtual",
      notes: `Booked by the family. ${booking.summary ?? "Google Calendar"}.`,
      host_user_id: null,
    });

    if (error) {
      /* The insert is CHECKED, not awaited and discarded. See scheduleInterview:
         a refused insert that moved the stage anyway is how 28 families came to
         sit in "Tour Scheduled" with no tour behind it. */
      errors.push(`Could not record the booking for ${leadId}: ${error.message}`);
      continue;
    }

    /*
     * "RECORD YOUR NOTES" - TO THE SCHOOL LEADER, AT THE APPOINTMENT TIME.
     *
     * Queued here rather than by a clock of its own, because this is the
     * moment the platform learns the appointment exists at all.
     *
     * Jimmy, 5 October: "i want the email to go to the school leader at the
     * exact time of the scheduled appointment ... and the ability to record
     * all of the notes for the conversation/meeting is provided in the email
     * and all the school leader has to do is hit the button or fill in the
     * notes box."
     *
     * ALL FOUR CAMPUSES. It began life on 4 October as a GA and FL letter
     * ten minutes after the call ENDED, carrying only the tour decision. It
     * is now one letter everywhere, at the start time, carrying the notes box
     * and whichever decision belongs to that campus. A leader gets one email
     * about one meeting, not two.
     *
     * IT IS IN PLACE OF 3a. Marking a child "Interest Meeting Held" is the
     * one step in the chain with nothing chasing her for it, and a meeting
     * that happened and was never marked leaves the child frozen. Writing
     * notes about a meeting is proof it happened, so saving them moves the
     * child.
     *
     * "THE EXACT TIME" IS AS EXACT AS THE SENDER ALLOWS. scheduled_for is set
     * to the appointment's start, to the second. The queue that delivers it,
     * /api/admissions/process-communications, runs on `0 * * * *` - so a
     * meeting at 2:15pm produces a letter at 3:00pm. Closing that gap means a
     * more frequent cron, which is a Vercel plan question rather than a code
     * one. The row carries the honest time either way.
     *
     * IT IS QUEUED EVEN FOR A MEETING THAT HAS ALREADY HAPPENED, deliberately
     * - the one letter here for which the past is not a reason to stay
     * silent. The family's confirmation is worthless six weeks late; "what
     * happened, and what should happen next" is exactly as useful late,
     * because the decision it asks for has not been made. The queue sends
     * anything whose scheduled_for has passed on its next run.
     */
    const notesToken = dryRun ? "dry-run" : await mintPostCallToken(supabase, leadId);
    if (!notesToken) {
      errors.push(`Could not mint a notes token for ${leadId}.`);
    } else if (!dryRun) {
      const problem = await queueLetter(supabase, {
        leadId,
        schoolId: leadById.get(leadId)?.school_id ?? null,
        triggerEvent: POST_CALL_EVENT,
        sendAt: startsAt,
        /*
         * The token rides on the queue row because the row is rendered later
         * by a worker with no idea which occasion this was. Same reasoning as
         * the escalation's three dates: what the moment of queueing knows and
         * the moment of sending cannot find out.
         */
        mergeOverrides: {
          postCallToken: notesToken,
          /*
           * ALREADY RENDERED FOR A READER, not an ISO string.
           * interview_datetime is a passthrough - whatever a caller hands it
           * is exactly what a human reads - which is how three families were
           * told the wrong hour on 1 October. appointmentTextForFamily is the
           * one place that knows the Eastern rule.
           *
           * Passed as an override because loadMergeContextsForQueue has no
           * way to know WHICH appointment a queued letter is about. It would
           * otherwise render as nothing, and the letter would open "is
           * scheduled for ." in a school leader's inbox.
           */
          interviewDatetime: appointmentTextForFamily(booking.startsAt),
          /*
           * Null at GA and FL - a telephone call has no conference - and the
           * letter is written to cover both: "Call them or go to the google
           * meets link to start your meeting".
           */
          meetingLink: booking.meetingLink,
        },
      });
      if (problem) postCallSkipped.push(problem);
    }

    /* The row is written. The letters are only for a meeting still to come. */
    if (alreadyHappened) continue;

    try {
      /*
       * The existing path, deliberately. It renders the time through
       * appointmentTextForFamily and sends both the family's confirmation and
       * staff_interview_scheduled - the notice that has been written, wired and
       * never fired, because nothing has ever told it a booking happened.
       */
      await onInterviewScheduled(supabase, leadId, null, booking.startsAt, null);
    } catch (err) {
      errors.push(
        `Booking recorded for ${leadId} but the letters failed: ` +
          (err instanceof Error ? err.message : String(err))
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /* 2. Decide tonight's letters                                        */
  /* ------------------------------------------------------------------ */

  /* Mutable here, readonly in the report. The report is a record of a night
     that has finished; this is the list being built while it has not. */
  const letters: {
    leadId: string;
    action: ChaseDecision["action"];
    detail: string;
  }[] = [];
  const holdWeekend = options.holdWeekendEscalation ?? true;

  for (const lead of leads) {
    const already = queuedEvents.get(lead.id) ?? new Set<string>();

    const decision = decideChase({
      now,
      inquiryAt: new Date(lead.created_at),
      bookingLinkSentAt: sentAt(lead.id, (r) => r.template_key === BOOKING_LINK_TEMPLATE_KEY),
      bookedAt: bookedAt.get(lead.id) ?? null,
      reminder1SentAt:
        sentAt(lead.id, (r) => r.trigger_event === REMINDER_1_EVENT) ??
        (already.has(REMINDER_1_EVENT) ? now : null),
      reminder2SentAt:
        sentAt(lead.id, (r) => r.trigger_event === REMINDER_2_EVENT) ??
        (already.has(REMINDER_2_EVENT) ? now : null),
      escalatedAt:
        sentAt(lead.id, (r) => r.trigger_event === ESCALATION_EVENT) ??
        (already.has(ESCALATION_EVENT) ? now : null),
      leadStage: lead.lead_stage ?? "new_inquiry",
      callRecordedAt: calledAt.get(lead.id) ?? null,
      holdWeekendEscalation: holdWeekend,
    });

    if (decision.action === "nothing") continue;

    const event =
      decision.action === "escalate"
        ? ESCALATION_EVENT
        : decision.which === 1
          ? REMINDER_1_EVENT
          : REMINDER_2_EVENT;

    if (already.has(event)) continue;

    letters.push({
      leadId: lead.id,
      action: decision.action,
      detail: `${event} at ${appointmentTextForFamily(decision.sendAt.toISOString())}`,
    });

    if (dryRun) continue;

    /*
     * THE ESCALATION CARRIES ITS OWN EVIDENCE.
     *
     * It is the only letter here that a school leader reads, and the only one
     * that has to say what has already been tried. Those three dates are in
     * hand right now - sentAt has just read them - and by 7am tomorrow they
     * are three rows among thousands that nothing would go looking for. So
     * they are captured at the moment of queueing, rendered for a reader
     * rather than as ISO strings, because interview_datetime being a
     * passthrough is what told three families the wrong hour on 1 October.
     */
    let overrides: Record<string, unknown> | null = null;
    if (decision.action === "escalate") {
      const token = await mintCallToken(supabase, lead.id);
      const whenSent = (at: Date | null) =>
        at ? appointmentTextForFamily(at.toISOString()) : null;

      overrides = {
        inviteSentAt: whenSent(
          sentAt(lead.id, (r) => r.template_key === BOOKING_LINK_TEMPLATE_KEY)
        ),
        reminder1SentAt: whenSent(
          sentAt(lead.id, (r) => r.trigger_event === REMINDER_1_EVENT)
        ),
        reminder2SentAt: whenSent(
          sentAt(lead.id, (r) => r.trigger_event === REMINDER_2_EVENT)
        ),
        interestCallToken: token,
        /*
         * What the family wrote when they inquired, quoted back to the person
         * about to telephone them. It is there on purpose: it is the one
         * thing that makes a cold call easy to start, and a leader who has to
         * go and look it up usually does not.
         */
        inquiryNotes: lead.notes,
      };
      if (!token) {
        errors.push(`${lead.id}: could not mint a call token; the link falls back to the case page.`);
      }
    }

    const problem = await queueLetter(supabase, {
      leadId: lead.id,
      schoolId: lead.school_id,
      triggerEvent: event,
      sendAt: decision.sendAt,
      mergeOverrides: overrides,
    });
    if (problem) errors.push(problem);
  }

  const report: ScanReport = {
    ran: true,
    dryRun,
    easternDate,
    calendarsRead: calendars.calendarsRead,
    calendarsSkipped: calendars.calendarsSkipped,
    calendarProblems: calendars.problems,
    campusesWithNoCalendar,
    bookingsSeen: calendars.bookings.length,
    bookingsMatched,
    bookingsAmbiguous,
    bookingsRecorded,
    bookingsNotNotified,
    postCallSkipped,
    toursRecorded,
    leadsConsidered: leads.length,
    letters,
    errors,
  };

  /*
   * WHAT THE NIGHT DID, WRITTEN DOWN WHERE IT SURVIVES THE REQUEST.
   *
   * Nobody watches an 11pm cron in a browser. platform_job_runs exists for
   * exactly this reason and stayed empty for months, which is how "the cron
   * never fired" went undiagnosed. Swallowed deliberately: the work is already
   * done by the time this is called, and failing to write the log must not
   * turn a good night into a 500 that makes Vercel retry the whole thing
   * against live data.
   */
  if (!dryRun) {
    const { error } = await supabase
      .from("interest_meeting_scan_runs")
      .update({ finished_at: new Date().toISOString(), report })
      .eq("eastern_date", easternDate);
    if (error) console.error("[interest-meeting-scan] could not record the run", error.message);
  }

  return report;
}

function describe(booking: CalendarBooking, leadIds: string[]): string {
  return (
    `${booking.summary ?? "(no title)"} on ${booking.startsAt} matched ` +
    `${leadIds.length} families (${leadIds.join(", ")}) - left for a person.`
  );
}

/**
 * Put one letter in the queue at an exact time.
 *
 * WHY THIS DOES NOT USE adjustManyScheduledForBusinessHours, which is what
 * every other scheduled letter goes through.
 *
 * That function decides whether a moment falls inside a school's opening hours
 * using `at.getDay()` and `at.toTimeString()` - the SERVER's local day and
 * time, which on Vercel is UTC - and pushes anything outside them to
 * `candidate.setHours(9, 0, 0, 0)`, which is nine in the morning UTC and five
 * in the morning in Florida. It is the same class of fault as the
 * toLocaleString() that told three families the wrong hour on 1 October, and
 * it has gone unnoticed only because all four parent reminders are switched
 * off, so almost nothing is ever queued.
 *
 * These times are already chosen in Eastern and are already civilised - 8am
 * for a family, 7am for a school leader. Handing them to that adjuster would
 * move them, wrongly, to five in the morning. So it is not used, and the fault
 * is reported for a separate fix rather than patched from in here: it is
 * shared machinery that tour reminders also depend on.
 */
async function queueLetter(
  supabase: AuthClient,
  params: {
    leadId: string;
    schoolId: string | null;
    triggerEvent: string;
    sendAt: Date;
    mergeOverrides?: Record<string, unknown> | null;
  }
): Promise<string | null> {
  if (!params.schoolId) return `${params.leadId}: no campus on the lead.`;

  const { data: templates } = await supabase
    .from("admissions_communication_templates")
    .select("id, template_key, channel, school_id")
    .eq("trigger_event", params.triggerEvent)
    .eq("is_active", true)
    .or(`school_id.is.null,school_id.eq.${params.schoolId}`);

  const rows = (templates ?? []) as {
    id: string;
    template_key: string;
    channel: string;
    school_id: string | null;
  }[];
  if (!rows.length) {
    /*
     * Not an error, and worth saying why. The three chase templates are seeded
     * SWITCHED OFF, because Jimmy sees the exact words a human will read
     * before they ship. Until he turns them on the scan runs every night,
     * finds the bookings, records them, and writes no chase letters at all -
     * which is the right behaviour for an unapproved letter and is reported
     * rather than silent.
     */
    return `${params.leadId}: no active template for ${params.triggerEvent}.`;
  }

  /* A campus override wins over the network-wide version. Same rule as the engine. */
  const chosen = rows.find((t) => t.school_id) ?? rows[0];

  const { error } = await supabase.from("admissions_communication_queue").insert({
    lead_id: params.leadId,
    application_id: null,
    template_id: chosen.id,
    template_key: chosen.template_key,
    trigger_event: params.triggerEvent,
    channel: chosen.channel,
    scheduled_for: params.sendAt.toISOString(),
    status: "pending",
    merge_overrides: params.mergeOverrides ?? null,
  });

  return error ? `${params.leadId}: ${error.message}` : null;
}

/**
 * The single-use link in the escalation email.
 *
 * SAME SHAPE AS THE APPLICATION TOKEN (migration 412): 64 lowercase hex,
 * minted here, read by exactly one route, and never accepted from anywhere
 * else. Nothing in this codebase takes a lead id from a browser and this does
 * not start.
 *
 * MINTED ONCE AND REUSED. A leader who is escalated about the same family
 * twice - because she left a message, and three days later nothing has
 * changed - should not find her first link dead. The token identifies the
 * family, not the occasion; each call is a row of its own in
 * lead_call_outcomes.
 *
 * crypto.randomUUID twice rather than a cryptographic RNG import: 256 bits of
 * v4 entropy, from the same Web Crypto the runtime already provides, and the
 * value is a lookup key on an indexed column rather than a secret that
 * protects money.
 */
/**
 * How long the family's tour slot actually is, from Google, falling back to
 * the hour that both campus tour schedules use today. Stored because
 * admissions_tours.duration_minutes is NOT NULL and a wrong default would
 * show the wrong length on the board.
 */
function tourDurationMinutes(booking: CalendarBooking): number {
  if (!booking.endsAt) return DEFAULT_TOUR_MINUTES;
  const ms = new Date(booking.endsAt).getTime() - new Date(booking.startsAt).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return DEFAULT_TOUR_MINUTES;
  return Math.round(ms / 60000);
}

/** PostgREST hands an embedded row back as an object or a one-element array. */
function schoolNameOf(lead: LeadRow): string | null {
  const embedded = lead.schools;
  const school = Array.isArray(embedded) ? embedded[0] : embedded;
  return school?.name?.trim() || null;
}

/**
 * The single-use link in the post-call letter.
 *
 * A SEPARATE COLUMN FROM interest_call_token AND application_call_token, and
 * the reason is worth keeping written down: a family can be chased for a
 * booking, asked about after the call, and chased again for an application.
 * Three emails, three pages, three different questions. One shared token
 * would mean the oldest email in a leader's inbox opens the newest page -
 * she would answer "what came of the call?" and be shown "re-send the
 * application?" instead.
 *
 * MINTED ONCE AND REUSED, same as the other two: the token identifies the
 * family, not the occasion, and each decision is its own row in
 * lead_call_outcomes.
 */
async function mintPostCallToken(
  supabase: AuthClient,
  leadId: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("admissions_leads")
    .select("post_call_token")
    .eq("id", leadId)
    .maybeSingle();

  const held = (existing as { post_call_token?: string | null } | null)
    ?.post_call_token;
  if (held) return held;

  const token = (
    globalThis.crypto.randomUUID() + globalThis.crypto.randomUUID()
  ).replace(/-/g, "");

  const { error } = await supabase
    .from("admissions_leads")
    .update({ post_call_token: token })
    .eq("id", leadId);

  return error ? null : token;
}

async function mintCallToken(
  supabase: AuthClient,
  leadId: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("admissions_leads")
    .select("interest_call_token")
    .eq("id", leadId)
    .maybeSingle();

  const held = (existing as { interest_call_token?: string | null } | null)
    ?.interest_call_token;
  if (held) return held;

  const token = (
    globalThis.crypto.randomUUID() + globalThis.crypto.randomUUID()
  ).replace(/-/g, "");

  const { error } = await supabase
    .from("admissions_leads")
    .update({ interest_call_token: token })
    .eq("id", leadId);

  return error ? null : token;
}
