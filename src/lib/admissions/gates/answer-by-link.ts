/**
 * ANSWERING A DECISION FROM THE LETTER. 17 October 2026.
 *
 * Jimmy, on the "Decision needed" letter: delete "Open the decision", add
 * "Yes — schedule shadow days" and "See entire application", and - for the
 * Yes - send it in one click, no sign-in. Then three letters, one per
 * question, each with its own answer buttons.
 *
 * ── ONE CLICK FROM THE INBOX, ONE MORE ON THE PAGE ──────────────────────────
 *
 * The button opens /decide/<token>/<answer>, which names the child and has a
 * single button that sends. Not a link that sends by itself: Outlook and
 * Gmail fetch every link in an email to check it for safety, and a link that
 * sent on a GET would email a family the moment the letter arrived, answered
 * by software. /skip-stage, /post-call and /send-interest-link are built the
 * same way for the same reason. No sign-in - the token is the authority.
 *
 * ── THE STAGE IS READ LIVE ──────────────────────────────────────────────────
 *
 * The question is worked out from where the child is NOW, not from which
 * letter was pressed. A three-week-old send-the-application letter pressed
 * after the child has applied asks nothing: the page says where the child is
 * and that this question has passed. That is the rule skip-stage.ts set.
 *
 * ── WHAT THE RECORD SAYS ────────────────────────────────────────────────────
 *
 * Nobody is signed in, so the gate cannot say who answered. It says
 * answered_via = 'email_link' and names the address the letter went to -
 * "answered from the link sent to nina.gaddy@theacademyga.org", not "Nina
 * decided". Jimmy accepted that trade knowingly when the token pages were
 * designed (admissions-redesign, 1 October). Migration 566 is what lets the
 * row be answered without a user.
 *
 * ── EACH ANSWER DOES WHAT THE GATE'S OWN ANSWER DOES ────────────────────────
 *
 * Two doors onto one decision must not do two different things. Send the
 * application runs prepareApplicationForInvite then application_invited,
 * exactly as answerDecisionGate does. The shadow days send
 * shadow_days_invited. Accept and Deny run applyAdmissionsDecision, the
 * function the gate, the decisions page and the shadow day's own letter all
 * run.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import { leadStageLabel } from "@/lib/constants/admissions";
import {
  branchFor,
  gateFor,
  gateOpeningAtStage,
  DECISION_LETTER_EVENT,
  type GateBranch,
  type GateKey,
} from "@/lib/admissions/gates/definitions";
import type { CommunicationTriggerEvent } from "@/lib/admissions/communications/types";

const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

export const LINK_ANSWERS = ["yes", "accept", "deny"] as const;
export type LinkAnswer = (typeof LINK_ANSWERS)[number];

export function isLinkAnswer(value: unknown): value is LinkAnswer {
  return (LINK_ANSWERS as readonly unknown[]).includes(value);
}

type Row = Record<string, unknown>;
type Answer<T> = PromiseLike<{ data: T; error: { message: string; code?: string } | null }>;

interface Query {
  select: (columns: string) => Query & Answer<Row[] | null>;
  eq: (column: string, value: string) => Query;
  gte: (column: string, value: string) => Query;
  order: (column: string, options: { ascending: boolean }) => Query;
  limit: (count: number) => Query & Answer<Row[] | null>;
  maybeSingle: () => Answer<Row | null>;
  insert: (row: Row) => Answer<null>;
  update: (row: Row) => Query & Answer<Row[] | null>;
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

/**
 * What the page says, per question and answer. Jimmy's button words, and a
 * question in the same words, so the page and the letter read as one thing.
 */
export function wordingFor(
  gateKey: GateKey,
  answer: LinkAnswer,
  firstName: string
): { readonly question: string; readonly button: string } | null {
  if (gateKey === "invite_to_apply" && answer === "yes") {
    return {
      question: `Send ${firstName}'s parent the Application for Admissions?`,
      button: "Yes — send the application",
    };
  }
  if (gateKey === "invite_to_shadow_days" && answer === "yes") {
    return {
      question: `Send ${firstName}'s Shadow Day invitation?`,
      button: "Yes — schedule shadow days",
    };
  }
  if (gateKey === "accept_or_deny" && answer === "accept") {
    return { question: `Accept ${firstName}?`, button: "Accept — send email" };
  }
  if (gateKey === "accept_or_deny" && answer === "deny") {
    return { question: `Deny ${firstName}?`, button: "Deny — send email" };
  }
  return null;
}

export interface DecisionSubject {
  readonly leadId: string;
  readonly studentFullName: string;
  readonly studentFirstName: string;
  readonly schoolName: string | null;
  readonly currentStage: string | null;
  readonly currentStageLabel: string;
  readonly stageEnteredAt: string | null;
  readonly shadowDaysUrl: string | null;
  /** The question open for this child right now, or null if none is. */
  readonly gateKey: GateKey | null;
}

/**
 * The token in the letter, turned into a child and the question in front of
 * her today. Null for every failure without saying which, the rule
 * call-token.ts and skip-stage.ts keep.
 */
export async function leadForDecisionToken(token: string): Promise<DecisionSubject | null> {
  if (!TOKEN_PATTERN.test(token)) return null;

  const { data, error } = await admin()
    .from("admissions_leads")
    .select(
      "id, first_name, last_name, preferred_name, lead_stage, stage_entered_at, " +
        "schools(name, shadow_days_url)"
    )
    .eq("decision_token", token)
    .maybeSingle();

  if (error) {
    console.error("[decide] token lookup failed:", error.message);
    return null;
  }
  if (!data) return null;

  const lead = data as Row;
  const leadId = String(lead.id ?? "");
  if (!leadId) return null;

  const embedded = lead.schools as Row | Row[] | null;
  const school = (Array.isArray(embedded) ? embedded[0] : embedded) ?? null;
  const schoolName = text(school?.name);
  const stage = text(lead.lead_stage);
  const first = text(lead.preferred_name) ?? text(lead.first_name) ?? "This student";

  return {
    leadId,
    studentFullName:
      `${text(lead.first_name) ?? ""} ${text(lead.last_name) ?? ""}`.trim() || first,
    studentFirstName: first,
    schoolName,
    currentStage: stage,
    currentStageLabel: leadStageLabel(stage),
    stageEnteredAt: text(lead.stage_entered_at),
    shadowDaysUrl: text(school?.shadow_days_url),
    gateKey: stage ? gateOpeningAtStage(stage, schoolName) : null,
  };
}

/** The branch this answer chooses on this child's open question, or null. */
export function branchForLink(
  gateKey: GateKey | null,
  answer: LinkAnswer
): GateBranch | null {
  if (!gateKey) return null;
  const gate = gateFor(gateKey);
  if (!gate) return null;
  const branch = branchFor(gate, answer);
  /* A link only ever says yes, accept or deny. "No" stays in JAG. */
  return branch && branch.answer !== "no" ? branch : null;
}

/**
 * THE PRESS.
 *
 * The gate is claimed FIRST, conditionally on it still being pending, so a
 * double press - or two leaders on one letter - cannot send twice. Only the
 * press that claimed it goes on to email the family. answerDecisionGate keeps
 * the same order for the same reason.
 */
export async function answerDecisionByLink(params: {
  token: string;
  answer: string;
}): Promise<{ ok: true; warning: string | null } | { error: string }> {
  if (!isLinkAnswer(params.answer)) return { error: "That link is not valid." };
  const subject = await leadForDecisionToken(params.token);
  if (!subject) return { error: "That link is not valid." };

  const gateKey = subject.gateKey;
  const branch = branchForLink(gateKey, params.answer);
  if (!gateKey || !branch) {
    return {
      error:
        `${subject.studentFirstName} is at ${subject.currentStageLabel} now, so this ` +
        `question has passed. Nothing was sent.`,
    };
  }

  /* Checked before anything is written: an invitation with no calendar in it
     is the empty-link letter this platform has already sent once. */
  if (gateKey === "invite_to_shadow_days" && !subject.shadowDaysUrl) {
    return {
      error:
        `${subject.schoolName ?? "This campus"} has no shadow-days calendar set, so ` +
        `there is nothing to send. Nothing was sent.`,
    };
  }

  const db = admin();
  const leadId = subject.leadId;
  const now = new Date().toISOString();

  /* Where the letter went, for the record. The newest one for this question. */
  const { data: sentRows } = await db
    .from("admissions_communications")
    .select("sent_to")
    .eq("lead_id", leadId)
    .eq("trigger_event", DECISION_LETTER_EVENT[gateKey])
    .order("sent_at", { ascending: false })
    .limit(1);
  const sentTo = text(((sentRows ?? [])[0] as Row | undefined)?.sent_to);
  const note = sentTo
    ? `Answered from the link in the "Decision needed" email sent to ${sentTo}.`
    : `Answered from the link in the "Decision needed" email.`;

  const answeredFields: Row = {
    status: "answered",
    answer: branch.answer,
    answered_at: now,
    answered_via: "email_link",
    answer_notes: note,
  };

  const { data: pending } = await db
    .from("admissions_decision_gates")
    .select("id")
    .eq("lead_id", leadId)
    .eq("gate_key", gateKey)
    .eq("status", "pending")
    .limit(1);
  const pendingId = text(((pending ?? [])[0] as Row | undefined)?.id);

  if (pendingId) {
    const { data: claimed, error } = await db
      .from("admissions_decision_gates")
      .update(answeredFields)
      .eq("id", pendingId)
      .eq("status", "pending")
      .select("id");
    if (error) {
      console.error("[decide] could not record:", error.message);
      return { error: "That did not save. Nothing was sent. Tell Jimmy." };
    }
    if (!(claimed ?? []).length) {
      return { error: `This was already answered for ${subject.studentFirstName}. Nothing more was sent.` };
    }
  } else {
    /*
     * NO OPEN GATE. Skip next stage lands a child on Application Submitted by
     * writing the stage directly, so the shadow-days letter can arrive with
     * no gate behind it. The answer is recorded as a gate answered here -
     * unless this question was already answered since the child reached this
     * stage, which is the double press.
     */
    if (subject.stageEnteredAt) {
      const { data: already } = await db
        .from("admissions_decision_gates")
        .select("id")
        .eq("lead_id", leadId)
        .eq("gate_key", gateKey)
        .eq("status", "answered")
        .gte("answered_at", subject.stageEnteredAt)
        .limit(1);
      if ((already ?? []).length) {
        return { error: `This was already answered for ${subject.studentFirstName}. Nothing more was sent.` };
      }
    }
    const { error } = await db
      .from("admissions_decision_gates")
      .insert({ lead_id: leadId, gate_key: gateKey, ...answeredFields });
    if (error) {
      console.error("[decide] could not record:", error.message);
      return { error: "That did not save. Nothing was sent. Tell Jimmy." };
    }
  }

  const service = createServiceRoleClient() as never;

  /* ---- Accept or deny: the one decision path everything else uses. ---- */
  if (branch.delegatesToDecision) {
    const { data: application } = await db
      .from("admissions_applications")
      .select("id")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1);
    const applicationId = text(((application ?? [])[0] as Row | undefined)?.id);

    const { applyAdmissionsDecision } = await import("@/lib/admissions/decisions-core");
    const outcome = await applyAdmissionsDecision(service, {
      leadId,
      applicationId,
      decisionType: branch.delegatesToDecision,
      customNotes: "",
      sendEmail: true,
      /* Nobody is signed in. A letter is not a session. */
      actorUserId: null,
    });
    if (outcome && "error" in outcome && outcome.error) {
      console.error("[decide] the decision failed:", outcome.error);
      return {
        error: `Your answer was recorded, but the decision did not complete: ${outcome.error} Finish it in JAG.`,
      };
    }
    const warning =
      outcome && "warning" in outcome && typeof outcome.warning === "string"
        ? outcome.warning
        : null;
    return { ok: true, warning };
  }

  /* ---- Send the application: the token and the application first. ---- */
  if (branch.familyEvent === "application_invited") {
    const { prepareApplicationForInvite } = await import(
      "@/lib/admissions/application-for-invited-lead"
    );
    const prepared = await prepareApplicationForInvite(service, { leadId });
    if (!prepared.ok) {
      return {
        error:
          `Your answer was recorded, but the family was not emailed: ${prepared.reason} ` +
          `Nothing has been sent, so nobody has a broken link.`,
      };
    }
  }

  if (branch.familyEvent) {
    try {
      const { notifyAdmissionsEvent } = await import(
        "@/lib/admissions/communications/triggers"
      );
      await notifyAdmissionsEvent(service, {
        leadId,
        events: [branch.familyEvent as CommunicationTriggerEvent],
        sentBy: null,
      });
    } catch (err) {
      console.error("[decide] the family email failed:", err);
      return {
        error:
          "Your answer was recorded, but the email to the family did not go out. " +
          "Send it from the family's case page in JAG.",
      };
    }
  }

  return { ok: true, warning: null };
}
