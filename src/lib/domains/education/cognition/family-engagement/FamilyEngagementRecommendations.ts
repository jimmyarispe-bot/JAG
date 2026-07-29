/**
 * Family Engagement recommendations — outreach proposals only.
 */

import type {
  EducationAnalysisContext,
  EducationRecommendationBuilder,
} from "../framework";
import {
  analyzeFamilyEngagement,
  type FamilyEngagementAnalysis,
} from "./FamilyEngagementAnalyzer";
import type { FamilyEngagementInputs } from "./FamilyEngagementInputs";
import { FAMILY_ENGAGEMENT_ACTION_PROPOSAL_IDS } from "./FamilyEngagementTypes";

export function buildFamilyEngagementRecommendations(
  builder: EducationRecommendationBuilder,
  ctx: EducationAnalysisContext<FamilyEngagementInputs>,
  analysis?: FamilyEngagementAnalysis
): void {
  const a = analysis ?? analyzeFamilyEngagement(ctx.observation);
  const byCode = new Set(ctx.evidence.map((e) => e.code));

  if (byCode.has("insufficient_upstream")) {
    builder
      .recommend("gather_upstream_results", "Gather Upstream Engagement Signals")
      .because(
        "Family engagement intelligence requires Student Success, Attendance, and/or Enrollment contributor outputs."
      )
      .confidence("medium")
      .priority("high")
      .supportedBy("insufficient_upstream", "synthesis_inputs_bound")
      .proposeAction({
        kind: "ScheduleFamilyMeeting",
        actionId: FAMILY_ENGAGEMENT_ACTION_PROPOSAL_IDS.ScheduleFamilyMeeting,
        rationale: "Propose family meeting once upstream results exist",
      })
      .asWarning();
    return;
  }

  if (
    byCode.has("attendance_partnership") ||
    byCode.has("communication_priority_urgent")
  ) {
    builder
      .recommend(
        "prioritize_attendance_outreach",
        "Prioritize Attendance Partnership Outreach"
      )
      .because(
        "Attendance upstream and/or Student Success attendance concern indicate productive family partnership opportunity."
      )
      .confidence(0.9)
      .priority("critical")
      .supportedBy(
        "attendance_partnership",
        "communication_priority_urgent",
        "engagement_opportunity"
      )
      .proposeAction({
        kind: "SendFamilyOutreach",
        actionId: FAMILY_ENGAGEMENT_ACTION_PROPOSAL_IDS.SendFamilyOutreach,
        rationale: "Propose attendance partnership outreach",
      })
      .proposeAction({
        kind: "ScheduleFamilyMeeting",
        actionId: FAMILY_ENGAGEMENT_ACTION_PROPOSAL_IDS.ScheduleFamilyMeeting,
        priority: 2,
        rationale: "Propose family meeting focused on attendance",
      })
      .asWarning();
  }

  if (byCode.has("progress_conference") || byCode.has("risk_outreach")) {
    builder
      .recommend("schedule_family_meeting", "Schedule Family Support Meeting")
      .because(
        "Cross-domain risk or progress concerns create a high-value family partnership moment."
      )
      .confidence(0.88)
      .priority(a.communicationPriority === "urgent" ? "critical" : "high")
      .supportedBy(
        "progress_conference",
        "risk_outreach",
        "engagement_opportunity"
      )
      .proposeAction({
        kind: "ScheduleFamilyMeeting",
        actionId: FAMILY_ENGAGEMENT_ACTION_PROPOSAL_IDS.ScheduleFamilyMeeting,
        rationale: "Propose family support meeting",
      })
      .proposeAction({
        kind: "InviteToConference",
        actionId: FAMILY_ENGAGEMENT_ACTION_PROPOSAL_IDS.InviteToConference,
        priority: 2,
        rationale: "Propose conference invitation",
      });

    builder
      .recommend("share_progress_update", "Share Progress Update with Family")
      .because(
        "Family partnership is strengthened when progress and support context are shared clearly."
      )
      .confidence(0.85)
      .priority("high")
      .supportedBy("progress_conference", "upstream_student_success")
      .proposeAction({
        kind: "ShareProgressBrief",
        actionId: FAMILY_ENGAGEMENT_ACTION_PROPOSAL_IDS.ShareProgressBrief,
        rationale: "Propose sharing a family-facing progress brief",
      });
  }

  if (byCode.has("celebration_outreach")) {
    builder
      .recommend("celebrate_with_family", "Celebrate Achievement with Family")
      .because(
        "Student Success upstream indicates healthy/outstanding/improving trajectory — a productive positive partnership moment."
      )
      .confidence(0.86)
      .priority("medium")
      .supportedBy("celebration_outreach", "engagement_opportunity")
      .proposeAction({
        kind: "SendFamilyOutreach",
        actionId: FAMILY_ENGAGEMENT_ACTION_PROPOSAL_IDS.SendFamilyOutreach,
        rationale: "Propose celebratory family outreach",
      })
      .asInformational();
  }

  if (byCode.has("enrollment_onboarding")) {
    builder
      .recommend(
        "complete_enrollment_partnership",
        "Complete Enrollment Partnership"
      )
      .because(
        "Enrollment upstream indicates onboarding or readiness partnership opportunities with family."
      )
      .confidence(0.84)
      .priority("high")
      .supportedBy("enrollment_onboarding", "upstream_enrollment")
      .proposeAction({
        kind: "NotifyEnrollmentStatus",
        actionId: FAMILY_ENGAGEMENT_ACTION_PROPOSAL_IDS.NotifyEnrollmentStatus,
        rationale: "Propose enrollment status notification",
      });
  }

  if (
    a.opportunities.includes("routine_check_in") &&
    !byCode.has("attendance_partnership") &&
    !byCode.has("risk_outreach")
  ) {
    builder
      .recommend("monitor_engagement", "Maintain Routine Family Check-In")
      .because(
        "No urgent engagement triggers; maintain light-touch family partnership cadence."
      )
      .confidence(0.78)
      .priority("low")
      .supportedBy("engagement_opportunity", "upstream_student_success")
      .proposeAction({
        kind: "SendFamilyOutreach",
        actionId: FAMILY_ENGAGEMENT_ACTION_PROPOSAL_IDS.SendFamilyOutreach,
        rationale: "Propose routine family check-in",
      })
      .asInformational();
  }
}
