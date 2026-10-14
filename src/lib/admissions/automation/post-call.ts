/**
 * "RECORD your notes for {{student_name}}" — the letter that lands when the
 * interest meeting starts, and the page behind it.
 *
 * Jimmy, 5 October: "at the end of 2f or beginning or in place of 3a i want
 * the email to go to the school leader at the exact time of the scheduled
 * appointment. I want the email subject to read - RECORD your notes for
 * [student] ---- and the ability to record all of the notes for the
 * conversation/meeting is provided in the email and all the school leader has
 * to do is hit the button or fill in the notes box."
 *
 * ── WHAT THIS REPLACED ──────────────────────────────────────────────────────
 *
 * Shipped this morning as a GA and FL letter ten minutes after the inquiry
 * call ended, carrying only the tour decision. It is now ONE letter at ALL
 * FOUR campuses, at the appointment time, carrying the notes box and whichever
 * decision belongs to that campus. A leader gets one email about one meeting,
 * not two.
 *
 * The route, the token column and the trigger event keep their original names
 * - /post-call/<token>, admissions_leads.post_call_token,
 * staff_inquiry_call_held. Renaming them would touch six files to change
 * nothing a human sees; the label in TRIGGER_EVENT_LABELS, which Jimmy DOES
 * see in the template admin, was updated instead.
 *
 * ── WHY IT IS IN PLACE OF 3a ────────────────────────────────────────────────
 *
 * 3a - a school leader marking a child "Interest Meeting Held" in JAG - is
 * the one step in the whole chain with nothing chasing her for it. A meeting
 * that happened and was never marked leaves the child frozen: no gate opens,
 * nothing chases, and the board looks like a family who never turned up.
 *
 * Writing notes about a meeting is proof the meeting happened, so saving them
 * moves the child. That is the whole reason this is worth building rather
 * than being one more email.
 *
 * ── WHERE EACH BUTTON LEAVES THE CHILD ──────────────────────────────────────
 *
 *   Send the tour request      GA, FL      tour_invitation_sent    tour_requested
 *   Send the shadow day invite Virtual, HS shadow_days_invited     interest_meeting_held
 *   Not the right school       all         application_not_invited declined
 *   Not yet, I will follow up  all         nothing sent            interest_meeting_held
 *
 * "NOT THE RIGHT SCHOOL" SENDS THE FAMILY THE WARM CLOSE, which is a change
 * from this page's first version and is deliberate: this page is now the 3a
 * gate's second door, and that gate's "no" branch has always posted
 * application_not_invited. Two doors onto one decision must not do two
 * different things. The letter is inquiry_closed_email, live since September
 * and approved.
 *
 * NO `import "server-only"` IN THIS FILE. See application-call.ts: adding it
 * to email/divert.ts on 3 October failed a Vercel build in eight seconds.
 *
 * THE CLIENT IS CAST, narrowly, because src/types/database.ts was generated on
 * 9 July 2026 and knows about neither lead_call_outcomes nor post_call_token.
 * The Mutation/Query split is not stylistic: modelling update().eq() as a
 * plain Query produced TS2339 on the decline path of application-call.ts.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import { campusRunsTours, requireTourLink, tourGateArmed } from "@/lib/admissions/tour";
import { prepareApplicationForInvite } from "@/lib/admissions/application-for-invited-lead";
import { gradeLabel } from "@/lib/constants/grades";
import type { CommunicationTriggerEvent } from "@/lib/admissions/communications/types";

const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

type Row = Record<string, unknown>;
type Answer<T> = PromiseLike<{ data: T; error: { message: string } | null }>;

interface Mutation extends Answer<null> {
  eq: (column: string, value: string) => Mutation;
}

interface Query {
  select: (columns: string) => Query;
  eq: (column: string, value: string) => Query;
  /* Added 11 October for the duplicate-invitation guard, which asks whether a
     letter was sent AFTER the child landed on this step. This interface is
     hand-written and only ever grows a method when something needs one. */
  gte: (column: string, value: string) => Query;
  order: (column: string, options: { ascending: boolean }) => Query;
  limit: (count: number) => Query & Answer<Row[] | null>;
  maybeSingle: () => Answer<Row | null>;
  insert: (row: Row) => Answer<null>;
  update: (row: Row) => Mutation;
}

interface UntypedAdmin {
  from: (table: string) => Query;
}

function admin(): UntypedAdmin {
  return createServiceRoleClient() as unknown as UntypedAdmin;
}

/**
 * Whole years, Eastern, or null.
 *
 * Not "the letter's age field" - that is rendered by merge-fields from the
 * same column. This is the page's own copy of the same question, because the
 * page is not rendered from the letter's merge context.
 */
function ageFromDateOfBirth(dob: string | null): number | null {
  if (!dob) return null;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let years = now.getUTCFullYear() - born.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < born.getUTCMonth() ||
    (now.getUTCMonth() === born.getUTCMonth() && now.getUTCDate() < born.getUTCDate());
  if (beforeBirthday) years -= 1;
  return years >= 0 && years < 130 ? years : null;
}

function text(value: unknown): string | null {
  const out = typeof value === "string" ? value.trim() : "";
  return out ? out : null;
}

/** Which of the two forks this child's campus is on. See tour.ts. */
export type MeetingFork = "tour" | "shadow_day";

/**
 * WHICH APPOINTMENT THIS PAGE IS RECORDING. NOT THE CAMPUS FORK.
 *
 * These two have been confused once already and the names are deliberately
 * unalike. `MeetingFork` is a fact about the CAMPUS - does a tour come after
 * the interest meeting here, or a shadow day. `PostCallOccasion` is a fact
 * about the APPOINTMENT the leader has just walked out of.
 *
 * GA runs tours, so its fork is "tour" at every appointment - including the
 * interest call, where the tour has not happened yet. Reading the fork to
 * decide which letter's words to show would put "Send the application" on the
 * interest-call page at GA and ask a leader to invite a family who has not
 * seen the building.
 *
 * It is derived from the child's stage, because the stage is what the booking
 * scan wrote when it recorded the booking this letter is about. A child at
 * Tour Scheduled got here from the tour's letter; anyone else got here from
 * the interest meeting's.
 */
export type PostCallOccasion = "interest_meeting" | "tour" | "shadow_day";

/**
 * TOUR COMPLETED COUNTS AS THE TOUR, AND THAT IS THE RETRY PATH.
 *
 * Corrected 13 October 2026, the same evening it shipped. The first version
 * read only `tour_scheduled`, with a note arguing that a child already at
 * tour_completed should not be offered the application again.
 *
 * That argument is wrong, and the live test showed how. Pressing Send the
 * application saves the notes, marks the tour held and moves the child to
 * tour_completed BEFORE the letter is attempted - deliberately, so a failed
 * send never loses what a school leader wrote. So when a send is refused -
 * as it was, because the test campus had no school year - the child is
 * already at tour_completed, and on reload she was handed the
 * INTEREST-MEETING page offering "Send the tour request" for a child whose
 * tour she had just given. No way back to the tour page, and no way to try
 * again.
 *
 * Re-offering is safe: alreadySentSinceThisStep refuses a second
 * application_invited once one has actually gone, and after a refusal none
 * has. So the button works exactly once per step whether the first press
 * succeeded or not.
 */
export function occasionForStage(stage: string | null | undefined): PostCallOccasion {
  /*
   * THE SHADOW DAY, ADDED 14 OCTOBER 2026, AND BOTH ITS STAGES FOR THE SAME
   * REASON THE TOUR HAS BOTH.
   *
   * shadow_day_scheduled is where the booking scan leaves a child. Pressing
   * Accept marks the days held and moves the child to shadow_day_completed
   * BEFORE the decision is attempted, so a refused decision - a packet that
   * will not build, a letter that will not go - must still render the shadow
   * day's page on reload rather than the interest meeting's. That exact
   * failure happened to the tour on 13 October and cost an evening.
   */
  if (stage === "shadow_day_scheduled" || stage === "shadow_day_completed") {
    return "shadow_day";
  }
  return stage === "tour_scheduled" || stage === "tour_completed"
    ? "tour"
    : "interest_meeting";
}

export interface PostCallSubject {
  readonly leadId: string;
  readonly studentName: string;
  readonly schoolName: string | null;
  readonly guardianName: string | null;
  readonly guardianPhone: string | null;
  readonly guardianEmail: string | null;
  readonly inquiryNotes: string | null;
  readonly fork: MeetingFork;
  /** Which appointment this is. See PostCallOccasion - not the fork. */
  readonly occasion: PostCallOccasion;
  /**
   * The three facts the approved letter stacks under the child's name,
   * in its order: grade, age, phone. The page carries the letter's words,
   * so it carries the letter's facts in the letter's order.
   */
  /** The child's first name alone. The approved page says "Send Konnor's
   *  family...", which is the CHILD, not the guardian. */
  readonly studentFirstName: string;
  readonly studentGrade: string | null;
  readonly studentAge: number | null;
  /**
   * Whether the tour request can actually be sent right now - the campus runs
   * tours AND has a link set. Only meaningful on the tour fork.
   *
   * THE PAGE READS THIS AND HIDES THE BUTTON rather than offering it and
   * failing after she has typed her notes. The same check runs again inside
   * the action, because a page that renders at nine and is submitted at noon
   * is two different moments and only the second one matters.
   */
  readonly canRequestTour: boolean;
  /** Why not, in words for a school leader. Null when she can. */
  readonly tourBlockedReason: string | null;
  /** Decisions and calls already recorded for this family, newest first. */
  readonly previousCalls: readonly {
    readonly calledAt: string;
    readonly outcome: string;
    readonly notes: string | null;
  }[];
}

export async function leadForPostCallToken(
  token: string
): Promise<PostCallSubject | null> {
  if (!TOKEN_PATTERN.test(token)) return null;

  const db = admin();

  const { data, error } = await db
    .from("admissions_leads")
    .select(
      "id, first_name, last_name, preferred_name, guardian_first_name, " +
        "guardian_last_name, guardian_email, guardian_phone, notes, " +
        "lead_stage, applying_for_grade, current_grade, date_of_birth, " +
        "schools(name, tour_booking_url)"
    )
    .eq("post_call_token", token)
    .maybeSingle();

  if (error) {
    console.error("[post-call] token lookup failed:", error.message);
    return null;
  }
  if (!data) return null;

  const lead = data as Row;
  const leadId = String(lead.id ?? "");
  if (!leadId) return null;

  /* PostgREST returns an embedded row as an object or a one-element array. */
  const embedded = lead.schools as Row | Row[] | null;
  const school = (Array.isArray(embedded) ? embedded[0] : embedded) ?? null;
  const schoolName = text(school?.name);
  /*
   * THE GATE IS READ HERE, AND UNTIL 5 OCTOBER IT WAS NOT.
   *
   * ADMISSIONS_TOUR_GATE was checked in exactly one place - the gate
   * suppression in gates/definitions.ts - and nowhere near the button a human
   * presses. So the tour fork was live at GA and FL the moment the RECORD
   * your notes letter went on, while T1 was still switched off.
   *
   * What that would have done, the first time Nina or Danni pressed it: notes
   * recorded, stage moved to tour_requested, tour_invitation_sent fired at a
   * template that is off, and THE FAMILY SENT NOTHING. The booking scan then
   * waits for a tour booking from a family who never got a link, and the
   * child sits at tour_requested with no action left on the page to move
   * them - the shadow day button is the other fork and is not offered here.
   *
   * A child stopping dead with nothing on screen to explain it is the exact
   * thing the gate exists to prevent, so the gate is now read where the fork
   * is chosen. Off means GA and FL behave as they did before the tour step
   * was built: the shadow day fork, which is already approved and working.
   */
  const fork: MeetingFork =
    tourGateArmed() && campusRunsTours(schoolName) ? "tour" : "shadow_day";

  const tour =
    fork === "tour"
      ? requireTourLink({ schoolName, tourUrl: text(school?.tour_booking_url) })
      : null;

  const { data: calls } = await db
    .from("lead_call_outcomes")
    .select("called_at, outcome, notes")
    .eq("lead_id", leadId)
    .order("called_at", { ascending: false })
    .limit(10);

  const studentName =
    text(lead.preferred_name) ||
    `${text(lead.first_name) ?? ""} ${text(lead.last_name) ?? ""}`.trim() ||
    "This student";

  const guardianName =
    `${text(lead.guardian_first_name) ?? ""} ${text(lead.guardian_last_name) ?? ""}`.trim() ||
    null;

  return {
    leadId,
    studentName,
    schoolName,
    guardianName,
    guardianPhone: text(lead.guardian_phone),
    guardianEmail: text(lead.guardian_email),
    inquiryNotes: text(lead.notes),
    fork,
    occasion: occasionForStage(text(lead.lead_stage)),
    studentFirstName:
      text(lead.preferred_name) || text(lead.first_name) || studentName,
    /*
     * gradeLabel, NOT the raw column. On the first live tour test the page
     * showed a school leader "5th_grade". The same mistake is noted in
     * PendingDecisionsPanel, where it once rendered "11th_grade".
     */
    studentGrade: gradeLabel(
      text(lead.applying_for_grade) || text(lead.current_grade)
    ) || null,
    studentAge: ageFromDateOfBirth(text(lead.date_of_birth)),
    canRequestTour: tour?.ok ?? false,
    tourBlockedReason: tour && !tour.ok ? tour.error : null,
    previousCalls: ((calls ?? []) as Row[]).map((call) => ({
      calledAt: String(call.called_at ?? ""),
      outcome: String(call.outcome ?? ""),
      notes: text(call.notes),
    })),
  };
}

/**
 * The buttons, and what each one actually does.
 *
 * The consequence line under each is not decoration. Three of these four
 * send a family an email and move a child. A leader pressing one on her phone
 * as she walks out of a meeting is entitled to know which, before she presses
 * it.
 */
export const POST_CALL_ACTIONS = [
  {
    /*
     * THE TOUR'S BUTTON. His words, 13 October, from the approved page: the
     * letter's third paragraph promises "Saving your notes will ask you
     * whether to send {{student_first_name}}'s family the Application for
     * Admissions", and this is that question answered yes.
     *
     * The value is the trigger event it fires, which is the same event the
     * invite_to_apply gate's yes branch fires. One letter, one wording, two
     * doors into it - the gate on the decisions board, and this button.
     */
    value: "application_invited",
    label: "Send the application",
    fork: null,
    occasion: "tour" as PostCallOccasion,
    consequence:
      "The family is emailed the Application for Admissions. The tour is " +
      "marked held and the child moves to Tour Completed.",
  },
  {
    /*
     * THE SHADOW DAY'S TWO ANSWERS. Jimmy, 14 October 2026, answering the
     * mockup's question about whether these should be single words or
     * sentences: "let's make the buttons this - accept-send email, deny-send
     * email". His words, used literally - the hyphen included.
     *
     * Both run the SAME decision the accept_or_deny gate runs, through
     * applyAdmissionsDecision. Two doors onto one decision must not do two
     * different things.
     */
    value: "shadow_day_accepted",
    label: "Accept - send email",
    fork: null,
    occasion: "shadow_day" as PostCallOccasion,
    consequence:
      "The family is emailed the acceptance and the enrollment packet is " +
      "built. The shadow day is marked held and the child moves to Accepted.",
  },
  {
    value: "shadow_day_denied",
    label: "Deny - send email",
    fork: null,
    occasion: "shadow_day" as PostCallOccasion,
    /*
     * IT SENDS, AS OF 14 OCTOBER 2026 - AND FOR HALF A DAY IT DID NOT.
     *
     * This line read "Nothing is emailed to the family yet - the decline letter
     * after a shadow day is not written", which was true and said so rather
     * than promising a letter that did not exist. Jimmy then gave the words,
     * and migration 554 is the letter: three paragraphs of his own approved
     * application_declined_email verbatim, with only the opening changed
     * because "thank you for submitting the application" is the wrong thing to
     * say to a family who just spent two days in the building.
     *
     * "read naturally" - his answer on the day count - so it is five campus
     * rows: GA, FL and the test campus read "the last two days", HS and Virtual
     * read "the day".
     *
     * This sentence changed in the same commit as the letter, because a
     * consequence line that lags the behaviour by one deploy is the same fault
     * as the acceptance screen promising an enrollment packet nobody built.
     */
    consequence:
      "The family is emailed the decision - the letter that says the " +
      "limitation is ours and not their child's. The shadow day is marked " +
      "held and the child moves to Declined.",
  },
  {
    value: "tour_requested",
    label: "Send the tour request",
    fork: "tour" as MeetingFork,
    occasion: "interest_meeting" as PostCallOccasion,
    consequence:
      "The family is emailed the campus tour calendar and asked to book. " +
      "The child moves to Tour Requested.",
  },
  {
    value: "shadow_days_invited",
    label: "Send the shadow day invite",
    fork: "shadow_day" as MeetingFork,
    occasion: "interest_meeting" as PostCallOccasion,
    consequence:
      "The family is emailed the shadow-days booking link. The child is " +
      "marked Interest Meeting Held.",
  },
  {
    value: "post_call_not_the_right_school",
    label: "Not the right school, close them out",
    fork: null,
    occasion: null,
    consequence:
      "The family gets the short thank-you and best wishes. The lead is " +
      "marked declined.",
    /* HIS WORDS ON THE TOUR PAGE ARE SHORTER. The approved page reads "Not
       the right school", and the page carries the letter's words. */
    tour: {
      label: "Not the right school",
      consequence:
        "The family gets the short thank-you and best wishes. The tour is " +
        "marked held and the lead is marked declined.",
    },
  },
  {
    value: "post_call_follow_up",
    label: "Not yet, I will follow up",
    fork: null,
    occasion: null,
    consequence:
      "Your notes are saved and the child is marked Interest Meeting Held. " +
      "Nothing is sent to the family.",
    tour: {
      label: "Not yet, I will follow up",
      consequence:
        "Your notes are saved, the tour is marked held and the child moves " +
        "to Tour Completed. Nothing is sent to the family.",
    },
  },
] as const;

export type PostCallAction = (typeof POST_CALL_ACTIONS)[number]["value"];

export function isPostCallAction(value: unknown): value is PostCallAction {
  return POST_CALL_ACTIONS.some((option) => option.value === value);
}

/**
 * The buttons for THIS appointment at THIS campus, with the wording resolved.
 *
 * Two filters, and they are not the same question. The occasion decides which
 * decision is being made - invite them to tour, or invite them to apply. The
 * fork decides which of the two interest-meeting buttons this campus offers.
 * A tour page is the same at GA as at FL, so the tour's button carries no
 * fork at all.
 *
 * Replaces actionsForFork, which read only the campus and would therefore have
 * offered "Send the tour request" to a leader walking out of a tour.
 */
export function actionsForPage(
  fork: MeetingFork,
  occasion: PostCallOccasion
): readonly { value: PostCallAction; label: string; consequence: string }[] {
  return POST_CALL_ACTIONS.filter((a) =>
    /*
     * THE SHADOW DAY TAKES ONLY ITS OWN TWO BUTTONS, and the two shared ones
     * are deliberately excluded rather than rewritten.
     *
     * Jimmy gave two: "accept-send email, deny-send email". "Not the right
     * school" is the same answer as Deny by another name, and "Not yet, I will
     * follow up" would move a child to interest_meeting_held - backwards past
     * an application and a shadow day. Both read occasion === null, meaning
     * every occasion, which was true while there were only two.
     */
    occasion === "shadow_day"
      ? a.occasion === "shadow_day"
      : (a.occasion === null || a.occasion === occasion) &&
        (a.fork === null || a.fork === fork)
  )
    .map((a) => {
      const override = occasion === "tour" && "tour" in a ? a.tour : null;
      return {
        value: a.value,
        label: override?.label ?? a.label,
        consequence: override?.consequence ?? a.consequence,
      };
    })
    .sort((a, b) => orderFor(occasion, a.value) - orderFor(occasion, b.value));
}

/*
 * THE ORDER ON THE TOUR PAGE IS HIS, AND IT IS NOT THE LIST'S ORDER.
 *
 * The approved page reads: Send the application, then "Not yet, I will follow
 * up", then "Not the right school". POST_CALL_ACTIONS has declined above
 * follow-up because that is the order the interest-meeting page has used since
 * 5 October, and that page is approved and in use - reordering the list would
 * silently change a screen nobody asked me to change.
 *
 * So the tour page gets its own order here and the interest page keeps the
 * list's.
 */
const TOUR_BUTTON_ORDER: readonly PostCallAction[] = [
  "application_invited",
  "post_call_follow_up",
  "post_call_not_the_right_school",
];

/* Accept above Deny, the order the approved mockup reads top to bottom. */
const SHADOW_DAY_BUTTON_ORDER: readonly PostCallAction[] = [
  "shadow_day_accepted",
  "shadow_day_denied",
];

function orderFor(occasion: PostCallOccasion, value: PostCallAction): number {
  const order =
    occasion === "tour"
      ? TOUR_BUTTON_ORDER
      : occasion === "shadow_day"
        ? SHADOW_DAY_BUTTON_ORDER
        : null;
  if (!order) return 0;
  const at = order.indexOf(value);
  return at === -1 ? order.length : at;
}

export async function recordPostCallDecision(params: {
  token: string;
  action: PostCallAction;
  notes: string | null;
}): Promise<
  | {
      ok: true;
      action: PostCallAction;
      /**
       * SOMETHING WORKED, AND SOMETHING DID NOT - IN THE LEADER'S WORDS.
       *
       * Added 14 October 2026. An acceptance that resolved no application, or
       * one whose enrollment packet failed to generate, is still an acceptance:
       * the decision is recorded, the stage moves, the family is emailed. But
       * there is no packet, and until now the page said "the enrollment packet
       * has been built" anyway, because this function returned nothing but ok.
       *
       * applyAdmissionsDecision has always returned that warning. Nothing
       * carried it to the one person who could act on it.
       */
      warning?: string;
    }
  | { error: string }
> {
  if (!TOKEN_PATTERN.test(params.token)) {
    return { error: "That link is not valid." };
  }
  if (!isPostCallAction(params.action)) {
    return { error: "Choose what should happen next." };
  }

  const db = admin();

  const { data: lead } = await db
    .from("admissions_leads")
    .select("id, lead_stage, stage_entered_at, schools(name, tour_booking_url)")
    .eq("post_call_token", params.token)
    .maybeSingle();

  const leadRow = lead as Row | null;
  const leadId = leadRow ? String(leadRow.id ?? "") : "";
  if (!leadId) return { error: "That link is not valid." };

  /* Where the child stood BEFORE this submission moved anything. Read here
     because the guard below has to compare against it after the move. */
  const stageBefore = text(leadRow?.lead_stage) ?? "";
  const stageEnteredBefore = text(leadRow?.stage_entered_at) ?? null;

  const embedded = leadRow?.schools as Row | Row[] | null;
  const school = (Array.isArray(embedded) ? embedded[0] : embedded) ?? null;
  const schoolName = text(school?.name);
  /* The gate again - see the note at the first fork. Both sides must agree,
   * or a button rendered by one is refused by the other. */
  const fork: MeetingFork =
    tourGateArmed() && campusRunsTours(schoolName) ? "tour" : "shadow_day";

  /*
   * WHICH APPOINTMENT THIS IS, read from where the child stood BEFORE the
   * submission - the same reason stageBefore exists for the duplicate guard.
   * After a move the stage is the answer rather than the question.
   */
  const occasion = occasionForStage(stageBefore);

  /* A button from the other campus's fork is not a valid answer here. */
  const chosen = POST_CALL_ACTIONS.find((a) => a.value === params.action);
  if (chosen?.fork && chosen.fork !== fork) {
    return {
      error:
        `That is not an option at ${schoolName ?? "this campus"}. ` +
        `Reload this page and choose again.`,
    };
  }

  /*
   * NOR A BUTTON FROM THE OTHER OCCASION.
   *
   * A page rendered after the tour and submitted after the child has been
   * moved by hand is two different moments, and only the second one counts -
   * the same reason the tour-link check runs twice. Without this, "Send the
   * application" posted from a stale tour page could fire the application
   * invitation at a child who is back at Interest Meeting Scheduled.
   */
  if (chosen?.occasion && chosen.occasion !== occasion) {
    return {
      error:
        occasion === "shadow_day"
          ? "That page is out of date - this child is at the shadow day step now. Reload and choose again."
          : occasion === "tour"
            ? "That page is out of date - this child is at the tour step now. Reload and choose again."
            : "That page is out of date - this child is not at the tour step. Reload and choose again.",
    };
  }

  /*
   * THE TOUR GUARD RUNS AGAIN HERE, not only when the page rendered. If the
   * link was cleared in between, the letter would reach the family with
   * nothing to click - the exact failure inquiry_thank_you_email_no_link
   * exists to avoid. Checked before the row is written, because a recorded
   * decision that could not be carried out is a worse record than none.
   */
  if (params.action === "tour_requested") {
    const tour = requireTourLink({
      schoolName,
      tourUrl: text(school?.tour_booking_url),
    });
    if (!tour.ok) return { error: tour.error };
  }

  /*
   * THE NOTES GO IN FIRST, BEFORE ANYTHING IS SENT OR MOVED. They are the
   * point of the letter. If the send fails afterwards, what a school leader
   * wrote about a child is still on the record - which is the opposite of
   * what happens if the order is reversed.
   */
  const { error: recordError } = await db.from("lead_call_outcomes").insert({
    lead_id: leadId,
    outcome: params.action,
    notes: params.notes?.trim() || null,
    recorded_by: null,
  });

  if (recordError) {
    console.error("[post-call] could not record:", recordError.message);
    return {
      error: "That did not save. Tell Jimmy before you forget what you decided.",
    };
  }

  async function moveTo(stage: string): Promise<string | null> {
    const { error } = await db
      .from("admissions_leads")
      .update({ lead_stage: stage, updated_at: new Date().toISOString() })
      .eq("id", leadId);
    return error ? error.message : null;
  }

  /**
   * THE TOUR ITSELF IS MARKED HELD, SEPARATELY FROM THE CHILD'S STAGE.
   *
   * A lead has one stage, so "Not the right school" has to write `declined`
   * and cannot also write `tour_completed`. But the tour still happened, and
   * losing that fact is how twenty-eight families came to sit in Tour
   * Scheduled with no tour behind them.
   *
   * So the row in admissions_tours carries the fact and the lead stage
   * carries the judgement. All three tour buttons mark the row held; only two
   * of them move the child to Tour Completed.
   *
   * The newest scheduled tour, not all of them - a family who rebooked has
   * two rows and only one of them is the tour she just walked out of. Read
   * then written, because PostgREST cannot order an update.
   *
   * IT FAILS SOFT. If this does not land, the notes are still saved, the
   * stage still moves and the letter still goes. A tour row that still says
   * scheduled is a reporting problem; a decision that did not happen because
   * of one is a family left waiting.
   */
  async function markTourHeld(): Promise<void> {
    const { data, error } = await db
      .from("admissions_tours")
      .select("id")
      .eq("lead_id", leadId)
      .eq("tour_status", "scheduled")
      .order("scheduled_at", { ascending: false })
      .limit(1);
    if (error || !(data ?? []).length) {
      if (error) console.error("[post-call] could not read the tour row:", error.message);
      return;
    }
    const tourId = String(((data ?? [])[0] as Row).id ?? "");
    if (!tourId) return;
    const { error: updateError } = await db
      .from("admissions_tours")
      .update({ tour_status: "completed", updated_at: new Date().toISOString() })
      .eq("id", tourId);
    if (updateError) {
      console.error("[post-call] could not mark the tour held:", updateError.message);
    }
  }

  /**
   * THE SHADOW DAYS ARE MARKED HELD, SEPARATELY FROM THE CHILD'S STAGE.
   *
   * markTourHeld's twin, for markTourHeld's reason: a lead has ONE stage, so a
   * denial writes `declined` and cannot also write `shadow_day_completed`. The
   * days still happened. Losing that is how twenty-eight families came to sit
   * in Tour Scheduled with no tour behind them, and the eight children at
   * Shadow Day Scheduled this morning have nothing behind them either.
   *
   * The row in admissions_shadow_days carries the fact; the lead stage carries
   * the judgement. Both buttons mark the row held.
   *
   * The NEWEST scheduled row, not all of them - a family who rebooked has two
   * and only one is the appointment she has just walked out of. Read then
   * written, because PostgREST cannot order an update.
   *
   * IT FAILS SOFT, like its twin. A row still reading scheduled is a reporting
   * problem; a decision that did not happen because of one is a family waiting.
   */
  async function markShadowDayHeld(): Promise<void> {
    const { data, error } = await db
      .from("admissions_shadow_days")
      .select("id")
      .eq("lead_id", leadId)
      .eq("shadow_day_status", "scheduled")
      .order("scheduled_at", { ascending: false })
      .limit(1);
    if (error || !(data ?? []).length) {
      if (error) {
        console.error("[post-call] could not read the shadow day row:", error.message);
      }
      return;
    }
    const shadowDayId = String(((data ?? [])[0] as Row).id ?? "");
    if (!shadowDayId) return;
    const { error: updateError } = await db
      .from("admissions_shadow_days")
      .update({
        shadow_day_status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", shadowDayId);
    if (updateError) {
      console.error("[post-call] could not mark the shadow day held:", updateError.message);
    }
  }

  /*
   * TYPED, NOT `string`. notifyAdmissionsEvent takes the closed union, and a
   * plain string gave TS2322 on the ship of 5 October. The union is the point:
   * an event name with a typo would otherwise compile and fire nothing.
   */
  async function tell(event: CommunicationTriggerEvent): Promise<string | null> {
    try {
      const { notifyAdmissionsEvent } = await import(
        "@/lib/admissions/communications/triggers"
      );
      await notifyAdmissionsEvent(createServiceRoleClient() as never, {
        leadId,
        events: [event],
        sentBy: null,
      });
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  }

  /**
   * HAS THIS FAMILY ALREADY BEEN SENT THIS INVITATION, SINCE THEY LANDED ON
   * THIS STEP?
   *
   * ── WHAT HAPPENED ON 11 OCTOBER ─────────────────────────────────────────
   *
   * Six note submissions against one family, five of them between 14:10:54
   * and 14:10:59 UTC - one second apart, a double-click or an impatient
   * retry - and every one of them mailed the parent another tour invitation.
   * Five identical "come and tour our school" letters in five seconds, and a
   * sixth twenty-four minutes later.
   *
   * Nothing checked. The letter fired on every submission because the only
   * thing between a click and a family's inbox was the click.
   *
   * ── THE RULE: ONE PER STAGE ENTRY ───────────────────────────────────────
   *
   * Not "one ever". A child who goes back to an earlier step and returns to
   * Tour Requested is a family who needs the link again, and stage_entered_at
   * moves when they do, so a genuine second invitation still goes.
   *
   * The comparison is against the stage as it stood BEFORE this submission.
   * After the move, stage_entered_at is a second old and every send looks
   * recent - which would guard nothing on the first press and everything on
   * the second.
   *
   * ── IT GUARDS THE LETTER, NOT THE NOTES ─────────────────────────────────
   *
   * The notes are already written by the time this runs, deliberately: a
   * school leader pressing twice has two things to say and both are worth
   * keeping. It is only the email that must not repeat, because an email
   * cannot be un-sent.
   *
   * ── AND IT FAILS OPEN ───────────────────────────────────────────────────
   *
   * If the lookup errors, the letter goes. A family who gets two invitations
   * has been annoyed; a family who gets none is waiting for a link that is
   * never coming, with nothing on the board to say so. Of the two, the
   * duplicate is the one you can apologise for.
   */
  async function alreadySentSinceThisStep(
    event: CommunicationTriggerEvent,
    targetStage: string
  ): Promise<boolean> {
    if (stageBefore !== targetStage || !stageEnteredBefore) return false;
    const { data, error } = await db
      .from("admissions_communications")
      .select("id")
      .eq("lead_id", leadId)
      .eq("trigger_event", event)
      .eq("delivery_status", "sent")
      .gte("sent_at", stageEnteredBefore)
      .limit(1);
    if (error) {
      console.error("[post-call] duplicate check failed, sending anyway:", error.message);
      return false;
    }
    return (data ?? []).length > 0;
  }

  /* ---- Not yet. The notes are the point; the child is marked held. -------
   *
   * WHICH held depends on which appointment. After the interest meeting this
   * writes interest_meeting_held, as it always has. After a tour it writes
   * tour_completed - the stage twelve places in this codebase READ and, until
   * 13 October, nothing ever WROTE.
   */
  if (params.action === "post_call_follow_up") {
    if (occasion === "tour") await markTourHeld();
    const problem = await moveTo(
      occasion === "tour" ? "tour_completed" : "interest_meeting_held"
    );
    if (problem) {
      console.error("[post-call] could not mark held:", problem);
      return {
        error:
          "Your notes were saved, but the child did not move. Mark the meeting held in JAG so the decision opens.",
      };
    }
    return { ok: true, action: params.action };
  }

  /* ---- Not the right school. Warm close, same as the gate's no branch. --- */
  if (params.action === "post_call_not_the_right_school") {
    /* The tour happened even though the answer is no. See markTourHeld. */
    if (occasion === "tour") await markTourHeld();
    const problem = await moveTo("declined");
    if (problem) {
      console.error("[post-call] could not decline:", problem);
      return {
        error:
          "Your notes were saved, but the lead did not move. Close it in JAG so the next person is not confused.",
      };
    }
    const mail = await tell("application_not_invited");
    if (mail) {
      console.error("[post-call] warm close failed:", mail);
      return {
        error:
          "The lead is closed and your notes are saved, but the thank-you did not go out. Send it from the case page in JAG.",
      };
    }
    return { ok: true, action: params.action };
  }

  /*
   * ---- The tour's answer: send the family the application. ---------------
   *
   * THE ORDER IS THE SAME AS THE FORKS BELOW and for the same reason: the
   * tour is marked held, then the stage moves, then the letter goes. A letter
   * that went out while the board still showed the child waiting cannot be
   * un-sent; a stage that moved with no letter behind it is recoverable,
   * because she presses the button again.
   *
   * THE DUPLICATE GUARD IS THE SAME ONE, against the same table, for the same
   * reason it was written on 11 October: six note submissions against one
   * family sent one parent five identical tour invitations in five seconds.
   * The application invitation is the same letter down the next step of the
   * same button and would do the same thing unguarded.
   *
   * NO GATE IS OPENED HERE. moveTo writes lead_stage directly rather than
   * going through transitionCaseStage, so invite_to_apply does not open and
   * decision_gate_staff_email does not chase her for a decision she has just
   * made on this page. That is exactly how the interest meeting's forks
   * already behave.
   */
  if (params.action === "application_invited") {
    await markTourHeld();

    const tourStageProblem = await moveTo("tour_completed");
    if (tourStageProblem) {
      console.error("[post-call] could not complete the tour:", tourStageProblem);
      return {
        error:
          "Your notes were saved, but the child did not move and nothing was " +
          "sent. Try again, or send the application from the case page in JAG.",
      };
    }

    if (await alreadySentSinceThisStep("application_invited", "tour_completed")) {
      console.log("[post-call] application already sent this step, not repeating:", leadId);
      return { ok: true, action: params.action };
    }

    /*
     * THE TOKEN AND THE APPLICATION, BEFORE THE FAMILY IS TOLD ABOUT THEM.
     *
     * Missing on 13 October: the first real tour test emailed a family an
     * invitation whose link read /apply/portal, a sign-in box with no
     * application behind it. The gate had always done this; this door did not,
     * because it was wired to the event and the preparation lived in the
     * gate's file. It is one shared function now.
     *
     * The notes are saved and the tour is marked held by this point, both on
     * purpose. Only the letter stops here.
     */
    const prepared = await prepareApplicationForInvite(
      createServiceRoleClient() as never,
      { leadId }
    );
    if (!prepared.ok) {
      console.error("[post-call] could not prepare the application:", prepared.reason);
      return {
        error:
          `Your notes were saved and the tour is marked held, but the family was ` +
          `not emailed: ${prepared.reason} Nothing was sent, so nobody has a broken link.`,
      };
    }

    const applicationMail = await tell("application_invited");
    if (applicationMail) {
      console.error("[post-call] application invitation failed:", applicationMail);
      return {
        error:
          "Your notes were saved and the tour is marked held, but the " +
          "application did not go out. Send it from the family's case page in JAG.",
      };
    }

    return { ok: true, action: params.action };
  }

  /*
   * ---- The shadow day's answer: accept, or deny. --------------------------
   *
   * THE LAST GATE, ANSWERED FROM A LETTER.
   *
   * Jimmy, the night of 13 October, having booked shadow days for 1:30am:
   * "i didn't receive any followup email with decision to accept or send
   * denial letter." Nothing recorded the booking, so nothing wrote
   * shadow_day_completed, so accept_or_deny - which opens behind that stage -
   * had never opened once in the life of this platform.
   *
   * Migration 550 gave the booking a home, 552 gave the appointment a letter,
   * and this is the button in it.
   *
   * ── THE ORDER, AND WHY IT IS THIS ORDER ─────────────────────────────────
   *
   * Notes (already written, above) -> the days marked held -> the stage ->
   * the decision. The same order the tour uses, for the same reason: an email
   * cannot be un-sent, and everything before the decision is recoverable by
   * pressing the button again. applyAdmissionsDecision is what the gate's own
   * branches run, so an acceptance from this letter and an acceptance from the
   * decisions board are the same event - same decision row, same acceptance
   * letter, same enrollment packet, same audit.
   *
   * ── WHY THE STAGE MOVES TO shadow_day_completed FIRST ────────────────────
   *
   * applyAdmissionsDecision moves it again, to accepted or declined, through
   * transitionCaseStage. Writing shadow_day_completed first is not redundant:
   * it is the fact the gate's question is built on, it is what twelve readers
   * in this codebase look for, and if the decision then fails it is what makes
   * this page render the shadow day again on reload instead of the interest
   * meeting - the exact failure the tour hit on 13 October.
   *
   * ── IT DOES NOT OPEN THE GATE ───────────────────────────────────────────
   *
   * moveTo writes lead_stage directly rather than through transitionCaseStage,
   * so accept_or_deny does not open and decision_gate_staff_email does not
   * chase her for a decision she has just made here. Exactly as the tour's
   * button and both interest-meeting forks already behave.
   */
  if (
    params.action === "shadow_day_accepted" ||
    params.action === "shadow_day_denied"
  ) {
    const accepting = params.action === "shadow_day_accepted";

    await markShadowDayHeld();

    const shadowStageProblem = await moveTo("shadow_day_completed");
    if (shadowStageProblem) {
      console.error("[post-call] could not complete the shadow day:", shadowStageProblem);
      return {
        error:
          "Your notes were saved, but the child did not move and no decision " +
          "was recorded. Try again, or record the decision in JAG.",
      };
    }

    /*
     * THE SAME GUARD AS THE OTHER BUTTONS, against the same table. An
     * acceptance sent twice is a second welcome letter and a second enrollment
     * packet, which is worse than a second tour invitation - and six
     * submissions against one family in five seconds is a thing that has
     * already happened here once.
     *
     * Only the acceptance is guarded, because only the acceptance sends. The
     * denial's duplicate protection is the stage check: a child already
     * declined is no longer at shadow_day_completed, so the page will not
     * offer this button again.
     */
    if (
      accepting &&
      (await alreadySentSinceThisStep("student_accepted", "shadow_day_completed"))
    ) {
      console.log("[post-call] acceptance already sent this step, not repeating:", leadId);
      return { ok: true, action: params.action };
    }

    /*
     * THE APPLICATION COMES WITH THE ANSWER - the same read the gate makes,
     * and for the reason written there: submitAdmissionsDecision only builds
     * the enrollment packet when it is handed an application id, and a path
     * that never passed one accepted students while telling them to go and
     * complete a packet that did not exist. Newest first; a family who started
     * twice means the later attempt.
     */
    const { data: applicationRow } = await db
      .from("admissions_applications")
      .select("id")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1);
    const applicationId =
      String(((applicationRow ?? [])[0] as Row | undefined)?.id ?? "") || null;

    const { applyAdmissionsDecision } = await import(
      "@/lib/admissions/decisions-core"
    );

    const outcome = await applyAdmissionsDecision(
      createServiceRoleClient() as never,
      {
        leadId,
        applicationId,
        decisionType: accepting ? "accept" : "deny",
        customNotes: params.notes?.trim() || "",
        sendEmail: true,
        /* Nobody is signed in. A letter is not a session. */
        actorUserId: null,
      }
    );

    if (outcome && "error" in outcome && outcome.error) {
      console.error("[post-call] the decision failed:", outcome.error);
      return {
        error:
          `Your notes were saved and the shadow day is marked held, but the ` +
          `decision did not complete: ${outcome.error} Record it in JAG.`,
      };
    }

    /*
     * THE PACKET IS NOT GUARANTEED, SO THE PAGE MUST NOT GUARANTEE IT.
     *
     * applyAdmissionsDecision sets `warning` when an acceptance resolved no
     * application row, or when generateEnrollmentPacket itself failed. Both
     * leave a child accepted and emailed with nothing to sign. It is carried
     * here so the done screen can say so instead of printing a sentence that
     * happens to be false.
     */
    const warning =
      outcome && "warning" in outcome && typeof outcome.warning === "string"
        ? outcome.warning
        : null;

    return warning
      ? { ok: true, action: params.action, warning }
      : { ok: true, action: params.action };
  }

  /*
   * ---- The two forks. ----------------------------------------------------
   *
   * THE STAGE MOVES FIRST, THEN THE LETTER, on both. The other order emails a
   * family while the board still shows them waiting, and an email cannot be
   * un-sent. A stage that moved with no letter behind it is recoverable: she
   * presses the button again.
   */
  const stage =
    params.action === "tour_requested" ? "tour_requested" : "interest_meeting_held";

  const stageProblem = await moveTo(stage);
  if (stageProblem) {
    console.error("[post-call] could not move to", stage, stageProblem);
    return {
      error:
        "Your notes were saved, but the child did not move and nothing was " +
        "sent. Try again, or do it from the case page in JAG.",
    };
  }

  const event: CommunicationTriggerEvent =
    params.action === "tour_requested" ? "tour_invitation_sent" : "shadow_days_invited";

  /*
   * BOTH FORKS, not only the tour. Jimmy asked about the tour invitation
   * because that is the one that reached a family six times, but the shadow
   * day invitation is the same letter to the same parent down the other
   * branch of the same button, and leaving it unguarded would be waiting for
   * it to happen again at HS and Virtual.
   */
  if (await alreadySentSinceThisStep(event, stage)) {
    console.log("[post-call] invitation already sent this step, not repeating:", leadId);
    return { ok: true, action: params.action };
  }

  const mail = await tell(event);
  if (mail) {
    console.error("[post-call] invitation failed:", mail);
    return {
      error:
        "Your notes were saved and the child moved, but the invitation did " +
        "not go out. Send it from the family's case page in JAG.",
    };
  }

  return { ok: true, action: params.action };
}
