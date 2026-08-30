import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTransactionalEmail } from "@/lib/platform/email/send";
import {
  FIELD_LABELS,
  describeGaps,
  type FamilyGap,
  type RequestedFields,
} from "@/lib/people/completeness-shared";

/**
 * Asking parents for the details we are missing.
 *
 * The token follows the listening-campaign design (migration 214): 256 bits of
 * randomness minted here, only the SHA-256 digest stored. The plaintext exists
 * in the email and nowhere else, so a copy of the database yields no working
 * links.
 *
 * Sending is capped at four attempts a week apart. A parent who has ignored
 * four emails will not answer the fifth, and the school still has a telephone.
 */

const MIN_TOKEN_CHARS = 16;
const REMINDER_INTERVAL_DAYS = 7;

export function mintInfoToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Postgres bytea wants `\x…` hex over PostgREST. */
export function hashInfoTokenHex(token: string): string {
  const normalized = token.trim();
  if (normalized.length < MIN_TOKEN_CHARS) throw new Error("parent_info_token_invalid");
  return `\\x${createHash("sha256").update(normalized, "utf8").digest("hex")}`;
}

function appUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://thejag.org";
  return base.replace(/\/+$/, "");
}

export function infoRequestLink(token: string): string {
  return `${appUrl()}/update/${encodeURIComponent(token)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toRequested(gap: FamilyGap): RequestedFields {
  return {
    students: gap.students.map((s) => ({ id: s.id, name: s.name, fields: s.missing })),
    // The email gap cannot be closed by an email, so it is never asked for by
    // one. It is left in the family record as a gap for staff to chase by phone.
    family: gap.familyMissing.filter((f) => f !== "email"),
    familyName: gap.familyName,
  };
}

/**
 * The message itself.
 *
 * Names the missing fields in the body, not just behind the link — a parent
 * should be able to tell from the email alone whether this is worth thirty
 * seconds, without clicking anything.
 */
export function renderInfoRequestEmail(input: {
  schoolName: string;
  guardianName: string | null;
  requested: RequestedFields;
  link: string;
  reminder: boolean;
}): { subject: string; html: string; text: string } {
  const { schoolName, requested, link, reminder } = input;
  const greeting = input.guardianName ? `Hi ${input.guardianName},` : "Hello,";
  const summary = describeGaps(requested);

  const items: string[] = [];
  for (const student of requested.students) {
    for (const field of student.fields) {
      items.push(`${FIELD_LABELS[field]} — ${student.name}`);
    }
  }
  for (const field of requested.family) {
    items.push(`${FIELD_LABELS[field]} — your household`);
  }

  const subject = reminder
    ? `Reminder: ${schoolName} still needs a few details`
    : `${schoolName} is missing a few details for your family`;

  const opening = reminder
    ? "We wrote a little while ago and these details are still outstanding. Please use the link below — it replaces the one in the earlier email, which no longer works."
    : `Our records for your family are missing ${summary}. It should take under a minute to put right.`;

  const list = items.map((i) => `<li style="margin:0 0 6px;">${escapeHtml(i)}</li>`).join("");

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8fafc;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;padding:32px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
  <tr><td>
    <p style="margin:0 0 4px;font-size:13px;color:#64748b;">${escapeHtml(schoolName)}</p>
    <h1 style="margin:0 0 20px;font-size:20px;line-height:1.3;color:#0f172a;">A few details we're missing</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#334155;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#334155;">${escapeHtml(opening)}</p>
    <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.55;color:#0f172a;">${list}</ul>
    <p style="margin:0 0 28px;">
      <a href="${escapeHtml(link)}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:15px;font-weight:600;">Fill these in</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#64748b;">If the button does not work, paste this into your browser:</p>
    <p style="margin:0 0 24px;font-size:13px;line-height:1.5;word-break:break-all;color:#4f46e5;">${escapeHtml(link)}</p>
    <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">This link is just for your family and stops working in 30 days. If something here looks wrong, reply to this email and we will fix it at our end.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  const text = [
    schoolName,
    "A few details we're missing",
    "",
    greeting,
    opening,
    "",
    ...items.map((i) => `- ${i}`),
    "",
    `Fill these in: ${link}`,
    "",
    "This link is just for your family and stops working in 30 days.",
  ].join("\n");

  return { subject, html, text };
}

type Client = SupabaseClient<any, any, any>;

export type InfoRequestOutcome = {
  created: number;
  sent: number;
  skipped: { family: string; reason: string }[];
  failed: { family: string; reason: string }[];
};

/**
 * Raise a request for one household and email it.
 *
 * The token is minted, hashed, stored, and then used once to build the link.
 * Nothing anywhere keeps the plaintext.
 */
async function createAndSend(
  supabase: Client,
  gap: FamilyGap,
  actorUserId: string | null,
  outcome: InfoRequestOutcome
): Promise<void> {
  if (!gap.email) {
    outcome.skipped.push({
      family: gap.familyName,
      reason: "No email address — this one needs a phone call",
    });
    return;
  }

  const requested = toRequested(gap);
  if (requested.students.length === 0 && requested.family.length === 0) {
    outcome.skipped.push({ family: gap.familyName, reason: "Nothing to ask for" });
    return;
  }

  const token = mintInfoToken();

  const { data: created, error } = await supabase
    .from("parent_info_requests")
    .insert({
      family_id: gap.familyId,
      school_id: gap.schoolId,
      token_hash: hashInfoTokenHex(token),
      requested,
      created_by: actorUserId,
      sent_count: 0,
    })
    .select("id")
    .single();

  if (error) {
    // The partial unique index means "already has an open request" lands here.
    outcome.skipped.push({
      family: gap.familyName,
      reason: error.code === "23505" ? "Already has an open request" : error.message,
    });
    return;
  }

  outcome.created += 1;

  const message = renderInfoRequestEmail({
    schoolName: gap.schoolName,
    guardianName: gap.guardianName,
    requested,
    link: infoRequestLink(token),
    reminder: false,
  });

  const delivery = await sendTransactionalEmail({
    to: gap.email,
    subject: message.subject,
    body: message.html,
    text: message.text,
    kind: "system_notification",
  });

  if (!delivery.success) {
    // The request stays open with sent_count 0, so the reminder pass retries it
    // rather than the family silently never hearing from us.
    outcome.failed.push({
      family: gap.familyName,
      reason: delivery.error ?? `Email provider: ${delivery.provider}`,
    });
    return;
  }

  await supabase
    .from("parent_info_requests")
    .update({ sent_count: 1, last_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", created.id);

  outcome.sent += 1;
}

export async function requestMissingInfo(
  supabase: Client,
  gaps: FamilyGap[],
  actorUserId: string | null
): Promise<InfoRequestOutcome> {
  const outcome: InfoRequestOutcome = { created: 0, sent: 0, skipped: [], failed: [] };
  for (const gap of gaps) {
    await createAndSend(supabase, gap, actorUserId, outcome);
  }
  return outcome;
}

/**
 * The weekly pass: chase anything still open, and retire anything past its date
 * or past its fourth attempt.
 *
 * Runs from the queue worker, so it needs no session — it is handed whatever
 * client the caller has.
 */
export async function processDueInfoRequests(
  supabase: Client
): Promise<{ reminded: number; expired: number; exhausted: number; failed: number }> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - REMINDER_INTERVAL_DAYS * 86_400_000).toISOString();

  const { data: expiredRows } = await supabase
    .from("parent_info_requests")
    .update({ status: "expired", updated_at: now.toISOString() })
    .eq("status", "open")
    .lte("expires_at", now.toISOString())
    .select("id");

  const { data: due, error } = await supabase
    .from("parent_info_requests")
    .select(
      "id, family_id, school_id, requested, sent_count, max_sends, last_sent_at, schools(name), families(family_name, billing_email, guardians(first_name, last_name, email, is_primary))"
    )
    .eq("status", "open")
    .or(`last_sent_at.is.null,last_sent_at.lte.${cutoff}`)
    .limit(100);

  if (error) throw new Error(`Reminder pass failed — ${error.message}`);

  let reminded = 0;
  let exhausted = 0;
  let failed = 0;

  for (const row of (due ?? []) as Record<string, any>[]) {
    if (Number(row.sent_count ?? 0) >= Number(row.max_sends ?? 4)) {
      await supabase
        .from("parent_info_requests")
        .update({ status: "cancelled", updated_at: now.toISOString() })
        .eq("id", row.id);
      exhausted += 1;
      continue;
    }

    const family = row.families as Record<string, any> | null;
    const guardians = Array.isArray(family?.guardians) ? family!.guardians : [];
    const guardian =
      guardians.find((g: Record<string, any>) => g.is_primary === true) ?? guardians[0];
    const to =
      (typeof guardian?.email === "string" && guardian.email.trim()) ||
      (typeof family?.billing_email === "string" && family.billing_email.trim()) ||
      null;

    if (!to) {
      failed += 1;
      continue;
    }

    // Each reminder carries a NEW token, and the previous one stops working.
    //
    // Only the digest is stored, so the original link cannot be rebuilt here --
    // that is the whole point of storing a digest. The alternatives were keeping
    // the plaintext (which throws away the protection) or encrypting it (a key
    // to manage for no real gain). Rotating means the most recent email is
    // always the live one, which is the email a parent opens anyway, and it
    // shortens the life of any link sitting in an old inbox.
    //
    // The reminder says so, so nobody is left wondering why last week's link
    // now refuses them.
    const token = mintInfoToken();
    const { error: rotateError } = await supabase
      .from("parent_info_requests")
      .update({ token_hash: hashInfoTokenHex(token), updated_at: now.toISOString() })
      .eq("id", row.id);
    if (rotateError) {
      failed += 1;
      continue;
    }

    const message = renderInfoRequestEmail({
      schoolName: (row.schools as Record<string, any> | null)?.name ?? "The Academy",
      guardianName:
        [guardian?.first_name, guardian?.last_name].filter(Boolean).join(" ") || null,
      requested: row.requested as RequestedFields,
      link: infoRequestLink(token),
      reminder: true,
    });

    const delivery = await sendTransactionalEmail({
      to,
      subject: message.subject,
      body: message.html,
      text: message.text,
      kind: "system_notification",
    });

    if (!delivery.success) {
      failed += 1;
      continue;
    }

    await supabase
      .from("parent_info_requests")
      .update({
        sent_count: Number(row.sent_count ?? 0) + 1,
        last_sent_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", row.id);
    reminded += 1;
  }

  return { reminded, expired: (expiredRows ?? []).length, exhausted, failed };
}
