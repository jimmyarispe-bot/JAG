/**
 * The school leader's page when an application has not arrived.
 *
 * Five days after a family was invited to apply, three reminders have gone to
 * them and nothing has come back. This is the link in the email that lands on
 * the leader's phone, and it does what Jimmy asked for on 4 October: "send the
 * school leader the same type of 'it's time to give the parent a call' email
 * with 'send application' and 'not moving forward' buttons and notes section".
 *
 * HOW THIS DIFFERS FROM /call/<token>, WHICH IT IS OTHERWISE MODELLED ON.
 *
 * That page RECORDS. Four outcomes, one row, nothing sent and nothing moved -
 * deliberately, because on 2 October the design had it closing inquiries and
 * mailing families from a page nobody had walked through yet.
 *
 * This page ACTS, and that is the whole point of it. Both buttons are a school
 * leader making a decision about a child, which is exactly who Jimmy's rule
 * says must make it. The difference is only which door she makes it through:
 * the gate she would otherwise open in JAG, or the link in the email she is
 * already reading. Neither button does anything she could not do herself in
 * the dashboard two minutes later.
 *
 *   SEND APPLICATION      re-posts application_invited. The family gets the
 *                         invitation letter again, on the link they already
 *                         have - mint_application_access_token is idempotent,
 *                         so the old link does not die.
 *
 *   NOT MOVING FORWARD    marks the lead declined and SENDS THE FAMILY
 *                         NOTHING. This is the one place the page is quieter
 *                         than the gate: the gate's "no" branch posts a
 *                         decline letter, and that letter is written for a
 *                         family we chose not to invite, not for a family who
 *                         was invited and went quiet. Sending it here would
 *                         tell someone who simply got busy that they had been
 *                         turned down. If Jimmy wants a letter on this branch
 *                         he will say which words, and it is four lines.
 *
 * NO SIGN-IN. The token is the authority, same as the application link, the
 * fee page and the interest-meeting call page. Making her sign in first is how
 * a two-minute decision becomes a thing she does later, and later is the whole
 * problem this exists to solve.
 *
 * THE CLIENT IS CAST, narrowly, for the reason written out at length in
 * chase/call-token.ts: src/types/database.ts was generated on 9 July 2026 and
 * knows about neither lead_call_outcomes nor application_call_token. The cast
 * names the methods it needs and no others.
 *
 * THERE IS NO `import "server-only"` IN THIS FILE, ON PURPOSE. Adding it to
 * email/divert.ts on 3 October failed a Vercel build in eight seconds: the
 * validation gates run under tsx, outside Next, where that alias does not
 * exist. Anything that might be reached from the platform registry walk stays
 * clear of it.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";

const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

type Row = Record<string, unknown>;
type Answer<T> = PromiseLike<{ data: T; error: { message: string } | null }>;

/**
 * An UPDATE is filtered and THEN awaited, so its eq() has to carry the
 * promise with it. A read's eq() does not - it narrows and waits for
 * maybeSingle() or limit(). Modelling both with one Query is what produced
 * TS2339 "Property 'error' does not exist on type 'Query'" on the decline
 * path: the chain update().eq() fell back to a plain Query with nothing to
 * await and no error to read.
 */
interface Mutation extends Answer<null> {
  eq: (column: string, value: string) => Mutation;
}

interface Query {
  select: (columns: string) => Query;
  eq: (column: string, value: string) => Query;
  is: (column: string, value: null) => Query;
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

export interface ApplicationCallSubject {
  readonly leadId: string;
  readonly studentName: string;
  readonly schoolName: string | null;
  readonly guardianName: string | null;
  readonly guardianPhone: string | null;
  readonly guardianEmail: string | null;
  readonly inquiryNotes: string | null;
  /**
   * Whether an application row exists with nothing submitted on it.
   *
   * THIS IS ALMOST ALWAYS TRUE, and the page says so rather than claiming the
   * family never started. Since 30 September an application row is created at
   * the moment of INVITATION, so "no application at all" effectively cannot
   * happen any more - what is missing is submitted_at. A leader told "they
   * have not started" when the family has filled in half of it would open the
   * call with the wrong sentence.
   */
  readonly applicationOpenedNotSubmitted: boolean;
  /** Decisions and calls already recorded for this family, newest first. */
  readonly previousCalls: readonly {
    readonly calledAt: string;
    readonly outcome: string;
    readonly notes: string | null;
  }[];
}

export async function leadForApplicationCallToken(
  token: string
): Promise<ApplicationCallSubject | null> {
  if (!TOKEN_PATTERN.test(token)) return null;

  const db = admin();

  const { data, error } = await db
    .from("admissions_leads")
    .select(
      "id, first_name, last_name, preferred_name, guardian_first_name, " +
        "guardian_last_name, guardian_email, guardian_phone, notes, " +
        "schools(name)"
    )
    .eq("application_call_token", token)
    .maybeSingle();

  if (error) {
    console.error("[application-call] token lookup failed:", error.message);
    return null;
  }
  if (!data) return null;

  const lead = data as Row;
  const leadId = String(lead.id ?? "");
  if (!leadId) return null;

  /* PostgREST returns an embedded row as an object or a one-element array. */
  const embedded = lead.schools as Row | Row[] | null;
  const school = (Array.isArray(embedded) ? embedded[0] : embedded) ?? null;

  const { data: application } = await db
    .from("admissions_applications")
    .select("id, submitted_at")
    .eq("lead_id", leadId)
    .maybeSingle();

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
    schoolName: text(school?.name),
    guardianName,
    guardianPhone: text(lead.guardian_phone),
    guardianEmail: text(lead.guardian_email),
    inquiryNotes: text(lead.notes),
    applicationOpenedNotSubmitted: Boolean(
      application && !(application as Row).submitted_at
    ),
    previousCalls: ((calls ?? []) as Row[]).map((call) => ({
      calledAt: String(call.called_at ?? ""),
      outcome: String(call.outcome ?? ""),
      notes: text(call.notes),
    })),
  };
}

/**
 * Two buttons, in Jimmy's words, and what each one actually does.
 *
 * The consequence line under each is not decoration. This page sends a letter
 * and moves a child, which /call/<token> never does, and a leader pressing a
 * button on her phone at seven in the morning is entitled to know which of
 * those is about to happen before she presses it.
 */
export const APPLICATION_CALL_ACTIONS = [
  {
    value: "application_resent",
    label: "Send application",
    consequence:
      "The invitation to apply goes to the family again, on the same link they " +
      "already have. Automatic reminders stay stopped — this is yours now.",
  },
  {
    value: "application_not_proceeding",
    label: "Not moving forward",
    consequence:
      "The lead is marked declined. Nothing is sent to the family from here.",
  },
] as const;

export type ApplicationCallAction =
  (typeof APPLICATION_CALL_ACTIONS)[number]["value"];

export function isApplicationCallAction(
  value: unknown
): value is ApplicationCallAction {
  return APPLICATION_CALL_ACTIONS.some((option) => option.value === value);
}

export async function recordApplicationCallDecision(params: {
  token: string;
  action: ApplicationCallAction;
  notes: string | null;
}): Promise<{ ok: true; action: ApplicationCallAction } | { error: string }> {
  if (!TOKEN_PATTERN.test(params.token)) {
    return { error: "That link is not valid." };
  }
  if (!isApplicationCallAction(params.action)) {
    return { error: "Choose what should happen next." };
  }

  const db = admin();

  const { data: lead } = await db
    .from("admissions_leads")
    .select("id")
    .eq("application_call_token", params.token)
    .maybeSingle();

  const leadId = lead ? String((lead as Row).id ?? "") : "";
  if (!leadId) return { error: "That link is not valid." };

  /*
   * THE RECORD GOES IN FIRST, BEFORE ANYTHING IS SENT OR MOVED.
   *
   * If the resend fails, a row saying a leader chose to resend is still the
   * truth and still worth having. The other order loses the decision whenever
   * the thing it decided goes wrong, which is precisely when you want to know
   * what somebody meant to happen.
   */
  const { error: recordError } = await db.from("lead_call_outcomes").insert({
    lead_id: leadId,
    outcome: params.action,
    notes: params.notes?.trim() || null,
    recorded_by: null,
  });

  /*
   * The RETURNED error, not just a thrown one. supabase-js resolves with
   * { error } on an RLS refusal rather than throwing, so a try/catch alone
   * catches nothing and this page would thank a school leader for a decision
   * that was never written down.
   */
  if (recordError) {
    console.error("[application-call] could not record:", recordError.message);
    return {
      error: "That did not save. Tell Jimmy before you forget what you decided.",
    };
  }

  if (params.action === "application_not_proceeding") {
    const { error: stageError } = await db
      .from("admissions_leads")
      .update({ lead_stage: "declined", updated_at: new Date().toISOString() })
      .eq("id", leadId);

    if (stageError) {
      console.error("[application-call] could not decline:", stageError.message);
      return {
        error:
          "Your decision was recorded, but the lead did not move. Close it in JAG so the next person is not confused.",
      };
    }
    return { ok: true, action: params.action };
  }

  /*
   * SEND APPLICATION.
   *
   * Dynamically imported and handed the service-role client exactly the way
   * apply-link/actions.ts already does it. The import is deferred because this
   * module is reached from the nightly job as well as from this page, and the
   * communications engine pulls in the whole sending path behind it.
   */
  try {
    const { notifyAdmissionsEvent } = await import(
      "@/lib/admissions/communications/triggers"
    );
    await notifyAdmissionsEvent(createServiceRoleClient() as never, {
      leadId,
      events: ["application_invited"],
      sentBy: null,
    });
  } catch (mailError) {
    console.error("[application-call] resend failed:", mailError);
    return {
      error:
        "Your decision was recorded, but the invitation did not go out. " +
        "Send it from the family's case page in JAG.",
    };
  }

  return { ok: true, action: params.action };
}
