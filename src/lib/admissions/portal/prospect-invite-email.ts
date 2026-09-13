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
 * HOW THE BODY IS RENDERED. The transactional sender converts newlines to <br>
 * and escapes nothing, so an anchor works and a blank line between paragraphs
 * has to be exactly one newline pair. Everything interpolated here is a name
 * from our own database or a link we just generated — no free text from a form
 * reaches this body.
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

  const createAccount = `<a href="${link}">CLICK ON THIS LINK TO CREATE AN ACCOUNT IN OUR EDUCATIONAL PLATFORM, THE JAG</a>`;
  const completeApplication = `<a href="${link}">CLICK THIS LINK TO CREATE YOUR JAG ACCOUNT AND COMPLETE YOUR ADMISSIONS APPLICATION</a>`;

  return [
    `Thank you for spending time with us so we could learn about ${child}'s educational needs. As I'm sure you now realize, our school is a joyful, supportive, and positive learning environment where we focus on our students experiencing success and helping them identify their individual GREATNESS.`,
    "",
    `The next step in this process is for you to complete an Admissions Application. You will need to ${createAccount}. In the application, you will be able to upload documents, submit scholarship information, and provide more details about ${child}'s strengths and challenges.`,
    "",
    `Should you need anything at all during this process, please don't hesitate to reach out to me. Once we review ${child}'s application, you will receive a notice to schedule your shadow day(s). Now please ${completeApplication}.`,
    "",
    "Sincerely,",
    signedBy,
  ].join("\n");
}
