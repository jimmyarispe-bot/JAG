import type { SendEmailParams } from "@/lib/platform/email/types";

/*
 * NO `import "server-only"` HERE, AND IT IS NOT AN OVERSIGHT.
 *
 * It was there, and it broke the build in under two seconds:
 *
 *     Error: Cannot find module 'server-only'
 *     Require stack:
 *     - src/lib/platform/email/divert.ts
 *     - src/lib/platform/email/send.ts
 *       ... twelve more ...
 *     - src/lib/platform/diagnostics/validate-registry.ts
 *
 * `server-only` is not a dependency of this project. It is an alias Next
 * resolves inside its own bundler. The twenty-one validation gates that run
 * before `next build` run under tsx, outside Next, and the first of them
 * imports a chain fourteen modules deep that reaches the email module - so
 * the gate died before a line of the application was compiled.
 *
 * send.ts, the file this one sits beside and is only ever imported by, does
 * not have the import either. That was the hint.
 */

/**
 * Nothing reaches a parent.
 *
 * Jimmy, 3 October 2026: "i dont want anything going out to parents. how can
 * we just test the different parts of the process wo parents receiving
 * anything".
 *
 * WHY THIS RATHER THAN SWITCHING TEMPLATES OFF. A switched-off template is
 * not a test environment, it is an absence. You cannot watch a chase run, see
 * what a letter actually says, check that the merge fields resolved or prove
 * the queue fired, because nothing happens at all. And the protection is
 * per-template: the day somebody turns one on to try it, it is live to every
 * family at once.
 *
 * So instead: every single outbound email in the platform is REDIRECTED to one
 * address. The whole chain runs for real - the 11pm scan, the queue, the
 * business-hours timing, the merge fields, the Resend call, the row written to
 * admissions_communications - and the only difference is the envelope. The
 * letters land in Jimmy's inbox reading exactly as a family would have read
 * them, which is his standing rule anyway: he sees the exact words before they
 * ship.
 *
 * ONE CHOKEPOINT. sendTransactionalEmail is the only way mail leaves this
 * codebase - admissions letters, staff notices, password resets, invitations,
 * everything.
 *
 * THIS FILE USED TO SAY "NO EXCEPTIONS", in those words, and gave the reason:
 * a rule with an exception list is a rule somebody will fall outside of. That
 * reasoning still stands and the sentence was removed anyway, on 8 October
 * 2026, because it made one ordinary thing impossible.
 *
 * Leesa Davis was hired at The Academy Virtual. Her password-reset email was
 * diverted into Jimmy's inbox, as designed, so she could not sign in, so she
 * could not record her classes, her hours or her children. No staff member
 * can be onboarded at all while every outbound message is caught - and the
 * protection exists to shield FAMILIES, not to lock out the people who work
 * here.
 *
 *   EMAIL_DIVERT_EXCEPT=leesa.davis@theacademyvirtual.org
 *
 * THE EXCEPTION IS AS NARROW AS IT CAN BE MADE, because the warning it
 * replaces was right:
 *
 *   - EXACT ADDRESSES ONLY. No domains, no wildcards, no patterns. Allowing
 *     @theacademyway.org would be one typo away from allowing a parent whose
 *     address happens to end that way, and whole-domain rules are how these
 *     lists quietly become everybody.
 *
 *   - EVERY RECIPIENT MUST BE ON THE LIST, not just one. A staff notice
 *     addressed to a school leader AND a guardian is diverted exactly as
 *     before. This is the rule that matters: it is the only reason a family
 *     cannot be reached by riding along on somebody else's letter.
 *
 *   - THE REPLY-TO IS STILL REMOVED unless it is itself on the list. A staff
 *     notice sets reply-to to the GUARDIAN so a leader can answer without
 *     leaving her inbox. Let an excepted message keep that header and the
 *     first reply typed goes straight to a parent, by the one route nobody
 *     thinks to check.
 *
 * Empty or unset, nothing changes: everything is diverted, as before. The
 * list fails safe the same way the diversion does - an address that does not
 * parse is dropped from it, which diverts that mail rather than releasing it.
 *
 * AN ENVIRONMENT VARIABLE, AND DELIBERATELY NOT A DATABASE SETTING. A row in a
 * table can be flipped by anybody with a SQL editor and a tired evening.
 * Turning this protection OFF should require a deployment - a decision with a
 * commit behind it. Turning it ON is the safe direction and is also a
 * deployment, which is the right price for a thing this absolute.
 *
 * IT FAILS SAFE. An unparseable or half-typed value is still a value: the
 * addresses that survive validation get the mail, and if none do, the send is
 * refused outright rather than falling through to the family. There is no path
 * through this file where a malformed setting results in a parent being
 * emailed.
 *
 *   EMAIL_DIVERT_TO=jimmy.arispe@theacademyway.org
 *
 * Unset it, redeploy, and the platform is live again.
 */

const LOOKS_LIKE_AN_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asList(to: string | string[]): string[] {
  return (Array.isArray(to) ? to : [to]).map((t) => t.trim()).filter(Boolean);
}

/** Who everything goes to instead. Empty means the platform is live. */
export function emailDivertAddresses(): string[] {
  const raw = process.env.EMAIL_DIVERT_TO ?? "";
  return raw
    .split(",")
    .map((address) => address.trim())
    .filter((address) => LOOKS_LIKE_AN_ADDRESS.test(address));
}

/**
 * Addresses that may be written to while the diversion is on.
 *
 * Lower-cased on the way in so that a capitalised entry in Vercel still
 * matches - every other address in this build is compared case-sensitively
 * somewhere, and the HR roll already holds Cassandra.Manghun@... beside
 * cassandra.manghum@... Case is not a thing to be strict about here.
 */
export function emailDivertExceptions(): string[] {
  const raw = process.env.EMAIL_DIVERT_EXCEPT ?? "";
  return raw
    .split(",")
    .map((address) => address.trim().toLowerCase())
    .filter((address) => LOOKS_LIKE_AN_ADDRESS.test(address));
}

/**
 * May this message be delivered as addressed?
 *
 * EVERY recipient must be on the list. One address off it and the whole
 * message is diverted, which is what stops a family being reached as the
 * second name on a staff notice.
 *
 * A message addressed to nobody is never excepted: an empty list of
 * recipients would otherwise satisfy `every` and pass straight through.
 */
export function everyRecipientIsExcepted(to: string | string[]): boolean {
  const allowed = emailDivertExceptions();
  if (!allowed.length) return false;
  const recipients = asList(to);
  if (!recipients.length) return false;
  return recipients.every((address) =>
    allowed.includes(address.toLowerCase())
  );
}

export function emailIsDiverted(): boolean {
  return (process.env.EMAIL_DIVERT_TO ?? "").trim().length > 0;
}

/**
 * Rewrite one email so it cannot reach the person it was addressed to.
 *
 * THE REPLY-TO IS REMOVED, and that is not tidiness. A staff notice sets
 * reply-to to the GUARDIAN's address, so that a school leader can answer a
 * family without leaving her inbox. Divert the message and leave that header
 * on, and the first reply typed in a test goes straight to a parent - the
 * exact thing this file exists to prevent, arriving by the one route nobody
 * would think to check.
 */
export function divertEmail(params: SendEmailParams): SendEmailParams | null {
  const inbox = emailDivertAddresses();
  if (!inbox.length) return null;

  /*
   * THE EXCEPTION, AND WHY IT RETURNS PARAMS RATHER THAN null.
   *
   * send.ts reads null as "EMAIL_DIVERT_TO is set but unreadable" and
   * REFUSES TO SEND. Returning null for an allowed recipient would therefore
   * not deliver her mail, it would silently throw it away and log a
   * malformed-setting error that is not true.
   */
  if (everyRecipientIsExcepted(params.to)) {
    const allowed = emailDivertExceptions();
    const replyTo =
      params.replyTo && allowed.includes(params.replyTo.trim().toLowerCase())
        ? params.replyTo
        : undefined;
    /*
     * THE BLIND COPY IS DROPPED EVEN HERE, where the recipient is allowed.
     * An excepted address is one person testing their own mail. The school
     * leader did not ask to be copied on a test, and a BCC she cannot see
     * coming is the one kind of mail nobody thinks to check.
     */
    return { ...params, replyTo, bcc: undefined };
  }

  const intended = asList(params.to);
  const wouldHaveGoneTo = intended.length ? intended.join(", ") : "(nobody)";

  const banner =
    `[ NOT SENT TO THE FAMILY ]\n` +
    `This is a diverted copy. The platform would have sent it to: ${wouldHaveGoneTo}\n` +
    `Kind: ${params.kind ?? "transactional"}\n` +
    `Reply-to was removed so a reply cannot reach them.\n` +
    `Unset EMAIL_DIVERT_TO in Vercel and redeploy to go live.\n` +
    `────────────────────────────────────────────────────────\n\n`;

  return {
    ...params,
    to: inbox,
    subject: `[→ ${wouldHaveGoneTo}] ${params.subject}`,
    body: banner + params.body,
    text: params.text ? banner + params.text : undefined,
    /* See the note above. Not optional. */
    replyTo: undefined,
    /*
     * AND THE BLIND COPY GOES WITH IT.
     *
     * Divert the message, leave the bcc on, and a test letter addressed to
     * nobody real still lands silently in Nina's inbox - from a run whose
     * entire purpose was that no outsider receives anything. She would have
     * no way to tell it from a real one, because that is what blind means.
     */
    bcc: undefined,
  };
}
