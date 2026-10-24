import { isTestCampus } from "@/lib/admissions/test-campus";

/**
 * DANNI AND HEATHER ARE BLIND COPIED ON EVERY EMAIL A PARENT RECEIVES.
 *
 * Jimmy, 22 October 2026: "make sure danni and heather are getting blind
 * copied with every email that is a parent recieves at any time."
 *
 * Every campus, every letter, on top of the campus's own school leader copy
 * (schools.school_leader_bcc_email). This list is network-wide, not per
 * campus, which is why it lives here and not on the schools table.
 *
 * HOW A SEND OPTS IN. A call site that writes to a family passes
 * `toFamily: { schoolId }` on SendEmailParams; send.ts adds these addresses.
 * Staff notices, password resets and invitations do not pass it and are not
 * copied - a password reset link in two extra inboxes is a way into a
 * parent's account, not a copy of a letter.
 *
 * WHAT STILL WINS OVER IT:
 *  - divert.ts strips every bcc, so a diverted test reaches nobody here.
 *  - The test campus is never copied. There is no family there.
 *  - The money rule in communications/engine.ts
 *    (NOT_COPIED_TO_THE_SCHOOL_LEADER): "remember only danni n me see
 *    anything related to money". Those letters skip this copy too.
 */
export const FAMILY_MAIL_BCC: readonly string[] = [
  "danni.treu@theacademyfl.org",
  "heather.brown@theacademyway.org",
];

export function familyBccFor(schoolId: string | null | undefined): string[] {
  if (isTestCampus(schoolId)) return [];
  return [...FAMILY_MAIL_BCC];
}
