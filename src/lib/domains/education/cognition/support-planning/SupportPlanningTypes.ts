/**
 * Support Planning — Student Support synthesis contributor types.
 */

import type { EducationContributorResult } from "../framework";

export const SUPPORT_PLANNING_CONTRIBUTOR_ID =
  "education.cognition.support_planning" as const;

export const SUPPORT_PLANNING_INPUT_ATTR =
  "education.support_planning" as const;

export type SupportPlanningContributorKind = "synthesis";

export type SupportPlanStance =
  | "intensive_support"
  | "targeted_support"
  | "family_led_partnership"
  | "monitor_and_maintain"
  | "insufficient";

export type SupportPlanningRecommendationKind =
  | "publish_support_plan"
  | "prioritize_intervention_actions"
  | "align_family_outreach"
  | "coordinate_mtss_cycle"
  | "maintain_support_watch"
  | "gather_upstream_results";

export type SupportPlanningActionProposalKind =
  | "PublishSupportPlan"
  | "ScheduleSupportReview"
  | "ActivateInterventionPlan"
  | "ScheduleFamilyMeeting"
  | "AssignCaseOwner";

export const SUPPORT_PLANNING_ACTION_PROPOSAL_IDS = {
  PublishSupportPlan: "education.support_planning.publish_plan",
  ScheduleSupportReview: "education.support_planning.schedule_review",
  ActivateInterventionPlan: "education.support_planning.activate_intervention",
  ScheduleFamilyMeeting: "education.support_planning.schedule_family_meeting",
  AssignCaseOwner: "education.support_planning.assign_case_owner",
} as const;

export type SupportPlanningEvidenceCode =
  | "synthesis_inputs_bound"
  | "upstream_intervention"
  | "upstream_family_engagement"
  | "upstream_student_success"
  | "unified_support_plan"
  | "prioritized_actions"
  | "expected_outcomes"
  | "intensive_support"
  | "targeted_support"
  | "family_led_partnership"
  | "monitor_and_maintain"
  | "insufficient_upstream";

export type SupportPlanningIntelligenceResult = EducationContributorResult & {
  studentId: string;
  stance: SupportPlanStance;
  expectedOutcomes: readonly string[];
};
