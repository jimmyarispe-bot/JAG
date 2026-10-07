import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTransactionalEmail } from "@/lib/platform/email/send";
import {
  STUDENT_QUESTIONNAIRE_SCHOOL_NAME,
  STUDENT_QUESTIONNAIRE_INTRO,
  STUDENT_QUESTIONS,
} from "@/lib/admissions/student-questionnaire/questions";

/**
 * Sending a high school applicant their own five questions.
 *
 * The token follows migration 230: 256 bits minted here, only the SHA-256
 * digest stored. The plaintext exists in the email and nowhere else, so a copy
 * of the database yields no working links.
 */

const MIN_TOKEN_CHARS = 16;

export function mintStudentToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Postgres bytea wants `\x…` hex over PostgREST. */
export function hashStudentTokenHex(token: string): string {
  const normalized = token.trim();
  if (normalized.length < MIN_TOKEN_CHARS) throw new Error("student_questionnaire_token_invalid");
  return `\\x${createHash("sha256").update(normalized, "utf8").digest("hex")}`;
}

function appUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://apply.theacademyway.org";
  return base.replace(/\/+$/, "");
}

export function studentQuestionnaireLink(token: string): string {
  return `${appUrl()}/student-questions/${encodeURIComponent(token)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * The message.
 *
 * Addressed to the student, not to their parent, and it lists the questions in
 * the body rather than only behind the link — somebody should be able to tell
 * from the email alone what is being asked and think about it before they start
 * typing.
 */
export function renderStudentQuestionnaireEmail(input: {
  studentFirstName: string;
  link: string;
}): { subject: string; html: string; text: string } {
  const { studentFirstName, link } = input;
  const schoolName = STUDENT_QUESTIONNAIRE_SCHOOL_NAME;
  const greeting = studentFirstName ? `Hi ${studentFirstName},` : "Hi,";
  const subject = `${schoolName}: five questions for you`;

  const questions = STUDENT_QUESTIONS.map((q) => q.label);
  const list = questions
    .map((q) => `<li style="margin:0 0 8px;">${escapeHtml(q)}</li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8fafc;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;padding:32px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
  <tr><td>
    <p style="margin:0 0 4px;font-size:13px;color:#64748b;">${escapeHtml(schoolName)}</p>
    <h1 style="margin:0 0 20px;font-size:20px;line-height:1.3;color:#0f172a;">Five questions, just for you</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#334155;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#334155;">Your family has started an application to ${escapeHtml(schoolName)}. This part is yours.</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#334155;">${escapeHtml(STUDENT_QUESTIONNAIRE_INTRO)}</p>
    <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.55;color:#0f172a;">${list}</ul>
    <p style="margin:0 0 28px;">
      <a href="${escapeHtml(link)}" style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:15px;font-weight:600;">Answer the questions</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#64748b;">If the button does not work, paste this into your browser:</p>
    <p style="margin:0 0 24px;font-size:13px;line-height:1.5;color:#475569;word-break:break-all;">${escapeHtml(link)}</p>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#94a3b8;">This link is just for you. Please do not forward it.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    greeting,
    "",
    `Your family has started an application to ${schoolName}. This part is yours.`,
    "",
    STUDENT_QUESTIONNAIRE_INTRO,
    "",
    ...questions.map((q, i) => `${i + 1}. ${q}`),
    "",
    "Answer them here:",
    link,
    "",
    "This link is just for you. Please do not forward it.",
  ].join("\n");

  return { subject, html, text };
}


/**
 * The parent's copy.
 *
 * Jimmy, 28 September 2026: the student email says "You will be copied into
 * the email we send your student", and the parent is copied.
 *
 * NOT A CC, AND THAT IS THE WHOLE DESIGN. The student's email carries a
 * one-time token link, and it ends by saying the link is theirs and not to
 * forward it. A true CC would hand that same link to the parent, who could
 * then answer the five questions as their child - which is the one thing this
 * questionnaire exists to prevent. So the parent gets their own message with
 * the same five questions, in the same words, and no link at all. They can see
 * exactly what was asked. They cannot answer it.
 *
 * A separate message rather than a cc field also means the link cannot reach
 * them by accident later: there is no address on the student's email but the
 * student's.
 */
export function renderParentQuestionnaireCopyEmail(input: {
  studentFirstName: string;
  studentEmail: string;
}): { subject: string; html: string; text: string } {
  const { studentFirstName, studentEmail } = input;
  const schoolName = STUDENT_QUESTIONNAIRE_SCHOOL_NAME;
  // Always the child's name, never a pronoun.
  const child = studentFirstName.trim() || "your student";
  const subject = `${schoolName}: the five questions we sent ${child}`;

  const questions = STUDENT_QUESTIONS.map((q) => q.label);
  const list = questions
    .map((q) => `<li style="margin:0 0 8px;">${escapeHtml(q)}</li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8fafc;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;padding:32px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
  <tr><td>
    <p style="margin:0 0 4px;font-size:13px;color:#64748b;">${escapeHtml(schoolName)}</p>
    <h1 style="margin:0 0 20px;font-size:20px;line-height:1.3;color:#0f172a;">Your copy of ${escapeHtml(child)}'s questions</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#334155;">We have emailed ${escapeHtml(child)} at ${escapeHtml(studentEmail)} with five questions to answer. This is your copy, so you can see what was asked.</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#334155;">${escapeHtml(STUDENT_QUESTIONNAIRE_INTRO)}</p>
    <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.55;color:#0f172a;">${list}</ul>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#334155;">The link to answer is in ${escapeHtml(child)}'s email and not in this one. We are asking for ${escapeHtml(child)}'s own words, so please let ${escapeHtml(child)} answer them.</p>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#94a3b8;">If ${escapeHtml(child)} did not receive the email, check the spam folder and then contact the school office.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    `We have emailed ${child} at ${studentEmail} with five questions to answer.`,
    "This is your copy, so you can see what was asked.",
    "",
    STUDENT_QUESTIONNAIRE_INTRO,
    "",
    ...questions.map((q, i) => `${i + 1}. ${q}`),
    "",
    `The link to answer is in ${child}'s email and not in this one. We are asking`,
    `for ${child}'s own words, so please let ${child} answer them.`,
    "",
    `If ${child} did not receive the email, check the spam folder and then contact`,
    "the school office.",
  ].join("\n");

  return { subject, html, text };
}

/**
 * Create the link and send it.
 *
 * Returns a result rather than throwing. This runs immediately after a family
 * has successfully submitted an inquiry, and a mail failure must not tell them
 * their inquiry failed — the lead is already saved, and a questionnaire that
 * never arrived is a thing for staff to resend, not a reason to lose the family.
 *
 * Any earlier live link for this lead is cancelled first. The partial unique
 * index allows only one row in `sent` per lead, and a second working link would
 * make "did they answer?" unanswerable.
 */
/**
 * WRITE THE LETTER DOWN WHERE EVERYTHING ELSE LOOKS FOR IT.
 *
 * Until 7 October this feature recorded only the REQUEST - a row in
 * admissions_student_questionnaires carrying a lead, an address and a token -
 * and never the MESSAGE. admissions_communications is what the audits, the
 * case file and every "what has this family actually received" query read, so
 * two real families on 29 September had been emailed by a school that, as far
 * as its own records went, had never written to them.
 *
 * NO template_key, AND THAT IS WHAT MAKES THIS SAFE. There is no template -
 * these questions are rendered in code. Every reader of this table filters on
 * template_key: getTemplatesForTrigger de-duplicates by it, parent-reminders
 * matches `.in("template_key", [...])`, send-interest-link looks for
 * inquiry_thank_you_email. A null matches none of them, so these rows become
 * visible to an audit without becoming visible to the chase.
 *
 * The manual-send path in communications/actions.ts has written rows this way
 * - trigger_event "manual", no template_key - since it was built. This is the
 * same shape, and it is proven.
 *
 * A failed write is logged and swallowed. The family has the email either way,
 * and losing the questionnaire because the bookkeeping failed would be the
 * worse trade.
 */
async function recordQuestionnaireEmail(
  admin: SupabaseClient,
  row: {
    leadId: string;
    sentTo: string;
    subject: string;
    body: string;
    triggerEvent: string;
    delivered: boolean;
  }
): Promise<void> {
  const { error } = await admin
    .from("admissions_communications" as never)
    .insert({
      lead_id: row.leadId,
      communication_type: "email",
      subject: row.subject,
      body: row.body,
      sent_to: row.sentTo,
      trigger_event: row.triggerEvent,
      delivery_status: row.delivered ? "sent" : "failed",
      open_status: "unknown",
      is_staff_notification: false,
    } as never);

  if (error) {
    console.error("[student-questionnaire] not recorded:", error.message, row.triggerEvent);
  }
}

export async function sendStudentQuestionnaire(
  admin: SupabaseClient,
  input: {
    leadId: string;
    studentEmail: string;
    studentFirstName: string;
    /** The parent's address, copied on what was asked. Optional: an inquiry
     *  without one still sends the student their questions. */
    guardianEmail?: string | null;
  }
): Promise<{ ok: true; questionnaireId: string } | { ok: false; error: string }> {
  const email = input.studentEmail.trim();
  if (!email) return { ok: false, error: "No student email address." };

  const { error: cancelError } = await admin
    .from("admissions_student_questionnaires" as never)
    .update({ status: "cancelled" } as never)
    .eq("lead_id", input.leadId)
    .eq("status", "sent");

  if (cancelError) return { ok: false, error: cancelError.message };

  const token = mintStudentToken();

  const { data, error } = await admin
    .from("admissions_student_questionnaires" as never)
    .insert({
      lead_id: input.leadId,
      student_email: email,
      token_hash: hashStudentTokenHex(token),
      status: "sent",
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create the questionnaire." };
  }

  const message = renderStudentQuestionnaireEmail({
    studentFirstName: input.studentFirstName,
    link: studentQuestionnaireLink(token),
  });

  const delivery = await sendTransactionalEmail({
    to: email,
    subject: message.subject,
    body: message.html,
    text: message.text,
    kind: "transactional",
  });

  await recordQuestionnaireEmail(admin, {
    leadId: input.leadId,
    sentTo: email,
    subject: message.subject,
    body: message.text,
    triggerEvent: "student_questionnaire_sent",
    delivered: delivery.success,
  });

  if (!delivery.success) {
    // The row stays. A link that was minted but not delivered is exactly what
    // "resend" is for, and deleting it would hide that this ever happened.
    return { ok: false, error: delivery.error ?? "Email provider rejected the message." };
  }

  /**
   * The parent's copy is sent after the student's, and its failure is not the
   * student's problem.
   *
   * The student has their questions; that is the thing that had to happen. A
   * bounced parent copy must not report the whole send as failed, because the
   * caller's only recovery is to resend - which would cancel the student's
   * live token and mint a new one, breaking a link that was delivered and may
   * already be open.
   *
   * Skipped when the two addresses match, which happens when a family puts the
   * parent's address in the student field. One email, not two identical ones.
   */
  const guardian = input.guardianEmail?.trim() ?? "";
  if (guardian && guardian.toLowerCase() !== email.toLowerCase()) {
    const parentCopy = renderParentQuestionnaireCopyEmail({
      studentFirstName: input.studentFirstName,
      studentEmail: email,
    });
    const copyDelivery = await sendTransactionalEmail({
      to: guardian,
      subject: parentCopy.subject,
      body: parentCopy.html,
      text: parentCopy.text,
      kind: "transactional",
    });

    /* The parent's copy is a second letter to the family and is recorded as
     * one. It was the half of this that showed up in Resend with nothing
     * behind it. */
    await recordQuestionnaireEmail(admin, {
      leadId: input.leadId,
      sentTo: guardian,
      subject: parentCopy.subject,
      body: parentCopy.text,
      triggerEvent: "student_questionnaire_parent_copy",
      delivered: copyDelivery.success,
    });
  }

  return { ok: true, questionnaireId: (data as { id: string }).id };
}
