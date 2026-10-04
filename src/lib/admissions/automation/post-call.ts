/**
 * The school leader's page ten minutes after the inquiry call.
 *
 * Jimmy, 4 October: "fl n ga only - 10 minutes after this scheduled phone
 * conversation day/time the school leader should be sent an email with a
 * notes box to add in summary of the phone conversation and a decision button
 * to send the parent a request to schedule a tour or not".
 *
 * And, settling what "or not" meant, three buttons rather than two: send the
 * tour request, close them out, or not yet - she will follow up herself.
 *
 * GA AND FL ONLY. Virtual and HS do not have this step and must never reach
 * this page: their fork runs from the virtual meeting straight to the
 * application, and neither campus has a tour calendar to send anybody to.
 * campusRunsTours in tour.ts is the single place that says so.
 *
 * ── WHERE THIS SITS AMONG THE OTHER THREE BUTTON PAGES ──────────────────────
 *
 *   /call/<token>              RECORDS. Four outcomes, one row, nothing sent,
 *                              nothing moved.
 *   /send-interest-link/<tok>  ACTS. One button: the family's first letter.
 *   /application-call/<token>  ACTS. Re-send the application, or close out.
 *   /post-call/<token>         ACTS. This one. Tour, close out, or not yet.
 *
 * FOUR TOKENS AND FOUR COLUMNS, not one shared token. A family can be chased
 * for a booking, asked about after the call, and chased again for an
 * application; a leader opening the oldest email in her inbox must not land on
 * the newest page. The token identifies the family AND the occasion.
 *
 * NO SIGN-IN, same as the other three: the token is the authority. Making her
 * sign in first is how a two-minute decision becomes a thing she does later,
 * and later is the whole problem this exists to solve.
 *
 * NO `import "server-only"` IN THIS FILE. See the note in application-call.ts:
 * adding it to email/divert.ts on 3 October failed a Vercel build in eight
 * seconds.
 *
 * THE CLIENT IS CAST, narrowly, because src/types/database.ts was generated on
 * 9 July 2026 and knows about neither lead_call_outcomes nor post_call_token.
 * The Mutation/Query split is not stylistic: modelling update().eq() as a
 * plain Query produced TS2339 on the decline path of application-call.ts.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireTourLink } from "@/lib/admissions/tour";

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

export interface PostCallSubject {
  readonly leadId: string;
  readonly studentName: string;
  readonly schoolName: string | null;
  readonly guardianName: string | null;
  readonly guardianPhone: string | null;
  readonly guardianEmail: string | null;
  readonly inquiryNotes: string | null;
  /**
   * Whether this campus can actually send a tour request right now - the
   * campus runs tours AND has a link set.
   *
   * THE PAGE READS THIS AND HIDES THE BUTTON, rather than offering it and
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

  const tour = requireTourLink({
    schoolName,
    tourUrl: text(school?.tour_booking_url),
  });

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
    canRequestTour: tour.ok,
    tourBlockedReason: tour.ok ? null : tour.error,
    previousCalls: ((calls ?? []) as Row[]).map((call) => ({
      calledAt: String(call.called_at ?? ""),
      outcome: String(call.outcome ?? ""),
      notes: text(call.notes),
    })),
  };
}

/**
 * Three buttons, and what each one actually does.
 *
 * The consequence line under each is not decoration. One of these mails a
 * family and moves a child; one closes a lead. A leader pressing a button on
 * her phone between two meetings is entitled to know which, before she
 * presses it.
 */
export const POST_CALL_ACTIONS = [
  {
    value: "tour_requested",
    label: "Send the tour request",
    consequence:
      "The family is emailed the campus tour calendar and asked to book. " +
      "The child moves to Tour Requested.",
  },
  {
    value: "post_call_not_the_right_school",
    label: "Not the right school, close them out",
    consequence:
      "The lead is marked declined. Nothing is sent to the family from here.",
  },
  {
    value: "post_call_follow_up",
    label: "Not yet, I will follow up",
    consequence:
      "Your notes are saved against the family and nothing else happens. " +
      "The child stays exactly where they are.",
  },
] as const;

export type PostCallAction = (typeof POST_CALL_ACTIONS)[number]["value"];

export function isPostCallAction(value: unknown): value is PostCallAction {
  return POST_CALL_ACTIONS.some((option) => option.value === value);
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

  /*
   * THE TOUR GUARD RUNS AGAIN HERE, not only when the page rendered.
   *
   * The page may have been open since this morning. If the link was cleared
   * in between, the letter would reach the family with nothing to click -
   * which is the exact failure inquiry_thank_you_email_no_link exists to
   * avoid. Checked before the row is written, because a recorded decision
   * that could not be carried out is a worse record than no decision.
   */
  if (params.action === "tour_requested") {
    const tour = requireTourLink({
      schoolName: text(school?.name),
      tourUrl: text(school?.tour_booking_url),
    });
    if (!tour.ok) return { error: tour.error };
  }

  /*
   * THE RECORD GOES IN FIRST, BEFORE ANYTHING IS SENT OR MOVED. Same reasoning
   * as application-call.ts: if the send fails, a row saying what a leader
   * decided is still the truth and still worth having.
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

  /* Not yet. The notes are the whole point; nothing moves, nothing sends. */
  if (params.action === "post_call_follow_up") {
    return { ok: true, action: params.action };
  }

  if (params.action === "post_call_not_the_right_school") {
    const { error: stageError } = await db
      .from("admissions_leads")
      .update({ lead_stage: "declined", updated_at: new Date().toISOString() })
      .eq("id", leadId);

    if (stageError) {
      console.error("[post-call] could not decline:", stageError.message);
      return {
        error:
          "Your decision was recorded, but the lead did not move. Close it in JAG so the next person is not confused.",
      };
    }
    return { ok: true, action: params.action };
  }

  /*
   * SEND THE TOUR REQUEST.
   *
   * THE STAGE MOVES FIRST, THEN THE LETTER. The other order is how a family
   * gets emailed about a tour while the board still shows them waiting on a
   * call: if the stage write fails after the letter has gone, there is no way
   * to un-send it, and the leader is told something went wrong about a letter
   * the family has already read. A stage that moved with no letter behind it
   * is recoverable - she presses the button again.
   */
  const { error: stageError } = await db
    .from("admissions_leads")
    .update({
      lead_stage: "tour_requested",
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (stageError) {
    console.error("[post-call] could not move to tour_requested:", stageError.message);
    return {
      error:
        "Your notes were saved, but the child did not move and the tour " +
        "request was not sent. Try again, or send it from the case page in JAG.",
    };
  }

  try {
    const { notifyAdmissionsEvent } = await import(
      "@/lib/admissions/communications/triggers"
    );
    await notifyAdmissionsEvent(createServiceRoleClient() as never, {
      leadId,
      events: ["tour_invitation_sent"],
      sentBy: null,
    });
  } catch (mailError) {
    console.error("[post-call] tour invitation failed:", mailError);
    return {
      error:
        "Your decision was recorded and the child moved to Tour Requested, " +
        "but the invitation did not go out. Send it from the family's case page in JAG.",
    };
  }

  return { ok: true, action: params.action };
}
