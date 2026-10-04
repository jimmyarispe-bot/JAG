/**
 * Who at the network, rather than the campus, hears about a decision.
 *
 * `school_admissions_contacts` answers "who at this campus should be told",
 * and that is the right question for almost everything - a new inquiry at
 * Virtual is Heather's business, not the founder's. Acceptance is different.
 * Jimmy, 24 September 2026:
 *
 *   "Jimmy Arispe should be notified in the jag and by email that a student
 *    has been accepted and that begins the business process of schedule of
 *    tuition payments, contract, setting up the parents payment processing,
 *    and the initial deposit."
 *
 * Acceptance is the moment admissions hands a family to the business office,
 * and that handover is network-level by definition. He was already a contact
 * on The Academy FL and on no other campus, so three of the four campuses
 * could accept a student without him hearing anything.
 *
 * ONE EVENT, LISTED EXPLICITLY. Adding him to every campus's contact row would
 * have worked and would also have sent him every new inquiry, every document
 * upload and every funding alert at four schools. The list below is the whole
 * mechanism: an event is either on it or it is not.
 */

import type { CommunicationTriggerEvent } from "@/lib/admissions/communications/types";

/**
 * Overridable so the address is not a code change, with a real default so an
 * unset variable does not mean silence. A notification that quietly goes
 * nowhere is the failure this codebase keeps producing; an address that is
 * merely out of date is visible the first time somebody reads their mail.
 *
 * THE DEFAULT WAS A PERSONAL GMAIL UNTIL 28 SEPTEMBER 2026, and that reasoning
 * above is exactly how it got there: I wanted a real fallback rather than
 * silence, and used the address I had. ADMISSIONS_NETWORK_OFFICE_EMAIL was
 * never set, so the fallback is what ran. Two acceptances went out on it -
 * Jayden Roy at GA on the 25th and Rashard Salinding at Virtual on the 28th -
 * each carrying a child's name, their campus, their parent's name and email,
 * and a live link to the record, into a mailbox Google controls and the
 * network does not.
 *
 * "A real default rather than silence" was the right instinct. A default that
 * leaves the network was not. The test beside this file now refuses any
 * address outside the network's own domains, so the next person reaching for
 * a convenient fallback is stopped by the suite rather than by somebody
 * noticing which of their inboxes a child's details arrived in.
 */
export const NETWORK_OFFICE_EMAIL =
  process.env.ADMISSIONS_NETWORK_OFFICE_EMAIL?.trim() || "jimmy.arispe@theacademyway.org";

/** Events the network office is told about in addition to the campus. */
const NETWORK_OFFICE_EVENTS: ReadonlySet<string> = new Set<CommunicationTriggerEvent>([
  "staff_application_accepted",
]);

export function notifiesNetworkOffice(event: CommunicationTriggerEvent): boolean {
  return NETWORK_OFFICE_EVENTS.has(event);
}

/**
 * The second address, and the one event that reaches it.
 *
 * Jimmy, 4 October 2026, on a campus sitting three days on an inquiry
 * nobody has contacted: "2 then tells me n danni".
 *
 * This is a DIFFERENT QUESTION from the network office above. Acceptance is
 * told to the network because it hands a family to the business office.
 * This one is told to two named people because a campus has not done
 * something, and the point of it is that somebody outside that campus sees
 * it. Same domain rule, same env override, same refusal to default to a
 * mailbox the network does not control.
 */
export const NETWORK_SECOND_EMAIL =
  process.env.ADMISSIONS_NETWORK_SECOND_EMAIL?.trim() || "danni.treu@theacademyway.org";

/** Both people told when a campus has gone quiet on an inquiry. */
export const NETWORK_ESCALATION_EMAILS: readonly string[] = [
  NETWORK_OFFICE_EMAIL,
  NETWORK_SECOND_EMAIL,
];

/** Events that reach the pair rather than the single network address. */
const NETWORK_ESCALATION_EVENTS: ReadonlySet<string> = new Set<CommunicationTriggerEvent>([
  "staff_interest_link_escalation",
]);

export function notifiesNetworkEscalation(event: CommunicationTriggerEvent): boolean {
  return NETWORK_ESCALATION_EVENTS.has(event);
}

/**
 * The campus list with whoever the event adds, de-duplicated and never
 * reordered, so a campus that already lists someone gets one copy not two.
 */
export function withNetworkOffice(
  event: CommunicationTriggerEvent,
  campusEmails: readonly string[]
): readonly string[] {
  const extra: readonly string[] = notifiesNetworkEscalation(event)
    ? NETWORK_ESCALATION_EMAILS
    : notifiesNetworkOffice(event)
      ? [NETWORK_OFFICE_EMAIL]
      : [];
  if (!extra.length) return campusEmails;

  const seen = new Set(campusEmails.map((email) => email.trim().toLowerCase()));
  const out = [...campusEmails];
  for (const email of extra) {
    const key = email.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(email);
  }
  return out;
}
