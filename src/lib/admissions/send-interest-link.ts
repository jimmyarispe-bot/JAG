/**
 * The one button that starts everything.
 *
 * Jimmy, 4 October 2026: the interest meeting link is no longer sent by the
 * form. A school leader reads the inquiry and decides to send it.
 *
 * WHAT THAT CHANGED. Until now inquiry_thank_you_email fired on
 * inquiry_submitted, seconds after a parent pressed the button on the
 * website. It now fires on interest_meeting_link_sent, and nothing fires
 * that except this page. Both versions of the letter are untouched - the
 * guard that picks the one with the booking link over the one without still
 * works exactly as it did.
 *
 * SO THE FAMILY HEARS NOTHING UNTIL SHE ACTS. That is the deliberate trade
 * and it is why the chase behind it is the tightest in the chain: 24 hours
 * to the campus, 48 hours to the campus, and at 72 hours it leaves the
 * campus entirely and goes to Jimmy and Danni.
 *
 * ONE OPTION, NOT TWO. Every other decision in admissions is a gate with a
 * yes and a no. This is not a gate. There is nothing to decline here - a
 * family who is not right for the school is what the interest meeting is
 * for. The only question is whether we have talked to them yet.
 *
 * NO `import "server-only"`. Adding it to email/divert.ts on 3 October
 * failed a Vercel build in eight seconds, because the validation gates run
 * under tsx where that alias does not exist.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";

const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

type Row = Record<string, unknown>;
type Answer<T> = PromiseLike<{ data: T; error: { message: string } | null }>;

/** An update is filtered and then awaited, so its eq() carries the promise. */
interface Mutation extends Answer<null> {
  eq: (column: string, value: string) => Mutation;
}

interface Query {
  select: (columns: string) => Query;
  eq: (column: string, value: string) => Query;
  in: (column: string, values: string[]) => Query & Answer<Row[] | null>;
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

export interface InterestLinkSubject {
  readonly leadId: string;
  readonly studentName: string;
  readonly schoolName: string | null;
  readonly guardianName: string | null;
  readonly guardianEmail: string | null;
  readonly guardianPhone: string | null;
  readonly inquiryNotes: string | null;
  readonly inquiredAt: string;
  /** True once the letter has gone — the page then says so instead of asking. */
  readonly alreadySent: boolean;
}

export async function leadForInterestLinkToken(
  token: string
): Promise<InterestLinkSubject | null> {
  if (!TOKEN_PATTERN.test(token)) return null;

  const db = admin();

  const { data, error } = await db
    .from("admissions_leads")
    .select(
      "id, first_name, last_name, preferred_name, guardian_first_name, " +
        "guardian_last_name, guardian_email, guardian_phone, notes, created_at, " +
        "schools(name)"
    )
    .eq("interest_link_token", token)
    .maybeSingle();

  if (error) {
    console.error("[send-interest-link] token lookup failed:", error.message);
    return null;
  }
  if (!data) return null;

  const lead = data as Row;
  const leadId = String(lead.id ?? "");
  if (!leadId) return null;

  const embedded = lead.schools as Row | Row[] | null;
  const school = (Array.isArray(embedded) ? embedded[0] : embedded) ?? null;

  /*
   * ASKED BEFORE THE PAGE DRAWS, NOT AFTER THE BUTTON IS PRESSED.
   *
   * A leader who opens the same email twice should be told the letter has
   * already gone, not offered a button that sends a second one. The press
   * itself is also guarded, for the case where two people open it at once.
   */
  const { data: sent } = await db
    .from("admissions_communications")
    .select("id")
    .eq("lead_id", leadId)
    .in("template_key", ["inquiry_thank_you_email", "inquiry_thank_you_email_no_link"]);

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
    guardianEmail: text(lead.guardian_email),
    guardianPhone: text(lead.guardian_phone),
    inquiryNotes: text(lead.notes),
    inquiredAt: String(lead.created_at ?? new Date().toISOString()),
    alreadySent: ((sent ?? []) as Row[]).length > 0,
  };
}

export async function sendInterestMeetingLink(
  token: string
): Promise<{ ok: true } | { error: string }> {
  if (!TOKEN_PATTERN.test(token)) return { error: "That link is not valid." };

  const db = admin();

  const { data: lead } = await db
    .from("admissions_leads")
    .select("id, guardian_email")
    .eq("interest_link_token", token)
    .maybeSingle();

  const row = lead as Row | null;
  const leadId = row ? String(row.id ?? "") : "";
  if (!leadId) return { error: "That link is not valid." };

  const guardianEmail = text(row?.guardian_email);
  if (!guardianEmail) {
    return {
      error:
        "This family left no email address on their inquiry, so there is nowhere to send it. Their telephone number is above.",
    };
  }

  /* Pressed twice, sent once. */
  const { data: already } = await db
    .from("admissions_communications")
    .select("id")
    .eq("lead_id", leadId)
    .in("template_key", ["inquiry_thank_you_email", "inquiry_thank_you_email_no_link"]);

  if (((already ?? []) as Row[]).length > 0) return { ok: true };

  try {
    const { notifyAdmissionsEvent } = await import(
      "@/lib/admissions/communications/triggers"
    );
    await notifyAdmissionsEvent(createServiceRoleClient() as never, {
      leadId,
      events: ["interest_meeting_link_sent"],
      sentBy: null,
    });
  } catch (mailError) {
    console.error("[send-interest-link] send failed:", mailError);
    return {
      error:
        "That did not send. Try once more, and if it fails again tell Jimmy — the family has still not heard from us.",
    };
  }

  return { ok: true };
}
