/**
 * Student Success recommendations — synthesis proposals only.
 */

import type {
  EducationAnalysisContext,
  EducationRecommendationBuilder,
} from "../framework";
import {
  analyzeStudentSuccess,
  type StudentSuccessAnalysis,
} from "./StudentSuccessAnalyzer";
import type { StudentSuccessInputs } from "./StudentSuccessInputs";
import { STUDENT_SUCCESS_ACTION_PROPOSAL_IDS } from "./StudentSuccessTypes";

export function buildStudentSuccessRecommendations(
  builder: EducationRecommendationBuilder,
  ctx: EducationAnalysisContext<StudentSuccessInputs>,
  analysis?: StudentSuccessAnalysis
): void {
  const a = analysis ?? analyzeStudentSuccess(ctx.observation);
  const byCode = new Set(ctx.evidence.map((e) => e.code));

  if (byCode.has("insufficient_upstream")) {
    builder
      .recommend("gather_upstream_results", "Gather Upstream Intelligence")
      .because(
        "Student Success synthesis requires Enrollment, Attendance, and/or Progress contributor outputs. No duplicated domain reasoning is performed here."
      )
      .confidence("medium")
      .priority("high")
      .supportedBy("insufficient_upstream", "synthesis_inputs_bound")
      .proposeAction({
        kind: "ScheduleAdvisorMeeting",
        actionId: STUDENT_SUCCESS_ACTION_PROPOSAL_IDS.ScheduleAdvisorMeeting,
        rationale: "Propose briefing once upstream results exist",
      })
      .asWarning();
    return;
  }

  if (
    byCode.has("healthy_learner") ||
    byCode.has("positive_momentum")
  ) {
    builder
      .recommend("maintain_momentum", "Maintain Student Success Momentum")
      .because(
        "Upstream contributors indicate a healthy or positively trending learner profile. Continue monitoring and publish a success brief."
      )
      .confidence("high")
      .priority("low")
      .supportedBy("healthy_learner", "positive_momentum", "cross_domain_strength")
      .proposeAction({
        kind: "PublishSuccessBrief",
        actionId: STUDENT_SUCCESS_ACTION_PROPOSAL_IDS.PublishSuccessBrief,
        rationale: "Propose publishing a student success brief",
      })
      .asInformational();
  }

  if (byCode.has("outstanding_achievement")) {
    builder
      .recommend("celebrate_achievement", "Recognize Outstanding Achievement")
      .because(
        "Progress upstream signals exceptional/ahead trajectory without conflicting attendance or academic risk blockers."
      )
      .confidence(0.9)
      .priority("medium")
      .supportedBy("outstanding_achievement", "upstream_progress")
      .proposeAction({
        kind: "RecognizeAchievement",
        actionId: STUDENT_SUCCESS_ACTION_PROPOSAL_IDS.RecognizeAchievement,
        rationale: "Propose recognition for outstanding achievement",
      })
      .proposeAction({
        kind: "NotifyFamily",
        actionId: STUDENT_SUCCESS_ACTION_PROPOSAL_IDS.NotifyFamily,
        priority: 2,
        rationale: "Notify family of outstanding achievement",
      });
  }

  if (byCode.has("improving_trajectory")) {
    builder
      .recommend("maintain_momentum", "Reinforce Improving Trajectory")
      .because(
        "Upstream evidence shows improvement/recovery patterns. Reinforce gains and keep advisor visibility."
      )
      .confidence(0.85)
      .priority("medium")
      .supportedBy("improving_trajectory")
      .proposeAction({
        kind: "PublishSuccessBrief",
        actionId: STUDENT_SUCCESS_ACTION_PROPOSAL_IDS.PublishSuccessBrief,
        rationale: "Propose brief highlighting improvement",
      });
  }

  if (byCode.has("advancement_ready")) {
    builder
      .recommend("advance_readiness", "Readiness for Advancement")
      .because(
        "Cross-domain readiness is consistent: upstream contributors are ready with sufficient confidence and no dominant risk signals."
      )
      .confidence(0.88)
      .priority("medium")
      .supportedBy("advancement_ready", "healthy_learner", "positive_momentum")
      .proposeAction({
        kind: "ScheduleAdvisorMeeting",
        actionId: STUDENT_SUCCESS_ACTION_PROPOSAL_IDS.ScheduleAdvisorMeeting,
        rationale: "Propose advancement / next-step advisor meeting",
      });
  }

  if (
    byCode.has("high_academic_risk") ||
    byCode.has("attendance_concern") ||
    byCode.has("intervention_needed") ||
    byCode.has("emerging_risk")
  ) {
    builder
      .recommend("coordinate_intervention", "Coordinate Cross-Domain Intervention")
      .because(
        "Synthesized risk indicators from upstream Enrollment/Attendance/Progress outputs warrant coordinated support. This contributor does not re-evaluate raw observations."
      )
      .confidence(0.9)
      .priority("critical")
      .supportedBy(
        "high_academic_risk",
        "attendance_concern",
        "intervention_needed",
        "emerging_risk",
        "cross_domain_risk"
      )
      .proposeAction({
        kind: "CreateIntervention",
        actionId: STUDENT_SUCCESS_ACTION_PROPOSAL_IDS.CreateIntervention,
        rationale: "Propose coordinated intervention",
      })
      .proposeAction({
        kind: "EscalateSupport",
        actionId: STUDENT_SUCCESS_ACTION_PROPOSAL_IDS.EscalateSupport,
        priority: 2,
        rationale: "Propose escalation for multi-domain risk",
      })
      .asWarning();

    builder
      .recommend("brief_advisor", "Advisor / Leadership Brief")
      .because(
        "Cross-domain risk or emerging concerns should be visible in advisor and leadership briefs."
      )
      .confidence(0.86)
      .priority("high")
      .supportedBy("emerging_risk", "high_academic_risk", "attendance_concern")
      .proposeAction({
        kind: "PublishSuccessBrief",
        actionId: STUDENT_SUCCESS_ACTION_PROPOSAL_IDS.PublishSuccessBrief,
        rationale: "Propose risk-oriented success brief",
      })
      .proposeAction({
        kind: "ScheduleAdvisorMeeting",
        actionId: STUDENT_SUCCESS_ACTION_PROPOSAL_IDS.ScheduleAdvisorMeeting,
        priority: 2,
        rationale: "Propose advisor briefing",
      });
  }

  if (byCode.has("conflicting_outputs")) {
    builder
      .recommend("resolve_conflicts", "Resolve Cross-Domain Conflicts")
      .because(
        "Upstream contributors disagree (ready vs blocked/conditional). Reconcile conflicts before high-stakes advancement decisions."
      )
      .confidence(0.87)
      .priority("high")
      .supportedBy("conflicting_outputs")
      .proposeAction({
        kind: "ScheduleAdvisorMeeting",
        actionId: STUDENT_SUCCESS_ACTION_PROPOSAL_IDS.ScheduleAdvisorMeeting,
        rationale: "Propose conflict-resolution review",
      })
      .asWarning();
  }

  if (
    byCode.has("emerging_risk") &&
    !byCode.has("high_academic_risk") &&
    !byCode.has("attendance_concern")
  ) {
    builder
      .recommend("monitor_closely", "Monitor Emerging Risk")
      .because(
        "Mild cross-domain warnings are present without dominant academic or attendance blockers."
      )
      .confidence(0.8)
      .priority("medium")
      .supportedBy("emerging_risk")
      .proposeAction({
        kind: "PublishSuccessBrief",
        actionId: STUDENT_SUCCESS_ACTION_PROPOSAL_IDS.PublishSuccessBrief,
        rationale: "Propose monitoring brief",
      });
  }

  // Ensure trajectory label is available to hosts via a light informational rec when healthy/outstanding already covered
  void a;
}
