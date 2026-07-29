/**
 * Student Success Intelligence — synthesis contributor types.
 */

import type { EducationContributorResult } from "../framework";

export const STUDENT_SUCCESS_CONTRIBUTOR_ID =
  "education.cognition.student_success" as const;

export const STUDENT_SUCCESS_INPUT_ATTR = "education.student_success" as const;

export type StudentSuccessContributorKind = "synthesis";

export type StudentSuccessTrajectory =
  | "healthy"
  | "positive_momentum"
  | "outstanding"
  | "emerging_risk"
  | "high_academic_risk"
  | "attendance_concern"
  | "conflicting"
  | "improving"
  | "insufficient";

export type StudentSuccessRecommendationKind =
  | "maintain_momentum"
  | "celebrate_achievement"
  | "monitor_closely"
  | "coordinate_intervention"
  | "resolve_conflicts"
  | "advance_readiness"
  | "brief_advisor"
  | "gather_upstream_results";

export type StudentSuccessActionProposalKind =
  | "PublishSuccessBrief"
  | "CreateIntervention"
  | "ScheduleAdvisorMeeting"
  | "NotifyFamily"
  | "EscalateSupport"
  | "RecognizeAchievement";

export const STUDENT_SUCCESS_ACTION_PROPOSAL_IDS = {
  PublishSuccessBrief: "education.student_success.publish_brief",
  CreateIntervention: "education.student_success.create_intervention",
  ScheduleAdvisorMeeting: "education.student_success.schedule_advisor_meeting",
  NotifyFamily: "education.student_success.notify_family",
  EscalateSupport: "education.student_success.escalate_support",
  RecognizeAchievement: "education.student_success.recognize_achievement",
} as const;

export type StudentSuccessIntelligenceResult = EducationContributorResult & {
  studentId: string;
  trajectory: StudentSuccessTrajectory;
};

export type StudentSuccessEvidenceCode =
  | "synthesis_inputs_bound"
  | "upstream_enrollment"
  | "upstream_attendance"
  | "upstream_progress"
  | "healthy_learner"
  | "outstanding_achievement"
  | "positive_momentum"
  | "improving_trajectory"
  | "emerging_risk"
  | "high_academic_risk"
  | "attendance_concern"
  | "conflicting_outputs"
  | "advancement_ready"
  | "intervention_needed"
  | "insufficient_upstream"
  | "cross_domain_strength"
  | "cross_domain_risk"
  | "policy_signals_present";
