/**
 * Which details the school is missing, and what to call them when asking a
 * parent for them.
 *
 * Client-safe: no database, no server imports. The public form and the staff
 * page both render from these labels, so a parent and a member of staff are
 * always looking at the same words for the same field.
 */

export type MissingField =
  | "date_of_birth"
  | "grade_level"
  | "email"
  | "phone"
  | "address";

/** Fields that belong to a child. The rest belong to the household. */
export const STUDENT_FIELDS: MissingField[] = ["date_of_birth", "grade_level"];
export const FAMILY_FIELDS: MissingField[] = ["email", "phone", "address"];

export const FIELD_LABELS: Record<MissingField, string> = {
  date_of_birth: "Date of birth",
  grade_level: "Grade",
  email: "Email address",
  phone: "Phone number",
  address: "Home address",
};

/**
 * Said to the parent, not to the developer. "date_of_birth" means nothing to
 * anyone outside this codebase, and a request that reads like a database error
 * gets ignored.
 */
export const FIELD_PROMPTS: Record<MissingField, string> = {
  date_of_birth: "Date of birth",
  grade_level: "Grade for the 2026–27 year",
  email: "Best email address for school and billing",
  phone: "Best phone number",
  address: "Home address",
};

export const FIELD_INPUT_TYPE: Record<MissingField, "date" | "email" | "tel" | "text"> = {
  date_of_birth: "date",
  grade_level: "text",
  email: "email",
  phone: "tel",
  address: "text",
};

export const GRADE_OPTIONS = [
  "kindergarten", "1st_grade", "2nd_grade", "3rd_grade", "4th_grade", "5th_grade",
  "6th_grade", "7th_grade", "8th_grade", "9th_grade", "10th_grade", "11th_grade", "12th_grade",
];

export function gradeLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** One child and what is missing for them. */
export interface StudentGap {
  readonly id: string;
  readonly name: string;
  readonly missing: MissingField[];
}

/** One household: the children, plus what is missing for the household itself. */
export interface FamilyGap {
  readonly familyId: string;
  readonly familyName: string;
  readonly schoolId: string;
  readonly schoolName: string;
  /** Where a request would be sent. Null means it cannot be — the gap IS the email. */
  readonly email: string | null;
  readonly guardianName: string | null;
  readonly students: StudentGap[];
  readonly familyMissing: MissingField[];
}

/** The shape frozen onto a request row and read back by the public page. */
export interface RequestedFields {
  readonly students: { id: string; name: string; fields: MissingField[] }[];
  readonly family: MissingField[];
  readonly familyName?: string;
}

export function countGaps(gap: FamilyGap): number {
  return (
    gap.familyMissing.length +
    gap.students.reduce((total, s) => total + s.missing.length, 0)
  );
}

/** "a date of birth for Ava and a home address" — for the email's first line. */
export function describeGaps(requested: RequestedFields): string {
  const parts: string[] = [];
  for (const student of requested.students) {
    for (const field of student.fields) {
      parts.push(`${FIELD_LABELS[field].toLowerCase()} for ${student.name}`);
    }
  }
  for (const field of requested.family) {
    parts.push(FIELD_LABELS[field].toLowerCase());
  }
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}
