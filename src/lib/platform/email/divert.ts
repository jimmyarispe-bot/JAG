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
 * ONE CHOKEPOINT, NO EXCEPTIONS. sendTransactionalEmail is the only way mail
 * leaves this codebase - admissions letters, staff notices, password resets,
 * invitations, everything. A rule with an exception list is a rule somebody
 * will fall outside of, so there is no exception list. While this is on,
 * nothing at all reaches anybody but the diversion address.
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

/** Who everything goes to instead. Empty means the platform is live. */
export function emailDivertAddresses(): string[] {
  const raw = process.env.EMAIL_DIVERT_TO ?? "";
  return raw
    .split(",")
    .map((address) => address.trim())
    .filter((address) => LOOKS_LIKE_AN_ADDRESS.test(address));
}

export function emailIsDiverted(): boolean {
  return (process.env.EMAIL_DIVERT_TO ?? "").trim().length > 0;
}

function asList(to: string | string[]): string[] {
  return (Array.isArray(to) ? to : [to]).map((t) => t.trim()).filter(Boolean);
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
  };
}
