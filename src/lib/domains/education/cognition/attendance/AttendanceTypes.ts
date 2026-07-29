/**
 * Attendance Intelligence — types and action proposal ids.
 */

import type { EducationContributorResult } from "../framework";

export const ATTENDANCE_CONTRIBUTOR_ID =
  "education.cognition.attendance" as const;

export const ATTENDANCE_OBSERVATION_ATTR = "education.attendance" as const;

export type AttendanceRecommendationKind =
  | "notify_family"
  | "schedule_attendance_meeting"
  | "recognize_perfect_attendance"
  | "recognize_improvement"
  | "recommend_intervention"
  | "continue_monitoring"
  | "escalate_support"
  | "review_transportation";

export type AttendanceActionProposalKind =
  | "NotifyFamily"
  | "ScheduleConference"
  | "CreateIntervention"
  | "AssignAttendanceReview"
  | "RecordRecognition"
  | "ReviewTransportation";

export const ATTENDANCE_ACTION_PROPOSAL_IDS = {
  NotifyFamily: "education.attendance.notify_family",
  ScheduleConference: "education.attendance.schedule_conference",
  CreateIntervention: "education.attendance.create_intervention",
  AssignAttendanceReview: "education.attendance.assign_review",
  RecordRecognition: "education.attendance.record_recognition",
  ReviewTransportation: "education.attendance.review_transportation",
} as const;

export type AttendanceIntelligenceResult = EducationContributorResult & {
  /** Alias for subjectId (studentId). */
  studentId: string;
};

export type AttendanceEvidenceCode =
  | "perfect_attendance"
  | "five_consecutive_absences"
  | "attendance_below_threshold"
  | "improving_trend"
  | "declining_trend"
  | "stable_trend"
  | "repeated_monday_absences"
  | "repeated_friday_absences"
  | "excessive_tardies"
  | "chronic_absenteeism"
  | "recovery_pattern"
  | "excused_absence_cluster"
  | "unexcused_absence_cluster";
