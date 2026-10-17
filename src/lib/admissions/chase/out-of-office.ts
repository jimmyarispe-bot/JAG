/**
 * What happens to a family when the school leader is not here.
 *
 * ── WHAT JIMMY ASKED, AND THE CORRECTION THAT SHAPED THIS FILE ─────────────
 *
 * 16 October 2026: "is the function working that initiates the stages when
 * one of the school leaders calendars is marked out of the office". It was
 * not. Nothing of the kind had ever been built.
 *
 * The first design auto-pressed Skip next stage. He refused it:
 *
 *   "why would this ever happen without human doing it; this can't happen
 *    wo human actually initiating"
 *
 * and then narrowed the refusal precisely:
 *
 *   "i didn't say nothing moves, i said the skip to next step needs a human"
 *
 * THAT DISTINCTION IS THIS WHOLE FILE. Skipping a stage is passing over
 * something a person decided not to do, and only a person may decide that.
 * The flow proceeding in order is not skipping anything.
 *
 * HE WAS RIGHT, AND THE LIVE PIPELINE PROVED IT BEFORE A LINE WAS WRITTEN.
 * On the day this was designed, one out-of-office day for Heather would have
 * moved 41 children under the first design - 18 at Virtual Interest Meeting
 * Held, 18 at Virtual New Inquiry, 5 at HS Interest Meeting Held - and 23 of
 * those had not been touched since 26 August. A two-month backlog shoved
 * forward because somebody went to the dentist.
 *
 * ── A FACT IS NOT A JUDGEMENT, AND ONLY FACTS FIRE HERE ────────────────────
 *
 * Of the four stages where the next step is the leader's and nobody else's,
 * exactly one is not a judgement:
 *
 *   New Inquiry        send the interest meeting link    EVERY inquiry gets
 *                                                        one. Not a decision.
 *                                                        -> FIRES
 *   Interest Mtg Held  send the tour / shadow day invite she is saying this
 *                                                        family is a fit
 *   Tour Completed     "should we invite them to apply?" a gate. A question.
 *   Application Subm.  "invite them to shadow days?"     a gate. A question.
 *
 * A machine answering a gate "yes" on her behalf is the machine making her
 * decision wearing a different hat, which is the thing he refused. So three
 * of the four wait for her, however long she is away, and the fourth - a new
 * family who would otherwise sit unanswered until Monday - does not.
 *
 * ── WHAT IT ACTUALLY DOES, IN ONE SENTENCE ─────────────────────────────────
 *
 * It calls sendInterestMeetingLink with the same token her own button
 * carries, so the machine does EXACTLY what her press does and nothing more.
 * Not a copy of it. The same function. If that function changes, this changes
 * with it, and no second implementation can drift away from the first.
 */

import {
  easternDateKey,
  easternDateKeyPlusDays,
  easternInstant,
  easternWeekdayOfKey,
  nextEasternWeekdayKey,
} from "@/lib/platform/time/eastern";
import { sendInterestMeetingLink } from "@/lib/admissions/send-interest-link";
import { getEmailProvider } from "@/lib/platform/email/provider";
import { divertEmail } from "@/lib/platform/email/divert";
import { renderLetterHtml } from "@/lib/admissions/communications/letter-html";
import type { OutOfOfficeBlock } from "@/lib/admissions/chase/calendar";

/**
 * Her working day, Eastern. Jimmy, 16 October: "a block on her own calendar
 * that Google marks Out of office, covering her whole working day Eastern -
 * 8am to 5pm - on a weekday... A half day doesn't count."
 */
export const WORKING_DAY_START_HOUR = 8;
export const WORKING_DAY_END_HOUR = 17;

/**
 * How recently a child must have arrived for an absence to act on them.
 *
 * FOURTEEN DAYS, AND THE NUMBER IS NOT ARBITRARY. Virtual holds eighteen
 * children at Interest Meeting Held whose last movement was 26 August. A
 * family that has heard nothing for seven weeks needs a person, not a cron
 * firing because a leader took a Tuesday off. Anything older than this is
 * reported and left alone, deliberately visibly, so the backlog is a thing
 * somebody sees rather than a thing quietly mailed.
 */
export const ACTS_ON_CHILDREN_NEWER_THAN_DAYS = 14;

/** One leader, one unbroken run of working days she is away. */
export interface Absence {
  /** Her calendar id, lower-cased. The booking-contact address. */
  readonly calendarId: string;
  /** Every working day she is out, Eastern date keys, ascending. */
  readonly dateKeys: readonly string[];
  /** The first of them. The absence's identity, for firing once per absence. */
  readonly startedOn: string;
}

/* ------------------------------------------------------------------ */
/* Pure: is she out, on this day?                                      */
/* ------------------------------------------------------------------ */

/**
 * Does this block cover the whole of that Eastern working day?
 *
 * ALL-DAY: Google's end date is EXCLUSIVE. One day off on the 19th arrives as
 * start 2026-10-19, end 2026-10-20. A block with no end at all is treated as
 * the single day it starts on, which is what Google means by it.
 *
 * TIMED: it must start at or before 8am and end at or after 5pm. A block from
 * 9 to 12 is a morning out, not a day out, and a leader who is back after
 * lunch can press her own buttons.
 */
export function blockCoversWorkingDay(
  block: OutOfOfficeBlock,
  dateKey: string
): boolean {
  const weekday = easternWeekdayOfKey(dateKey);
  if (weekday === 0 || weekday === 6) return false;

  if (block.allDay) {
    const start = block.startsAt.slice(0, 10);
    const end = block.endsAt
      ? block.endsAt.slice(0, 10)
      : easternDateKeyPlusDays(start, 1);
    return dateKey >= start && dateKey < end;
  }

  const startsAt = new Date(block.startsAt);
  const endsAt = block.endsAt ? new Date(block.endsAt) : null;
  if (Number.isNaN(startsAt.getTime())) return false;
  if (!endsAt || Number.isNaN(endsAt.getTime())) return false;

  const dayOpens = easternInstant(dateKey, WORKING_DAY_START_HOUR);
  const dayCloses = easternInstant(dateKey, WORKING_DAY_END_HOUR);
  return startsAt.getTime() <= dayOpens.getTime() && endsAt.getTime() >= dayCloses.getTime();
}

/**
 * Every absence on every calendar, as unbroken runs of working days.
 *
 * MONDAY TO FRIDAY IS ONE ABSENCE, NOT FIVE. Jimmy, on how far a child should
 * move: "one rung per child per absence" - "correct". So the run has to be a
 * thing with an identity, and its identity is the calendar plus the first day
 * of it. Two separate days off in the same week are two absences; a Friday
 * and the Monday after are one, because no working day sits between them.
 *
 * THE WALK LOOKS FORWARD AS WELL AS BACK, AND THE FIRST DRAFT DID NOT.
 *
 * Three tests caught it. A run on the Monday night of a Monday-to-Friday
 * absence found only the Monday, reported "day 1 of 1", and split a Monday
 * and a Wednesday into one absence instead of two - because every day after
 * today was outside the window and therefore invisible. Nothing would have
 * been sent wrongly: the action only ever asks about today. But the line a
 * person reads in the run would have said she was on the last day of her
 * absence every single day of it, and the once-per-absence grouping would
 * have been wrong at the only moment it matters.
 *
 * The scan's own calendar window runs 45 days back and 180 forward; walking
 * all 225 to answer "is she out today" would be waste, so this takes thirty
 * each way.
 */
export function absencesFromBlocks(
  blocks: readonly OutOfOfficeBlock[],
  options: {
    readonly now: Date;
    readonly lookBackDays?: number;
    readonly lookAheadDays?: number;
  }
): Absence[] {
  const lookBack = options.lookBackDays ?? 30;
  const lookAhead = options.lookAheadDays ?? 30;
  const span = lookBack + lookAhead;
  const today = easternDateKey(options.now);
  const firstKey = easternDateKeyPlusDays(today, -lookBack);

  const byCalendar = new Map<string, OutOfOfficeBlock[]>();
  for (const block of blocks) {
    const id = block.calendarId.toLowerCase();
    byCalendar.set(id, [...(byCalendar.get(id) ?? []), block]);
  }

  const absences: Absence[] = [];

  for (const [calendarId, own] of byCalendar) {
    const out: string[] = [];
    let key = firstKey;
    for (let i = 0; i <= span; i++) {
      if (own.some((block) => blockCoversWorkingDay(block, key))) out.push(key);
      key = easternDateKeyPlusDays(key, 1);
    }
    if (!out.length) continue;

    let run: string[] = [out[0]];
    for (let i = 1; i < out.length; i++) {
      const expected = nextEasternWeekdayKey(easternDateKeyPlusDays(out[i - 1], 1));
      if (out[i] === expected) {
        run.push(out[i]);
        continue;
      }
      absences.push({ calendarId, dateKeys: run, startedOn: run[0] });
      run = [out[i]];
    }
    absences.push({ calendarId, dateKeys: run, startedOn: run[0] });
  }

  return absences;
}

/** The absences covering this Eastern day, one per leader at most. */
export function absencesOn(
  absences: readonly Absence[],
  dateKey: string
): Map<string, Absence> {
  const out = new Map<string, Absence>();
  for (const absence of absences) {
    if (absence.dateKeys.includes(dateKey)) out.set(absence.calendarId, absence);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* The step itself                                                     */
/* ------------------------------------------------------------------ */

export interface OutOfOfficeReport {
  /** "heather.brown@theacademyway.org out 2026-10-19 (day 1 of 3)". */
  readonly leadersOut: readonly string[];
  /** Campus names reached, because one leader can hold two. */
  readonly campusesCovered: readonly string[];
  /** Children whose family was written to. Named, so a run can be read. */
  readonly linksSent: readonly string[];
  /** Qualifying but older than the window. Reported loudly, never mailed. */
  readonly leftForAPerson: readonly string[];
  /** Already done for this absence, or the family already has the letter. */
  readonly alreadyDone: readonly string[];
  /** "While you were out" letters sent tonight, one per absence that ended. */
  readonly summariesSent: readonly string[];
  readonly problems: readonly string[];
}

export const EMPTY_OUT_OF_OFFICE_REPORT: OutOfOfficeReport = {
  leadersOut: [],
  campusesCovered: [],
  linksSent: [],
  leftForAPerson: [],
  alreadyDone: [],
  summariesSent: [],
  problems: [],
};

/**
 * The loose client shape, as send-interest-link.ts does it.
 *
 * `admissions_out_of_office_sends` is not in the generated types, and a
 * typed client refuses a table it has never heard of. The alternative is
 * regenerating types inside a feature branch, which is a bigger change than
 * the feature.
 */
type Row = Record<string, unknown>;
type Answer<T> = PromiseLike<{ data: T; error: { message: string } | null }>;

interface Query extends Answer<Row[] | null> {
  select: (columns: string) => Query;
  eq: (column: string, value: string | boolean) => Query;
  in: (column: string, values: string[]) => Query;
  is: (column: string, value: null) => Query;
  limit: (count: number) => Query;
}

interface UntypedClient {
  from: (table: string) => Query & { insert: (row: Row) => Answer<null> };
}

function text(value: unknown): string | null {
  const out = typeof value === "string" ? value.trim() : "";
  return out ? out : null;
}

function childName(lead: Row): string {
  return (
    text(lead.preferred_name) ||
    `${text(lead.first_name) ?? ""} ${text(lead.last_name) ?? ""}`.trim() ||
    String(lead.id ?? "a child")
  );
}

/**
 * Send the interest meeting link for every new inquiry at the campus of a
 * leader who is out today, and record that it was this absence that did it.
 *
 * THE CLIENT IS THE CALLER'S. The scan hands in its service-role client, and
 * a human pressing the dry-run button hands in their own - so a human sees
 * exactly what their own account can see, and the cron sees everything. The
 * send itself goes through sendInterestMeetingLink, which carries its own
 * service-role client because the page it was written for has no sign-in.
 */
export async function runOutOfOfficeStep(
  supabase: unknown,
  input: {
    readonly now: Date;
    readonly outOfOffice: readonly OutOfOfficeBlock[];
    readonly dryRun: boolean;
  }
): Promise<OutOfOfficeReport> {
  const db = supabase as UntypedClient;
  const today = easternDateKey(input.now);
  const absences = absencesFromBlocks(input.outOfOffice, { now: input.now });
  const outToday = absencesOn(absences, today);
  if (!outToday.size) return EMPTY_OUT_OF_OFFICE_REPORT;

  const leadersOut: string[] = [];
  for (const [calendarId, absence] of outToday) {
    const day = absence.dateKeys.indexOf(today) + 1;
    leadersOut.push(
      `${calendarId} out ${today} (day ${day} of ${absence.dateKeys.length})`
    );
  }

  const problems: string[] = [];
  const linksSent: string[] = [];
  const leftForAPerson: string[] = [];
  const alreadyDone: string[] = [];
  const campusesCovered: string[] = [];

  /*
   * HER CALENDAR TO HER CAMPUSES, THROUGH THE TABLE THE SCAN ALREADY TRUSTS.
   *
   * school_admissions_contacts.is_booking_contact is what campusesWithNoCalendar
   * is checked against every night, so the same row that decides "this campus
   * has a readable calendar" decides "this absence belongs to this campus".
   * Two sources for one fact is how they come to disagree.
   *
   * HEATHER HOLDS TWO. She is the booking contact for The Academy HS and The
   * Academy Virtual both, so one absence reaches two campuses. That is not a
   * special case in the code and must not become one - it falls out of the
   * table, and the next leader to hold two will work the same way.
   */
  const { data: contactRows, error: contactError } = await db
    .from("school_admissions_contacts")
    .select("email, school_id, is_booking_contact, schools(name)")
    .eq("is_booking_contact", true);
  if (contactError) {
    return {
      ...EMPTY_OUT_OF_OFFICE_REPORT,
      leadersOut,
      problems: [`Could not read the booking contacts: ${contactError.message}`],
    };
  }

  const schoolIds: string[] = [];
  const schoolNameById = new Map<string, string>();
  /** Campus -> whose absence covers it. Built once, read per child. */
  const calendarBySchoolId = new Map<string, string>();
  for (const row of (contactRows ?? []) as Row[]) {
    const email = text(row.email)?.toLowerCase();
    const schoolId = text(row.school_id);
    if (!email || !schoolId || !outToday.has(email)) continue;
    const embedded = row.schools as Row | Row[] | null;
    const school = (Array.isArray(embedded) ? embedded[0] : embedded) ?? null;
    const name = text(school?.name) ?? schoolId;
    schoolIds.push(schoolId);
    schoolNameById.set(schoolId, name);
    calendarBySchoolId.set(schoolId, email);
    campusesCovered.push(name);
  }

  if (!schoolIds.length) {
    return {
      ...EMPTY_OUT_OF_OFFICE_REPORT,
      leadersOut,
      problems: [
        "A leader is out of office but her calendar is not the booking contact for any campus, so nothing could be attributed to her.",
      ],
    };
  }

  /*
   * NEW INQUIRY ONLY, AND NOT ARCHIVED.
   *
   * The archived_at guard is the omission found on 7 October in the sweep
   * next door: migration 228 added the column and two nightly jobs went on
   * chasing children who had been archived. It is written here on the first
   * draft rather than found in three weeks.
   */
  const { data: leadRows, error: leadError } = await db
    .from("admissions_leads")
    .select(
      "id, school_id, lead_stage, created_at, archived_at, interest_link_token, " +
        "guardian_email, first_name, last_name, preferred_name"
    )
    .eq("lead_stage", "new_inquiry")
    .in("school_id", schoolIds)
    .is("archived_at", null)
    .limit(500);

  if (leadError) {
    return {
      ...EMPTY_OUT_OF_OFFICE_REPORT,
      leadersOut,
      campusesCovered,
      problems: [`Could not read the new inquiries: ${leadError.message}`],
    };
  }

  const cutoff = new Date(
    input.now.getTime() - ACTS_ON_CHILDREN_NEWER_THAN_DAYS * 86400000
  );

  for (const lead of (leadRows ?? []) as Row[]) {
    const leadId = text(lead.id);
    const schoolId = text(lead.school_id);
    if (!leadId || !schoolId) continue;
    const name = `${childName(lead)} (${schoolNameById.get(schoolId) ?? schoolId})`;

    const createdAt = new Date(String(lead.created_at ?? ""));
    if (Number.isNaN(createdAt.getTime()) || createdAt.getTime() < cutoff.getTime()) {
      leftForAPerson.push(name);
      continue;
    }

    if (!text(lead.guardian_email)) {
      problems.push(`${name}: no email address on the inquiry, so there is nowhere to send it.`);
      continue;
    }

    const token = text(lead.interest_link_token);
    if (!token) {
      problems.push(`${name}: no interest link token on the lead, so her own button would not work either.`);
      continue;
    }

    /*
     * Whose absence is this being done under. The unique index on
     * (lead_id, calendar_id, absence_started_on) is what makes Monday-to-
     * Friday move a child once: the insert on Tuesday conflicts with
     * Monday's row and the send never happens.
     */
    const calendarId = calendarBySchoolId.get(schoolId);
    if (!calendarId) continue;
    const absence = outToday.get(calendarId);
    if (!absence) continue;

    if (input.dryRun) {
      linksSent.push(`${name} — would send`);
      continue;
    }

    const { error: claimError } = await db
      .from("admissions_out_of_office_sends")
      .insert({
        lead_id: leadId,
        calendar_id: calendarId,
        absence_started_on: absence.startedOn,
        sent_on: today,
        template_key: "inquiry_thank_you_email",
      });

    if (claimError) {
      // 23505 is the one-per-child-per-absence index doing its job.
      if (/duplicate key|23505/i.test(claimError.message)) {
        alreadyDone.push(name);
        continue;
      }
      problems.push(`${name}: could not record the send (${claimError.message}).`);
      continue;
    }

    /*
     * THE CLAIM IS WRITTEN FIRST, THE LETTER SECOND, and that order is
     * chosen. If the send fails the row stays and this child is not retried
     * tomorrow - which is the safe way round, because the alternative is a
     * family receiving the same letter every morning of a week-long absence
     * while a transient Google error clears. A failure is reported here and
     * the leader's own button still works when she is back.
     */
    const sent = await sendInterestMeetingLink(token);
    if ("error" in sent) {
      problems.push(`${name}: ${sent.error}`);
      continue;
    }
    linksSent.push(name);
  }

  return {
    leadersOut,
    campusesCovered: [...new Set(campusesCovered)],
    linksSent,
    leftForAPerson,
    alreadyDone,
    /* Filled by the caller, which runs sendOutOfOfficeSummaries after this. */
    summariesSent: [],
    problems,
  };
}

/* ------------------------------------------------------------------ */
/* "While you were out"                                                */
/* ------------------------------------------------------------------ */

/**
 * The letter she gets when she is back, naming every family written to.
 *
 * JIMMY'S WORDS, 16 OCTOBER, AND ONE EDIT HE MADE HIMSELF. The draft subject
 * read "While you were out - N families were sent the scheduling link" and
 * he cut it to four words: "only while you were out in subject". So there is
 * no count merge field, here or in migration 564.
 *
 * SENT OUTSIDE THE ADMISSIONS QUEUE, DELIBERATELY, and the reason is a
 * disclosure rather than a tidiness preference.
 * `admissions_communication_queue.lead_id` is NOT NULL. This letter is about
 * an ABSENCE and names several families, so putting it through the normal
 * path means anchoring it to one child - and anyone who later reads that
 * child's communications sees four other families' names, grades and
 * telephone numbers sitting on their record. So it goes straight through the
 * email provider, divert.ts honoured exactly as the engine honours it, and
 * is recorded against the absence in admissions_out_of_office_summaries.
 *
 * THE WORDS ARE READ FROM THE DATABASE, not carried here, so Jimmy can
 * change a sentence with an update statement rather than a deploy - the same
 * arrangement as every other letter in the platform.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

/** "Monday 19 October", from an Eastern date key. */
export function longDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday} ${day} ${MONTHS[month - 1]}`;
}

/**
 * "Monday 19 October to Wednesday 21 October", or one day on its own.
 *
 * The FIRST and LAST working day she was out, not every day between. A
 * five-day absence reading as a list of five dates tells her nothing she
 * does not know and makes the first sentence unreadable.
 */
export function formatAbsenceDates(dateKeys: readonly string[]): string {
  if (!dateKeys.length) return "";
  const first = longDate(dateKeys[0]);
  if (dateKeys.length === 1) return first;
  return `${first} to ${longDate(dateKeys[dateKeys.length - 1])}`;
}

/**
 * One line per child: name, grade, parent name, parent phone.
 *
 * Jimmy: "renders one line per child - name, grade, parent name, parent
 * phone - same four facts the inquiry alert gives you."
 *
 * ALWAYS THE CHILD'S NAME, never a pronoun and never "the student", which is
 * the oldest standing rule on this build.
 */
export function formatFamilyLines(
  families: readonly {
    readonly childName: string;
    readonly grade: string | null;
    readonly guardianName: string | null;
    readonly guardianPhone: string | null;
  }[]
): string {
  return families
    .map((family) =>
      [family.childName, family.grade, family.guardianName, family.guardianPhone]
        .map((part) => (typeof part === "string" ? part.trim() : ""))
        .filter(Boolean)
        .join(" &middot; ")
    )
    .join("<br>");
}

export interface SummaryReport {
  /** "heather.brown@theacademyway.org — 3 families". */
  readonly sent: readonly string[];
  readonly problems: readonly string[];
}

export const EMPTY_SUMMARY_REPORT: SummaryReport = { sent: [], problems: [] };

/**
 * Send the summary for every absence that ENDS today.
 *
 * TODAY, NOT YESTERDAY. The scan runs at 11pm Eastern, so the run on the
 * last night of an absence is the one that sends it, and she reads it first
 * thing on the morning she is back. Waiting for the next night's run would
 * put it in front of her at the END of her first day back, by which time she
 * has already opened the pipeline and wondered what happened.
 *
 * AN ABSENCE THAT SENT NOTHING SENDS NO LETTER. A leader who was out on a
 * week when nobody inquired does not need an email telling her so.
 */
export async function sendOutOfOfficeSummaries(
  supabase: unknown,
  input: {
    readonly now: Date;
    readonly absences: readonly Absence[];
    readonly dryRun: boolean;
  }
): Promise<SummaryReport> {
  const today = easternDateKey(input.now);
  const ending = input.absences.filter(
    (absence) => absence.dateKeys[absence.dateKeys.length - 1] === today
  );
  if (!ending.length) return EMPTY_SUMMARY_REPORT;

  const db = supabase as UntypedClient;
  const sent: string[] = [];
  const problems: string[] = [];

  const { data: templateRows, error: templateError } = await db
    .from("admissions_communication_templates")
    .select("subject, body, is_active")
    .eq("template_key", "staff_out_of_office_summary");

  if (templateError) {
    return {
      sent: [],
      problems: [`Could not read the letter: ${templateError.message}`],
    };
  }
  const template = ((templateRows ?? []) as Row[])[0] ?? null;
  if (!template) {
    return {
      sent: [],
      problems: [
        "staff_out_of_office_summary is not in admissions_communication_templates. Migration 564 has not run here.",
      ],
    };
  }
  if (template.is_active === false) {
    return { sent: [], problems: ["staff_out_of_office_summary is switched off."] };
  }

  for (const absence of ending) {
    const { data: sendRows, error: sendError } = await db
      .from("admissions_out_of_office_sends")
      .select(
        "lead_id, admissions_leads(first_name, last_name, preferred_name, current_grade, " +
          "guardian_first_name, guardian_last_name, guardian_phone)"
      )
      .eq("calendar_id", absence.calendarId)
      .eq("absence_started_on", absence.startedOn);

    if (sendError) {
      problems.push(`${absence.calendarId}: could not read what was sent (${sendError.message}).`);
      continue;
    }

    const rows = (sendRows ?? []) as Row[];
    if (!rows.length) continue;

    const families = rows.map((row) => {
      const embedded = row.admissions_leads as Row | Row[] | null;
      const lead = (Array.isArray(embedded) ? embedded[0] : embedded) ?? {};
      return {
        childName: childName(lead),
        grade: text(lead.current_grade),
        guardianName:
          `${text(lead.guardian_first_name) ?? ""} ${text(lead.guardian_last_name) ?? ""}`.trim() ||
          null,
        guardianPhone: text(lead.guardian_phone),
      };
    });

    if (input.dryRun) {
      sent.push(`${absence.calendarId} — ${families.length} families — would send`);
      continue;
    }

    /*
     * The claim before the send, same order and same reasoning as the sends
     * table: a second letter naming the same families is worse than no
     * letter, and the unique index is the only thing that cannot be raced.
     */
    const { error: claimError } = await db
      .from("admissions_out_of_office_summaries")
      .insert({
        calendar_id: absence.calendarId,
        absence_started_on: absence.startedOn,
        absence_ended_on: today,
        families_named: families.length,
        sent_to: absence.calendarId,
      });

    if (claimError) {
      if (!/duplicate key|23505/i.test(claimError.message)) {
        problems.push(`${absence.calendarId}: could not record the letter (${claimError.message}).`);
      }
      continue;
    }

    /*
     * RENDERED BY renderLetterHtml, NOT BY STRING REPLACEMENT.
     *
     * The first draft substituted the three fields by hand. That worked and
     * was wrong: every other letter in the platform goes through
     * renderLetterHtml, which resolves the merge fields AND wraps the body in
     * the letter chrome - the paragraph spacing, the button styling, the
     * sole-anchor-paragraph rule that turns "Open your pipeline" into a
     * button. A hand-substituted body reaches her as bare HTML and is the one
     * letter in her inbox that does not look like the others.
     *
     * It needs no lead: renderLetterHtml takes a body, a subject and a merge
     * context, and nothing about it is lead-bound. Only the QUEUE is, which
     * is why this letter still goes straight to the provider afterwards.
     */
    const subject = String(template.subject ?? "While you were out");
    const body = renderLetterHtml({
      rawBody: String(template.body ?? ""),
      subject,
      ctx: {
        outOfOfficeDates: formatAbsenceDates(absence.dateKeys),
        outOfOfficeFamilies: formatFamilyLines(families),
      },
    });

    const outgoing = divertEmail({
      to: absence.calendarId,
      subject,
      body,
      kind: "system_notification",
    });

    /* divert.ts returns null when a letter must not leave the building. */
    if (!outgoing) {
      sent.push(`${absence.calendarId} — ${families.length} families — diverted, not sent`);
      continue;
    }

    const result = await getEmailProvider().send(outgoing);
    if (!result.success) {
      problems.push(`${absence.calendarId}: the letter did not send (${result.error ?? "no reason given"}).`);
      continue;
    }
    sent.push(`${absence.calendarId} — ${families.length} families`);
  }

  return { sent, problems };
}
