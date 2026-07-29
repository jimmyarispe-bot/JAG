import type { EducationObservationBase } from "../framework";

export interface StaffingTeacherContract {
  teacherId: string;
  displayName?: string;
  certifications?: readonly string[];
  available?: boolean;
  /** Current instructional load units */
  load?: number;
  maxLoad?: number;
}

export interface StaffingAssignmentContract {
  assignmentId: string;
  teacherId: string;
  sectionId: string;
  requiredCertification?: string;
  loadUnits?: number;
}

export interface StaffingObservation extends EducationObservationBase {
  subject: { subjectId: string; label?: string };
  programId?: string;
  teachers: readonly StaffingTeacherContract[];
  assignments: readonly StaffingAssignmentContract[];
}

export function validateStaffingObservation(
  observation: StaffingObservation
): void {
  if (!observation.subject?.subjectId?.trim()) {
    throw new Error("Staffing observation requires subject.subjectId");
  }
}
