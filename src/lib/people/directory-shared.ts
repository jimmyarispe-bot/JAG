/**
 * Client-safe types and category logic for the People directory.
 *
 * Split from `directory.ts` because that module imports the Supabase server
 * client, which reaches for next/headers and cannot be bundled into the
 * browser. The table component needs the categories and their labels, so they
 * live here where both sides can import them.
 */

export type PersonKind = "student" | "prospect";

export type ContactSource = "guardian" | "family" | "lead" | "none";

export const CONTACT_SOURCE_LABELS: Record<ContactSource, string> = {
  guardian: "Guardian record",
  family: "Family billing contact — no guardian record",
  lead: "From the admissions enquiry — not yet on the family record",
  none: "No contact on file",
};

/**
 * Coarse buckets that mean the same thing whichever table a row came from.
 * The precise status is kept alongside for anyone who needs it.
 */
export type PersonGroup =
  | "enrolled"
  | "pipeline"
  | "accepted"
  | "alumni"
  | "not_enrolled"
  | "other";

export interface DirectoryPerson {
  readonly id: string;
  readonly kind: PersonKind;
  readonly firstName: string;
  readonly lastName: string;
  /** The billing entity — where the money lands. Not necessarily where the
      child sits. */
  readonly school: string;
  /** Needed to move someone between schools; the name alone is not an id. */
  readonly schoolId: string | null;
  /**
   * Where the child actually attends, joined when there is more than one.
   * Null when no enrolment row exists, in which case the school stands in.
   */
  readonly programs: string | null;
  readonly grade: string | null;
  readonly program: string | null;
  /** Raw status from the source table: enrollment_status or lead_stage. */
  readonly status: string;
  /** Human label — pipeline stage name for prospects, status for students. */
  readonly statusLabel: string;
  /** Category shown — the override when one exists, otherwise the derived value. */
  readonly group: PersonGroup;
  /** What the data implies, ignoring any override. */
  readonly derivedGroup: PersonGroup;
  /** True when a human has deliberately set this person's category. */
  readonly overridden: boolean;
  readonly guardianName: string | null;
  readonly guardianEmail: string | null;
  readonly guardianPhone: string | null;
  /**
   * Where the contact above came from, so a thin fallback is never mistaken for
   * a real parent record:
   *   guardian — a guardians row, the proper place for it
   *   family   — the family's billing email/phone, no guardian row exists
   *   lead     — the child's own admissions lead
   *   none     — nothing on file
   */
  readonly contactSource: ContactSource;
  readonly dateOfBirth: string | null;
  readonly createdAt: string | null;
  /** Archived records stay in the list behind a filter rather than vanishing. */
  readonly archived: boolean;
  /** Where to go when the row is clicked. */
  readonly href: string;
}

/**
 * Students carry an enrollment status; leads carry a pipeline stage.
 *
 * Withdrawn, graduated and not-returning all derive to "other" rather than
 * "alumni". Those three statuses were assigned by a migration from a legacy CRM
 * and have not been reviewed, so parking them together keeps an unverified
 * guess from reading as a fact. "alumni" remains available as a category a
 * human can assign deliberately, one person at a time.
 */
export function groupForStudent(status: string): PersonGroup {
  if (status === "enrolled") return "enrolled";
  if (status === "pending" || status === "waitlisted") return "pipeline";
  // graduated | withdrawn | anything unrecognised
  return "other";
}

export function groupForLead(stage: string): PersonGroup {
  if (stage === "enrolled") return "enrolled";
  if (stage === "accepted") return "accepted";
  if (stage === "declined") return "not_enrolled";
  // not_returning | waitlisted | anything unrecognised
  if (stage === "not_returning" || stage === "waitlisted") return "other";
  return "pipeline";
}

export const PERSON_GROUPS: PersonGroup[] = [
  "enrolled",
  "pipeline",
  "accepted",
  "alumni",
  "not_enrolled",
  "other",
];

export const PERSON_GROUP_LABELS: Record<PersonGroup, string> = {
  enrolled: "Enrolled",
  pipeline: "In pipeline",
  accepted: "Accepted",
  alumni: "Alumni / former",
  not_enrolled: "Did not enrol",
  other: "Other",
};

export interface SchoolOption {
  readonly id: string;
  readonly name: string;
}

/**
 * The fields a person can be edited through. Every key is optional: an absent
 * key means "leave alone", which is what makes one shape serve both the single
 * edit dialog and a bulk edit where most fields are deliberately untouched.
 *
 * `null` is a real value here and means "clear this". Only `undefined` skips.
 */
export interface PersonPatch {
  firstName?: string;
  lastName?: string;
  schoolId?: string;
  grade?: string | null;
  /** enrollment_status for a student, lead_stage for a prospect. */
  status?: string;
  dateOfBirth?: string | null;
  guardianName?: string | null;
  guardianEmail?: string | null;
  guardianPhone?: string | null;
}

/** Fields that mean something applied to many people at once. */
export const BULK_EDITABLE_FIELDS = [
  "schoolId",
  "grade",
  "status",
  "guardianName",
  "guardianEmail",
  "guardianPhone",
] as const satisfies readonly (keyof PersonPatch)[];

/**
 * enrollment_status values. Kept here rather than read from the CHECK
 * constraint because the dialog needs them in the browser; migration 225 taught
 * us to keep a test between a list like this and the database.
 */
export const STUDENT_STATUSES = [
  "enrolled",
  "pending",
  "waitlisted",
  "withdrawn",
  "graduated",
  "archived",
] as const;
