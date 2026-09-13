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
  /** The child this family enquired about. Their first name, as the parent wrote it. */
  childName: string;
  /** Who signs the letter. */
  signatory: string;
  /** The activation link. Appears twice, deliberately. */
  inviteLink: string;
}): string {
  const child = safe(input.childName) || "your child";
  const signedBy = safe(input.signatory) || "The Admissions Team";
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

  return [
    `<div style="${LETTER_STYLE}">`,
    paragraph(
      `Thank you for spending time with us so we could learn about ${child}'s educational needs. As I'm sure you now realize, our school is a joyful, supportive, and positive learning environment where we focus on our students experiencing success and helping them identify their individual GREATNESS.`
    ),
    paragraph(
      `The next step in this process is for you to complete an Admissions Application. You will need to ${createAccount}. In the application, you will be able to upload documents, submit scholarship information, and provide more details about ${child}'s strengths and challenges.`
    ),
    paragraph(
      `Should you need anything at all during this process, please don't hesitate to reach out to me. Once we review ${child}'s application, you will receive a notice to schedule your shadow day(s). Now please ${completeApplication}.`
    ),
    // The sign-off is one paragraph, not two: "Sincerely," and the name belong
    // together, separated by a line break rather than a paragraph gap.
    paragraph(`Sincerely,<br>${signedBy}`),
    `</div>`,
  ].join("\n");
}
