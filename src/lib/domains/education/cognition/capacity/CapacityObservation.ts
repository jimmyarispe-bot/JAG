import type { EducationObservationBase } from "../framework";

export interface CapacitySectionContract {
  sectionId: string;
  programId?: string;
  campusId?: string;
  enrolled: number;
  seats: number;
  /** Virtual / remote slot capacity if applicable */
  virtualSeats?: number;
  teacherCapacity?: number;
}

export interface CapacityObservation extends EducationObservationBase {
  subject: { subjectId: string; label?: string };
  campusId?: string;
  programId?: string;
  sections: readonly CapacitySectionContract[];
  /** Optional campus aggregate seats */
  campusSeats?: number;
  campusEnrolled?: number;
  /** Utilization below this ratio ⇒ under-utilized (default 0.5) */
  underUtilizationThreshold?: number;
}

export function validateCapacityObservation(
  observation: CapacityObservation
): void {
  if (!observation.subject?.subjectId?.trim()) {
    throw new Error("Capacity observation requires subject.subjectId");
  }
}
