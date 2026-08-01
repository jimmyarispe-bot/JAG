import type { AcademyOsEntityBase } from "../store";

export type AcademySchool = AcademyOsEntityBase & {
  readonly name: string;
  readonly code: string;
};

/** Authoritative student lifecycle statuses for AcademyOS domain students. */
export type AcademyStudentStatus = "Active" | "Inactive" | "Withdrawn";

/** Default status for newly created domain students (typed, not widened to string). */
export const ACADEMY_STUDENT_STATUS_ACTIVE: AcademyStudentStatus = "Active";

export type AcademyStudent = AcademyOsEntityBase & {
  readonly firstName: string;
  readonly lastName: string;
  readonly schoolId: string | null;
  readonly gradeLevel: string | null;
  readonly status: AcademyStudentStatus;
};

export type AcademyGuardian = AcademyOsEntityBase & {
  readonly firstName: string;
  readonly lastName: string;
  readonly studentIds: readonly string[];
};

export type AcademyStaff = AcademyOsEntityBase & {
  readonly firstName: string;
  readonly lastName: string;
  readonly role: "Teacher" | "Admin" | "Counselor" | "Other";
  readonly schoolId: string | null;
};

export type AcademyClassroom = AcademyOsEntityBase & {
  readonly name: string;
  readonly schoolId: string;
  readonly capacity: number;
};

export type AcademyCourse = AcademyOsEntityBase & {
  readonly title: string;
  readonly code: string;
  readonly schoolId: string | null;
};

export type AcademyEnrollmentStatus =
  | "Applied"
  | "Enrolled"
  | "Completed"
  | "Withdrawn";

export const ACADEMY_ENROLLMENT_STATUS_ENROLLED: AcademyEnrollmentStatus =
  "Enrolled";

export type AcademyEnrollment = AcademyOsEntityBase & {
  readonly studentId: string;
  readonly courseId: string;
  readonly status: AcademyEnrollmentStatus;
  readonly schoolYear: string;
};

export type AcademyAdmissionStatus =
  | "Draft"
  | "Submitted"
  | "Accepted"
  | "Denied"
  | "Waitlisted";

export const ACADEMY_ADMISSION_STATUS_SUBMITTED: AcademyAdmissionStatus =
  "Submitted";

export type AcademyAdmission = AcademyOsEntityBase & {
  readonly applicantName: string;
  readonly status: AcademyAdmissionStatus;
  readonly schoolId: string | null;
};

export type AcademySession = AcademyOsEntityBase & {
  readonly courseId: string;
  readonly classroomId: string | null;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly title: string;
};

export type AcademyAttendance = AcademyOsEntityBase & {
  readonly studentId: string;
  readonly sessionId: string;
  readonly status: "Present" | "Absent" | "Tardy" | "Excused";
};

export type AcademyGrade = AcademyOsEntityBase & {
  readonly studentId: string;
  readonly courseId: string;
  readonly mark: string;
  readonly term: string;
};

export type AcademyTranscript = AcademyOsEntityBase & {
  readonly studentId: string;
  readonly title: string;
  readonly issuedAt: string;
};

export type AcademyIepStatus = "Draft" | "Active" | "Review" | "Archived";

export const ACADEMY_IEP_STATUS_ACTIVE: AcademyIepStatus = "Active";

export type AcademyIep = AcademyOsEntityBase & {
  readonly studentId: string;
  readonly title: string;
  readonly status: AcademyIepStatus;
};

export type AcademyScholarshipStatus = "Open" | "Awarded" | "Closed";

export const ACADEMY_SCHOLARSHIP_STATUS_OPEN: AcademyScholarshipStatus = "Open";
export const ACADEMY_SCHOLARSHIP_STATUS_AWARDED: AcademyScholarshipStatus =
  "Awarded";

export type AcademyScholarship = AcademyOsEntityBase & {
  readonly name: string;
  readonly amount: number;
  readonly studentId: string | null;
  readonly status: AcademyScholarshipStatus;
};

export type AcademyInvoiceStatus = "Draft" | "Open" | "Paid" | "Void";

export const ACADEMY_INVOICE_STATUS_OPEN: AcademyInvoiceStatus = "Open";

export type AcademyInvoice = AcademyOsEntityBase & {
  readonly studentId: string;
  readonly amount: number;
  readonly status: AcademyInvoiceStatus;
  readonly dueDate: string | null;
};
