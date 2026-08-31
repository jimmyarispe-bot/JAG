/**
 * Client-safe shape and validation for a school's admissions contact.
 *
 * Split from `school-contacts.ts` because that module reaches the database
 * through next/headers and cannot be bundled into the browser — the same split
 * the People directory needed, and the same build failure if it is skipped.
 *
 * The validation lives here so the editor can refuse a bad value before a round
 * trip, and the server calls the identical function so a hand-crafted request
 * cannot get past it.
 */

export interface SchoolContactPatch {
  contactName: string | null;
  contactEmail: string | null;
  bookingUrl: string | null;
  publicInquiries: boolean;
}

export interface ContactIssue {
  readonly field: keyof SchoolContactPatch;
  readonly message: string;
}

/** Deliberately loose — an address is validated by mail arriving, not by regex. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSchoolContact(patch: SchoolContactPatch): ContactIssue[] {
  const issues: ContactIssue[] = [];

  if (patch.contactEmail && !EMAIL.test(patch.contactEmail)) {
    issues.push({ field: "contactEmail", message: "That does not look like an email address." });
  }

  if (patch.bookingUrl) {
    // https only, matching the CHECK on the column. A booking "URL" that is not
    // a URL gets mailed to a parent verbatim.
    if (!/^https:\/\//i.test(patch.bookingUrl)) {
      issues.push({
        field: "bookingUrl",
        message: "The booking link must start with https:// — paste the whole link from Google Calendar.",
      });
    } else {
      try {
        new URL(patch.bookingUrl);
      } catch {
        issues.push({ field: "bookingUrl", message: "That link could not be read as a URL." });
      }
    }
  }

  // Not an error, but the combination that quietly does nothing: a school
  // taking public inquiries with nobody to send them to.
  if (patch.publicInquiries && !patch.contactEmail) {
    issues.push({
      field: "contactEmail",
      message:
        "This school accepts public inquiries. Without an email address nobody is told when one arrives.",
    });
  }

  return issues;
}

/**
 * What a family will actually experience, given what is filled in. Shown in the
 * editor so the consequence of a blank field is visible before it is saved
 * rather than discovered by a parent.
 */
export function describeOutcome(patch: SchoolContactPatch): string {
  if (!patch.publicInquiries) {
    return "Hidden from the public inquiry form — families cannot choose this school.";
  }
  if (patch.bookingUrl && patch.contactEmail) {
    return "Families get the booking link and a reply-to address; the leader is emailed each inquiry.";
  }
  if (!patch.bookingUrl && patch.contactEmail) {
    return "No booking link, so families are told someone will be in touch. The leader is still emailed.";
  }
  if (patch.bookingUrl && !patch.contactEmail) {
    return "Families get the booking link, but nobody is told an inquiry arrived.";
  }
  return "Families are told someone will be in touch, and nobody is told an inquiry arrived.";
}
