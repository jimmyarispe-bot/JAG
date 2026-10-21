/**
 * The letter a prospective parent actually receives.
 *
 * WHAT IT REPLACES. The first version of this used `sendInvitationEmail`, which
 * is staff onboarding copy: "Hi Lana Robinson, You've been invited to join The
 * Academy Way." A mother who spent an hour talking about her daughter was being
 * invited to join an organisation, with no mention of Savannah, no reference to
 * the conversation, and no explanation of what sat behind the link. It read like
 * an internal account invite because that is exactly what it was.
 *
 * WORDING. Supplied by Jimmy, 12 September 2026, and reproduced as given. Where
 * he wrote "(child's name)" and "(school leader's name)" those become the real
 * names, and the two CLICK phrases become the activation link — he wrote the
 * link twice, once in the middle and once at the end, which is right for a
 * letter somebody reads on a phone.
 *
 * HOW THE BODY IS RENDERED, and the mistake that cost a day.
 *
 * The first version of this function returned plain text with blank lines
 * between paragraphs, on the belief that the sender turned newlines into <br>.
 * It does not. From providers/resend.ts:
 *
 *     function asHtml(body: string): string {
 *       if (/<[a-z][\s\S]*>/i.test(body)) return body;   // <-- ours
 *       return body.replace(/\n/g, "<br>");
 *     }
 *
 * A body containing any tag is returned untouched, and this letter contains
 * anchors. In HTML a bare newline is whitespace, so every paragraph break
 * silently collapsed and the family received one run-on block of text.
 *
 * So the layout is built here, explicitly, as <p> elements. Not by fixing
 * asHtml — every other email in the product is built on its current behaviour,
 * and widening a shared helper to fix one letter is how you break five others.
 *
 * Styles are inline because email clients discard <style> blocks. Everything
 * interpolated is a name from our own database or a link we just generated — no
 * free text from a form reaches this body.
 *
 * WHOSE NAME SIGNS IT. The campus admissions contact, from
 * `schools.admissions_contact_name` — the same person whose booking link the
 * thank-you email carries, so a family sees one name throughout rather than
 * meeting somebody new at every step. Without one it signs "The Admissions
 * Team", which is honest rather than inventing a person.
 */

export const PROSPECT_INVITE_SUBJECT = "Submit your application - The Academy";

/**
 * Where a parent lands once their password is set.
 *
 * The letter promises the admissions application, so the link has to finish
 * there. `/apply/portal` lists the enquiries matching their email address and
 * offers Start Application on each — which is the screen the letter is
 * describing. Without this the activation flow defaults to `/dashboard`, a
 * route PARENT accounts cannot open.
 */
export const PROSPECT_PORTAL_PATH = "/apply/portal";

/**
 * Inline, because email clients strip <style> blocks. A readable measure and a
 * generous line height, because a parent reads this on a phone.
 */
const LETTER_STYLE = [
  "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
  "font-size:16px",
  "line-height:1.6",
  "color:#1e293b",
  "max-width:600px",
].join(";");

/** The paragraph gap itself — the thing that was silently collapsing. */
const PARAGRAPH_STYLE = "margin:0 0 16px";

/** Named explicitly: some clients render an unstyled anchor in body colour. */
const LINK_STYLE = "color:#1d4ed8;text-decoration:underline";

/** Belt and braces: a name from the database should never carry markup. */
function safe(value: string): string {
  return value.replace(/[<>]/g, "").trim();
}

export function buildProspectInviteBody(input: {
  /**
   * The parent's own first name, for the greeting. A letter that opens
   * "Thank you for spending time with us" with no name in front of it reads
   * like a circular. Omitted when we do not have a real one — better no
   * greeting than "Parent/Guardian,".
   */
  parentName?: string;
  /** The child this family enquired about. Their first name, as the parent wrote it. */
  childName: string;
  /** Who signs the letter. */
  signatory: string;
  /**
   * The campus, under the signatory. A family enquiring at one campus of a
   * four-campus network should be able to tell from the letter which one wrote
   * to them. Omitted when we do not have it, rather than printing a blank line.
   */
  schoolName?: string;
  /** The activation link. Appears twice, deliberately. */
  inviteLink: string;
}): string {
  const child = safe(input.childName) || "your child";
  const signedBy = safe(input.signatory) || "The Admissions Team";
  const campus = safe(input.schoolName ?? "");
  const link = input.inviteLink;

  const anchor = (text: string) =>
    `<a href="${link}" style="${LINK_STYLE}">${text}</a>`;

  const createAccount = anchor(
    "CLICK ON THIS LINK TO CREATE AN ACCOUNT IN OUR EDUCATIONAL PLATFORM, THE JAG"
  );
  const completeApplication = anchor(
    "CLICK THIS LINK TO CREATE YOUR JAG ACCOUNT AND COMPLETE YOUR ADMISSIONS APPLICATION"
  );

  const paragraph = (html: string) => `  <p style="${PARAGRAPH_STYLE}">${html}</p>`;

  /**
   * "Parent/Guardian" is the placeholder the invite code falls back to when a
   * guardian row has no first name. It is fine as a label in a staff list and
   * wrong as the way to address somebody, so the greeting is dropped instead.
   */
  const parent = safe(input.parentName ?? "");
  const greeting =
    parent && parent.toLowerCase() !== "parent/guardian" ? [paragraph(`${parent},`)] : [];

  return [
    `<div style="${LETTER_STYLE}">`,
    ...greeting,
    paragraph(
      `Thank you for spending time with us so we could learn about ${child}'s educational needs. As I'm sure you now realize, our school is a joyful, supportive, and positive learning environment where we focus on our students experiencing success and helping them identify their individual GREATNESS.`
    ),
    paragraph(
      `The next step in this process is for you to complete an Admissions Application. You will need to ${createAccount}. In the application, you will be able to upload documents, submit scholarship information, and provide more details about ${child}'s strengths and challenges.`
    ),
    paragraph(
      `Should you need anything at all during this process, please don't hesitate to reach out to me. Once we review ${child}'s application, you will receive a notice to schedule your shadow day(s). Now please ${completeApplication}.`
    ),
    // The sign-off is one paragraph: "Sincerely,", the person, and the campus
    // belong together, separated by line breaks rather than paragraph gaps.
    paragraph(`Sincerely,<br>${signedBy}${campus ? `<br>${campus}` : ""}`),
    `</div>`,
  ].join("\n");
}

/**
 * THE CONTRACT INVITATION - 18 October 2026.
 *
 * Sent from Finalizing Contract when Jimmy presses Send contract. The parent
 * creates a JAG account and lands on /contract, which is the only page a
 * parent account can open (Jimmy: "parents should only get access to this
 * related information when/if they receive a login to the jag").
 *
 * DRAFT WORDING, written by Claude, shown to Jimmy in the Send contract
 * confirmation before any family receives it. Signed by Jimmy, who signs the
 * contract for the school.
 */
export const CONTRACT_INVITE_PATH = "/contract";

export function contractInviteSubject(childName: string): string {
  const child = safe(childName) || "your child";
  return `${child}'s Enrollment and Tuition Contract - The Academy`;
}

/**
 * THE TUITION, IN THE EMAIL ITSELF. Jimmy, 20 October 2026: "i am assuming if
 * they had a payment due now that once i finalized it the parent would
 * automatically get an email with all the tuition information" - tapped: with
 * the contract. The same figures the contract prints; nothing recomputed.
 */
export function buildTuitionSummaryHtml(f: {
  annual_tuition: number;
  billing_basis: number;
  proration_label: string | null;
  scholarship_total: number;
  remaining_due: number;
  monthly_amount: number | null;
  instalments: readonly { label: string; dueDate: string | null; amount: number }[];
}): string {
  const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  const day = (d: string | null) =>
    d ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Due upon signing";
  const row = (a: string, b: string) =>
    `<tr><td style="padding:4px 12px 4px 0">${a}</td><td style="padding:4px 0;text-align:right">${b}</td></tr>`;
  const lines = [
    row("Tuition", usd(f.annual_tuition)),
    ...(f.proration_label ? [row(`Prorated (${safe(f.proration_label)})`, usd(f.billing_basis))] : []),
    ...(f.scholarship_total > 0 ? [row("Scholarships", `−${usd(f.scholarship_total)}`)] : []),
    row("<strong>You owe</strong>", `<strong>${usd(f.remaining_due)}</strong>`),
  ];
  const schedule = f.instalments
    .filter((i) => i.amount > 0)
    .map((i) => row(`${safe(i.label)} · ${day(i.dueDate)}`, usd(i.amount)));
  return [
    `<table style="border-collapse:collapse;font-size:15px">${lines.join("")}</table>`,
    schedule.length
      ? `<p style="${PARAGRAPH_STYLE}"><strong>Schedule of Tuition Payments</strong></p><table style="border-collapse:collapse;font-size:15px">${schedule.join("")}</table>`
      : f.monthly_amount
        ? `<p style="${PARAGRAPH_STYLE}">Monthly tuition: <strong>${usd(f.monthly_amount)}</strong></p>`
        : "",
  ].join("\n");
}

export function buildContractInviteBody(input: {
  parentName?: string;
  childName: string;
  schoolName?: string;
  inviteLink: string;
  /** The family's figures, from buildTuitionSummaryHtml. */
  tuitionSummaryHtml?: string;
}): string {
  const child = safe(input.childName) || "your child";
  const campus = safe(input.schoolName ?? "") || "The Academy";
  const link = input.inviteLink;
  const paragraph = (html: string) => `  <p style="${PARAGRAPH_STYLE}">${html}</p>`;
  const parent = safe(input.parentName ?? "");
  const greeting =
    parent && parent.toLowerCase() !== "parent/guardian" ? [paragraph(`${parent},`)] : [];

  return [
    `<div style="${LETTER_STYLE}">`,
    ...greeting,
    paragraph(`Congratulations again on ${child}'s acceptance to ${campus}.`),
    paragraph(
      `${child}'s Enrollment and Tuition Contract is ready. It sets out your tuition, any scholarships, and your Schedule of Tuition Payments. Please read it, initial each part, and sign it.`
    ),
    ...(input.tuitionSummaryHtml ? [`  <div style="margin:0 0 16px">${input.tuitionSummaryHtml}</div>`] : []),
    paragraph(
      `<a href="${link}" style="${LINK_STYLE}">CLICK THIS LINK TO CREATE YOUR JAG ACCOUNT AND SIGN ${child.toUpperCase()}'S CONTRACT</a>`
    ),
    paragraph(
      `You can print or save a PDF copy of the contract at any time. Once it is signed, you will receive an invoice for your first tuition payment.`
    ),
    paragraph(`Sincerely,<br>Jimmy Arispe<br>${campus}`),
    `</div>`,
  ].join("\n");
}
