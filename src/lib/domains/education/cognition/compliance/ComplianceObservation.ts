import type { EducationObservationBase } from "../framework";

export type ComplianceObligationStatus =
  | "satisfied"
  | "outstanding"
  | "overdue"
  | "waived";

export interface ComplianceObligationContract {
  obligationId: string;
  kind:
    | "documentation"
    | "attendance"
    | "assessment"
    | "program_participation"
    | "required_review";
  label?: string;
  status: ComplianceObligationStatus;
  riskLevel?: "low" | "medium" | "high";
}

export interface ComplianceObservation extends EducationObservationBase {
  student: { studentId: string; displayName?: string };
  programId?: string;
  enrollmentId?: string;
  obligations: readonly ComplianceObligationContract[];
  attendanceCompliant?: boolean;
  assessmentsComplete?: boolean;
}

export function validateComplianceObservation(
  observation: ComplianceObservation
): void {
  if (!observation.student?.studentId?.trim()) {
    throw new Error("Compliance observation requires student.studentId");
  }
}
