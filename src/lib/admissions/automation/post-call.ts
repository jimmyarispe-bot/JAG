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

function text(value: unknown): string | null {
  const out = typeof value === "string" ? value.trim() : "";
  return out ? out : null;
}

/** Which of the two forks this child's campus is on. See tour.ts. */
export type MeetingFork = "tour" | "shadow_day";

export interface PostCallSubject {
  readonly leadId: string;
  readonly studentName: string;
  readonly schoolName: string | null;
  readonly guardianName: string | null;
  readonly guardianPhone: string | null;
  readonly guardianEmail: string | null;
  readonly inquiryNotes: string | null;
  readonly fork: MeetingFork;
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
    value: "tour_requested",
    label: "Send the tour request",
    fork: "tour" as MeetingFork,
    consequence:
      "The family is emailed the campus tour calendar and asked to book. " +
      "The child moves to Tour Requested.",
  },
  {
    value: "shadow_days_invited",
    label: "Send the shadow day invite",
    fork: "shadow_day" as MeetingFork,
    consequence:
      "The family is emailed the shadow-days booking link. The child is " +
      "marked Interest Meeting Held.",
  },
  {
    value: "post_call_not_the_right_school",
    label: "Not the right school, close them out",
    fork: null,
    consequence:
      "The family gets the short thank-you and best wishes. The lead is " +
      "marked declined.",
  },
  {
    value: "post_call_follow_up",
    label: "Not yet, I will follow up",
    fork: null,
    consequence:
      "Your notes are saved and the child is marked Interest Meeting Held. " +
      "Nothing is sent to the family.",
  },
] as const;

export type PostCallAction = (typeof POST_CALL_ACTIONS)[number]["value"];

export function isPostCallAction(value: unknown): value is PostCallAction {
  return POST_CALL_ACTIONS.some((option) => option.value === value);
}

/** The buttons this campus should see: its own fork's, plus the two shared. */
export function actionsForFork(fork: MeetingFork) {
  return POST_CALL_ACTIONS.filter((a) => a.fork === null || a.fork === fork);
}

export async function recordPostCallDecision(params: {
  token: string;
  action: PostCallAction;
  notes: string | null;
}): Promise<{ ok: true; action: PostCallAction } | { error: string }> {
  if (!TOKEN_PATTERN.test(params.token)) {
    return { error: "That link is not valid." };
  }
  if (!isPostCallAction(params.action)) {
    return { error: "Choose what should happen next." };
  }

  const db = admin();

  const { data: lead } = await db
    .from("admissions_leads")
    .select("id, schools(name, tour_booking_url)")
    .eq("post_call_token", params.token)
    .maybeSingle();

  const leadRow = lead as Row | null;
  const leadId = leadRow ? String(leadRow.id ?? "") : "";
  if (!leadId) return { error: "That link is not valid." };

  const embedded = leadRow?.schools as Row | Row[] | null;
  const school = (Array.isArray(embedded) ? embedded[0] : embedded) ?? null;
  const schoolName = text(school?.name);
  /* The gate again - see the note at the first fork. Both sides must agree,
   * or a button rendered by one is refused by the other. */
  const fork: MeetingFork =
    tourGateArmed() && campusRunsTours(schoolName) ? "tour" : "shadow_day";

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

  /* ---- Not yet. The notes are the point; the child is marked held. ------- */
  if (params.action === "post_call_follow_up") {
    const problem = await moveTo("interest_meeting_held");
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
