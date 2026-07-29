/**
 * Academic Progress recommendations — proposals only.
 */

import type {
  EducationAnalysisContext,
  EducationRecommendationBuilder,
} from "../framework";
import {
  analyzeAcademicProgress,
  type AcademicProgressAnalysis,
} from "./AcademicProgressAnalyzer";
import type { AcademicProgressObservation } from "./AcademicProgressObservation";
import { PROGRESS_ACTION_PROPOSAL_IDS } from "./AcademicProgressTypes";

export function buildAcademicProgressRecommendations(
  builder: EducationRecommendationBuilder,
  ctx: EducationAnalysisContext<AcademicProgressObservation>,
  analysis?: AcademicProgressAnalysis
): void {
  const a = analysis ?? analyzeAcademicProgress(ctx.observation);
  const byCode = new Set(ctx.evidence.map((e) => e.code));

  if (byCode.has("insufficient_evidence")) {
    builder
      .recommend("gather_more_evidence", "Gather More Progress Evidence")
      .because(
        "Knowledge-aligned progress signals are insufficient. Collect goals, course progress, mastery, or assessment summaries before acting."
      )
      .confidence("medium")
      .priority("high")
      .supportedBy("insufficient_evidence", "knowledge_entities_bound")
      .proposeAction({
        kind: "ReviewGoals",
        actionId: PROGRESS_ACTION_PROPOSAL_IDS.ReviewGoals,
        rationale: "Propose goal/evidence review (proposal only)",
      })
      .asWarning();
    return;
  }

  if (
    byCode.has("expected_progress") ||
    byCode.has("goal_mastery_on_track")
  ) {
    builder
      .recommend("continue_current_path", "Continue Current Learning Path")
      .because(
        "Progress is aligned with expectations relative to goals/courses. Continue monitoring and publish progress as appropriate."
      )
      .confidence("high")
      .priority("low")
      .supportedBy("expected_progress", "goal_mastery_on_track")
      .proposeAction({
        kind: "PublishProgress",
        actionId: PROGRESS_ACTION_PROPOSAL_IDS.PublishProgress,
        rationale: "Propose publishing an on-track progress update",
      })
      .asInformational();
  }

  if (
    byCode.has("ahead_of_expectations") ||
    byCode.has("exceptional_growth")
  ) {
    builder
      .recommend("accelerate_learning", "Accelerate Learning Opportunities")
      .because(
        "Mastery/course trajectory is ahead of expectations. Consider enrichment or adjusted placement."
      )
      .confidence(0.88)
      .priority("medium")
      .supportedBy("ahead_of_expectations", "exceptional_growth")
      .proposeAction({
        kind: "AdjustPlacement",
        actionId: PROGRESS_ACTION_PROPOSAL_IDS.AdjustPlacement,
        rationale: "Propose placement/acceleration review",
      })
      .proposeAction({
        kind: "NotifyFamily",
        actionId: PROGRESS_ACTION_PROPOSAL_IDS.NotifyFamily,
        priority: 2,
        rationale: "Notify family of strong progress",
      });

    if (byCode.has("exceptional_growth")) {
      builder
        .recommend("celebrate_growth", "Celebrate Exceptional Growth")
        .because(
          "Composite progress indicators show exceptional growth versus expectations."
        )
        .confidence("high")
        .priority("low")
        .supportedBy("exceptional_growth")
        .proposeAction({
          kind: "NotifyFamily",
          actionId: PROGRESS_ACTION_PROPOSAL_IDS.NotifyFamily,
          rationale: "Propose recognition communication",
        })
        .asInformational();
    }
  }

  if (
    byCode.has("behind_expectations") ||
    byCode.has("stalled_progress") ||
    byCode.has("intervention_indicated") ||
    byCode.has("goal_mastery_behind")
  ) {
    builder
      .recommend("recommend_intervention", "Recommend Academic Intervention")
      .because(
        "Progress is behind expectations, stalled, or otherwise indicates need for intervention. Action proposals only — no execution."
      )
      .confidence(0.9)
      .priority("critical")
      .supportedBy(
        "behind_expectations",
        "stalled_progress",
        "intervention_indicated",
        "goal_mastery_behind"
      )
      .proposeAction({
        kind: "CreateIntervention",
        actionId: PROGRESS_ACTION_PROPOSAL_IDS.CreateIntervention,
        rationale: "Propose academic intervention",
      })
      .proposeAction({
        kind: "ReviewGoals",
        actionId: PROGRESS_ACTION_PROPOSAL_IDS.ReviewGoals,
        priority: 2,
        rationale: "Propose goal review with student/family",
      })
      .asWarning();

    builder
      .recommend("adjust_course_load", "Review Course Load")
      .because(
        "Behind or stalled trajectory may warrant course-load or pacing adjustments."
      )
      .confidence(0.8)
      .priority("high")
      .supportedBy("behind_expectations", "stalled_progress")
      .proposeAction({
        kind: "AdjustPlacement",
        actionId: PROGRESS_ACTION_PROPOSAL_IDS.AdjustPlacement,
        rationale: "Propose course-load adjustment review",
      });
  }

  if (byCode.has("assessment_not_ready")) {
    builder
      .recommend("schedule_assessment", "Schedule or Complete Assessment")
      .because(
        "Assessment readiness is incomplete. Completing pending assessments unlocks clearer progress judgment."
      )
      .confidence(0.85)
      .priority("high")
      .supportedBy("assessment_not_ready")
      .proposeAction({
        kind: "ScheduleAssessment",
        actionId: PROGRESS_ACTION_PROPOSAL_IDS.ScheduleAssessment,
        rationale: "Propose scheduling outstanding assessments",
      });
  }

  if (byCode.has("policy_graduation_violated")) {
    builder
      .recommend("review_goals", "Review Graduation Credit Trajectory")
      .because(
        "Policy Engine reports graduation credit policy violation. Align goals and course progress to credit requirements."
      )
      .confidence(0.87)
      .priority("high")
      .supportedBy("policy_graduation_violated")
      .proposeAction({
        kind: "ReviewGoals",
        actionId: PROGRESS_ACTION_PROPOSAL_IDS.ReviewGoals,
        rationale: "Propose graduation-requirement review",
      })
      .asWarning();
  }

  if (byCode.has("policy_graduation_satisfied") && a.trajectory === "expected") {
    builder
      .recommend("continue_current_path", "Maintain Graduation-Ready Path")
      .because(
        "Policy Engine reports graduation credit policy satisfied with on-track progress signals."
      )
      .confidence("high")
      .priority("low")
      .supportedBy("policy_graduation_satisfied", "expected_progress")
      .proposeAction({
        kind: "PublishProgress",
        actionId: PROGRESS_ACTION_PROPOSAL_IDS.PublishProgress,
        rationale: "Propose progress publication",
      })
      .asInformational();
  }
}
