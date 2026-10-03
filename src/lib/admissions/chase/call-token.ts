import "server-only";

/**
 * Turning the token in the escalation email into a family.
 *
 * MODELLED ON apply-link/token.ts, deliberately and almost line for line. The
 * rules there were argued out once and are the same rules here:
 *
 *   - exactly 64 lowercase hex characters, checked BEFORE the database is
 *     touched, so the column is never queried with attacker-shaped input
 *   - one lead, or null; no list, no search, no second family
 *   - null for every failure - unknown, malformed, already used - and
 *     deliberately not saying which, because telling somebody guessing tokens
 *     that they are getting warm is the one thing this could get badly wrong
 *
 * WHY THE SERVICE ROLE. The person opening this is a school leader who has
 * been emailed at seven in the morning and is about to dial a number. Making
 * her sign in first is how a two-minute call becomes a thing she does later.
 * The token is the authority, exactly as it is on the application link and
 * the fee page, and it is the only thing accepted here.
 *
 * WHAT IT RETURNS IS WHAT THE PAGE NEEDS AND NOT ONE COLUMN MORE. A name, a
 * campus, a telephone number, an email, and what the family said when they
 * inquired. No date of birth, no address, no decision history. Whoever holds
 * the link can see what they need to make the call and nothing else about the
 * child.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";

const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

export interface CallSubject {
  readonly leadId: string;
  readonly studentName: string;
  readonly schoolName: string | null;
  readonly guardianName: string | null;
  readonly guardianPhone: string | null;
  readonly guardianEmail: string | null;
  readonly inquiryNotes: string | null;
  readonly inquiredAt: string;
  /** Calls already recorded for this family, newest first. */
  readonly previousCalls: readonly {
    readonly calledAt: string;
    readonly outcome: string;
    readonly notes: string | null;
  }[];
}

type LeadRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  guardian_first_name: string | null;
  guardian_last_name: string | null;
  guardian_email: string | null;
  guardian_phone: string | null;
  notes: string | null;
  created_at: string;
  schools: { name?: string } | { name?: string }[] | null;
};

export async function leadForCallToken(token: string): Promise<CallSubject | null> {
  if (!TOKEN_PATTERN.test(token)) return null;

  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("admissions_leads")
    .select(
      "id, first_name, last_name, preferred_name, guardian_first_name, " +
        "guardian_last_name, guardian_email, guardian_phone, notes, created_at, " +
        "schools(name)"
    )
    .eq("interest_call_token", token)
    .maybeSingle();

  if (error) {
    console.error("[call-link] token lookup failed:", error.message);
    return null;
  }
  if (!data) return null;

  const lead = data as unknown as LeadRow;
  const school = Array.isArray(lead.schools) ? lead.schools[0] : lead.schools;

  const { data: calls } = await admin
    .from("lead_call_outcomes")
    .select("called_at, outcome, notes")
    .eq("lead_id", lead.id)
    .order("called_at", { ascending: false })
    .limit(10);

  const studentName =
    lead.preferred_name?.trim() ||
    `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() ||
    "This student";

  return {
    leadId: lead.id,
    studentName,
    schoolName: school?.name ?? null,
    guardianName:
      `${lead.guardian_first_name ?? ""} ${lead.guardian_last_name ?? ""}`.trim() || null,
    guardianPhone: lead.guardian_phone,
    guardianEmail: lead.guardian_email,
    inquiryNotes: lead.notes,
    inquiredAt: lead.created_at,
    previousCalls: (calls ?? []).map((c) => ({
      calledAt: String(c.called_at),
      outcome: String(c.outcome),
      notes: (c.notes as string | null) ?? null,
    })),
  };
}

export const CALL_OUTCOMES = [
  {
    value: "spoke_will_book",
    label: "I spoke to them — they will book",
    consequence: "No more automatic emails. You have this family in hand.",
  },
  {
    value: "spoke_not_proceeding",
    label: "I spoke to them — they are not going ahead",
    consequence:
      "Recorded against the family. Close the inquiry in JAG when you are ready — " +
      "nothing is sent to them from here.",
  },
  {
    value: "left_message",
    label: "I left a message",
    consequence: "Recorded. No more automatic emails.",
  },
  {
    value: "no_answer",
    label: "I could not reach them",
    consequence: "Recorded. No more automatic emails.",
  },
] as const;

export type CallOutcome = (typeof CALL_OUTCOMES)[number]["value"];

export function isCallOutcome(value: unknown): value is CallOutcome {
  return CALL_OUTCOMES.some((o) => o.value === value);
}

/**
 * RECORDING THE CALL DOES NOT SEND ANYTHING AND DOES NOT MOVE THE CHILD.
 *
 * The design of 2 October had "they are not going ahead" close the inquiry and
 * post inquiry_closed_email to the family. That is one line and it is not
 * taken, for two reasons. Jimmy's rule is that a student does not move from
 * one stage to the next without a school leader moving them, and his standing
 * rule is that he sees the exact words before anything a human reads goes out
 * on a path that has not sent it before. A letter sent from a page nobody has
 * walked through yet is how a family gets told something nobody meant.
 *
 * So this writes one row. The chase stops - decideChase refuses any family
 * with a recorded call - and the leader closes the inquiry in JAG herself,
 * through the gate that already sends that letter and that she has used
 * before.
 */
export async function recordCallOutcome(params: {
  token: string;
  outcome: CallOutcome;
  notes: string | null;
}): Promise<{ ok: true } | { error: string }> {
  if (!TOKEN_PATTERN.test(params.token)) return { error: "That link is not valid." };
  if (!isCallOutcome(params.outcome)) return { error: "Choose how the call went." };

  const admin = createServiceRoleClient();

  const { data: lead } = await admin
    .from("admissions_leads")
    .select("id")
    .eq("interest_call_token", params.token)
    .maybeSingle();

  const leadId = (lead as { id?: string } | null)?.id;
  if (!leadId) return { error: "That link is not valid." };

  const { error } = await admin.from("lead_call_outcomes").insert({
    lead_id: leadId,
    outcome: params.outcome,
    notes: params.notes?.trim() || null,
    recorded_by: null,
  });

  /*
   * The RETURNED error, not just a thrown one. supabase-js resolves with
   * { error } on a refusal rather than throwing, so a try/catch alone catches
   * nothing and the row silently never appears - and this page would thank a
   * school leader for recording a call that was not recorded.
   */
  if (error) {
    console.error("[call-link] could not record the call:", error.message);
    return { error: "That did not save. Tell Jimmy before you forget what was said." };
  }

  return { ok: true };
}
