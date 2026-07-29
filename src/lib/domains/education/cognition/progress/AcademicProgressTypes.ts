/**
 * Academic Progress Intelligence — types and action proposal ids.
 */

import type { EducationContributorResult } from "../framework";

export const PROGRESS_CONTRIBUTOR_ID =
  "education.cognition.progress" as const;

export const PROGRESS_OBSERVATION_ATTR = "education.progress" as const;

export type AcademicProgressRecommendationKind =
  | "continue_current_path"
  | "accelerate_learning"
  | "recommend_intervention"
  | "schedule_assessment"
  | "celebrate_growth"
  | "review_goals"
  | "gather_more_evidence"
  | "adjust_course_load";

export type AcademicProgressActionProposalKind =
  | "PublishProgress"
  | "CreateIntervention"
  | "ScheduleAssessment"
  | "NotifyFamily"
  | "ReviewGoals"
  | "AdjustPlacement";

export const PROGRESS_ACTION_PROPOSAL_IDS = {
  PublishProgress: "education.progress.publish",
  CreateIntervention: "education.progress.create_intervention",
  ScheduleAssessment: "education.progress.schedule_assessment",
  NotifyFamily: "education.progress.notify_family",
  ReviewGoals: "education.progress.review_goals",
  AdjustPlacement: "education.progress.adjust_placement",
} as const;

export type AcademicProgressIntelligenceResult = EducationContributorResult & {
  studentId: string;
};

export type AcademicProgressEvidenceCode =
  | "insufficient_evidence"
  | "expected_progress"
  | "ahead_of_expectations"
  | "behind_expectations"
  | "stalled_progress"
  | "exceptional_growth"
  | "assessment_ready"
  | "assessment_not_ready"
  | "intervention_indicated"
  | "goal_mastery_on_track"
  | "goal_mastery_behind"
  | "policy_graduation_satisfied"
  | "policy_graduation_violated"
  | "policy_graduation_unknown"
  | "policy_attendance_context"
  | "knowledge_entities_bound";
