/**
 * Normalized AttendanceObservation — sole analyzer input.
 * Hosts supply this contract; no database access.
 */

import type { EducationObservationBase } from "../framework";

export type AttendanceSessionStatus =
  | "present"
  | "absent_excused"
  | "absent_unexcused"
  | "tardy"
  | "scheduled";

export type AttendanceWeekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface AttendanceStudentContract {
  studentId: string;
  displayName?: string;
}

export interface AttendanceEnrollmentContract {
  enrollmentId: string;
  programId?: string;
  status?: string;
}

export interface AttendanceSessionRecord {
  sessionId: string;
  date: string;
  weekday?: AttendanceWeekday;
  status: AttendanceSessionStatus;
  excusedReason?: string;
}

export interface AttendanceRequirementsContract {
  /** Minimum present rate 0..1 (default treated as 0.9 when omitted in analyzer). */
  minimumAttendanceRate?: number;
  /** Absences at/above this count in window ⇒ chronic risk. */
  chronicAbsenceThreshold?: number;
  /** Tardies at/above this count ⇒ excessive tardies. */
  excessiveTardyThreshold?: number;
  /** Consecutive absences at/above this count ⇒ consecutive risk. */
  consecutiveAbsenceThreshold?: number;
}

export interface AttendanceRiskIndicators {
  transportationConcern?: boolean;
  priorIntervention?: boolean;
  flaggedByStaff?: boolean;
}

/** Normalized attendance observation. */
export interface AttendanceObservation extends EducationObservationBase {
  student: AttendanceStudentContract;
  enrollment?: AttendanceEnrollmentContract;
  /** Historical + recent session outcomes (exclude pure "scheduled" for rates). */
  attendanceHistory: readonly AttendanceSessionRecord[];
  scheduledSessions?: readonly AttendanceSessionRecord[];
  requirements?: AttendanceRequirementsContract;
  riskIndicators?: AttendanceRiskIndicators;
}
