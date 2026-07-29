/**
 * Family Engagement Intelligence — support capability contributor types.
 */

import type { EducationContributorResult } from "../framework";

export const FAMILY_ENGAGEMENT_CONTRIBUTOR_ID =
  "education.cognition.family_engagement" as const;

export const FAMILY_ENGAGEMENT_INPUT_ATTR =
  "education.family_engagement" as const;

export type FamilyEngagementContributorKind = "support";

export type FamilyEngagementOpportunity =
  | "attendance_partnership"
  | "progress_conference"
  | "enrollment_onboarding"
  | "celebration_outreach"
  | "risk_outreach"
  | "routine_check_in"
  | "none";

export type FamilyCommunicationPriority =
  | "urgent"
  | "high"
  | "medium"
  | "low";

export type FamilyEngagementRecommendationKind =
  | "schedule_family_meeting"
  | "prioritize_attendance_outreach"
  | "share_progress_update"
  | "celebrate_with_family"
  | "complete_enrollment_partnership"
  | "monitor_engagement"
  | "gather_upstream_results";

export type FamilyEngagementActionProposalKind =
  | "ScheduleFamilyMeeting"
  | "SendFamilyOutreach"
  | "ShareProgressBrief"
  | "InviteToConference"
  | "NotifyEnrollmentStatus";

export const FAMILY_ENGAGEMENT_ACTION_PROPOSAL_IDS = {
  ScheduleFamilyMeeting: "education.family_engagement.schedule_meeting",
  SendFamilyOutreach: "education.family_engagement.send_outreach",
  ShareProgressBrief: "education.family_engagement.share_progress_brief",
  InviteToConference: "education.family_engagement.invite_conference",
  NotifyEnrollmentStatus: "education.family_engagement.notify_enrollment",
} as const;

export type FamilyEngagementEvidenceCode =
  | "synthesis_inputs_bound"
  | "upstream_student_success"
  | "upstream_attendance"
  | "upstream_enrollment"
  | "engagement_opportunity"
  | "attendance_partnership"
  | "progress_conference"
  | "enrollment_onboarding"
  | "celebration_outreach"
  | "risk_outreach"
  | "communication_priority_urgent"
  | "communication_priority_high"
  | "insufficient_upstream"
  | "policy_signals_present";

export type FamilyEngagementIntelligenceResult = EducationContributorResult & {
  studentId: string;
  opportunities: readonly FamilyEngagementOpportunity[];
  communicationPriority: FamilyCommunicationPriority;
};
