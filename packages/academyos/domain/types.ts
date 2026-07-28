import type { AcademyOsEntityBase } from "../store";

export type AcademySchool = AcademyOsEntityBase & {
  readonly name: string;
  readonly code: string;
};

export type AcademyStudent = AcademyOsEntityBase & {
  readonly firstName: string;
  readonly lastName: string;
  readonly schoolId: string | null;
  readonly gradeLevel: string | null;
  readonly status: "Active" | "Inactive" | "Withdrawn";
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

export type AcademyEnrollment = AcademyOsEntityBase & {
  readonly studentId: string;
  readonly courseId: string;
  readonly status: "Applied" | "Enrolled" | "Completed" | "Withdrawn";
  readonly schoolYear: string;
};

export type AcademyAdmission = AcademyOsEntityBase & {
  readonly applicantName: string;
  readonly status: "Draft" | "Submitted" | "Accepted" | "Denied" | "Waitlisted";
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

export type AcademyIep = AcademyOsEntityBase & {
  readonly studentId: string;
  readonly title: string;
  readonly status: "Draft" | "Active" | "Review" | "Archived";
};

export type AcademyScholarship = AcademyOsEntityBase & {
  readonly name: string;
  readonly amount: number;
  readonly studentId: string | null;
  readonly status: "Open" | "Awarded" | "Closed";
};

export type AcademyInvoice = AcademyOsEntityBase & {
  readonly studentId: string;
  readonly amount: number;
  readonly status: "Draft" | "Open" | "Paid" | "Void";
  readonly dueDate: string | null;
};
