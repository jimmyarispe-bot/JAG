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
 */
export const NETWORK_OFFICE_EMAIL =
  process.env.ADMISSIONS_NETWORK_OFFICE_EMAIL?.trim() || "jimmy.arispe@gmail.com";

/** Events the network office is told about in addition to the campus. */
const NETWORK_OFFICE_EVENTS: ReadonlySet<string> = new Set<CommunicationTriggerEvent>([
  "staff_application_accepted",
]);

export function notifiesNetworkOffice(event: CommunicationTriggerEvent): boolean {
  return NETWORK_OFFICE_EVENTS.has(event);
}

/**
 * The campus list with the network office added, de-duplicated and never
 * reordered, so a campus that already lists him gets one copy rather than two.
 */
export function withNetworkOffice(
  event: CommunicationTriggerEvent,
  campusEmails: readonly string[]
): readonly string[] {
  if (!notifiesNetworkOffice(event)) return campusEmails;
  const seen = new Set(campusEmails.map((email) => email.trim().toLowerCase()));
  if (seen.has(NETWORK_OFFICE_EMAIL.toLowerCase())) return campusEmails;
  return [...campusEmails, NETWORK_OFFICE_EMAIL];
}
