import type { EducationObservationBase } from "../framework";

export interface ScholarshipStudentContract {
  studentId: string;
  displayName?: string;
  gpa?: number;
}

export interface ScholarshipProgramContract {
  programId: string;
  name?: string;
}

export interface ScholarshipAwardContract {
  scholarshipId: string;
  name?: string;
  fundingSourceId?: string;
  status: "eligible" | "pending" | "awarded" | "renewal_due" | "ineligible" | "expired";
  minimumGpa?: number;
  utilizationRatio?: number;
  renewalDeadline?: string;
  missingDocuments?: readonly string[];
}

export interface ScholarshipObservation extends EducationObservationBase {
  student: ScholarshipStudentContract;
  enrollmentId?: string;
  program?: ScholarshipProgramContract;
  scholarships: readonly ScholarshipAwardContract[];
  fundingPeriodId?: string;
}

export function validateScholarshipObservation(
  observation: ScholarshipObservation
): void {
  if (!observation.student?.studentId?.trim()) {
    throw new Error("Scholarship observation requires student.studentId");
  }
}
