/**
 * Attendance recommendations via shared EducationRecommendationBuilder.
 */

import type {
  EducationAnalysisContext,
  EducationRecommendationBuilder,
} from "../framework";
import {
  analyzeAttendanceMetrics,
  type AttendanceMetrics,
} from "./AttendanceAnalyzer";
import type { AttendanceObservation } from "./AttendanceObservation";
import { ATTENDANCE_ACTION_PROPOSAL_IDS } from "./AttendanceTypes";

export function buildAttendanceRecommendations(
  builder: EducationRecommendationBuilder,
  ctx: EducationAnalysisContext<AttendanceObservation>,
  metrics?: AttendanceMetrics
): void {
  const m = metrics ?? analyzeAttendanceMetrics(ctx.observation);
  const byCode = new Set(ctx.evidence.map((e) => e.code));
  const transportation =
    ctx.observation.riskIndicators?.transportationConcern === true;

  if (byCode.has("perfect_attendance")) {
    builder
      .recommend("recognize_perfect_attendance", "Recognize Perfect Attendance")
      .because(
        "Student has perfect attendance in the observed history. Recognition reinforces positive engagement."
      )
      .confidence("high")
      .priority("low")
      .supportedBy("perfect_attendance")
      .proposeAction({
        kind: "RecordRecognition",
        actionId: ATTENDANCE_ACTION_PROPOSAL_IDS.RecordRecognition,
        rationale: "Record attendance recognition (proposal only)",
      })
      .asInformational();
  }

  if (byCode.has("improving_trend") || byCode.has("recovery_pattern")) {
    builder
      .recommend("recognize_improvement", "Recognize Improvement")
      .because(
        "Attendance is improving or recovering after a low period. Recognition and continued monitoring are appropriate."
      )
      .confidence(0.85)
      .priority("medium")
      .supportedBy("improving_trend", "recovery_pattern")
      .proposeAction({
        kind: "RecordRecognition",
        actionId: ATTENDANCE_ACTION_PROPOSAL_IDS.RecordRecognition,
        rationale: "Record improvement recognition",
      })
      .proposeAction({
        kind: "NotifyFamily",
        actionId: ATTENDANCE_ACTION_PROPOSAL_IDS.NotifyFamily,
        priority: 2,
        rationale: "Notify family of positive attendance trend",
      });
  }

  if (
    byCode.has("chronic_absenteeism") ||
    byCode.has("attendance_below_threshold") ||
    byCode.has("five_consecutive_absences")
  ) {
    builder
      .recommend("recommend_intervention", "Recommend Intervention")
      .because(
        "Attendance metrics indicate chronic risk, below-threshold rate, and/or consecutive absences. Intervention is recommended."
      )
      .confidence(0.92)
      .priority("critical")
      .supportedBy(
        "chronic_absenteeism",
        "attendance_below_threshold",
        "five_consecutive_absences"
      )
      .proposeAction({
        kind: "CreateIntervention",
        actionId: ATTENDANCE_ACTION_PROPOSAL_IDS.CreateIntervention,
        rationale: "Propose attendance intervention",
      })
      .proposeAction({
        kind: "NotifyFamily",
        actionId: ATTENDANCE_ACTION_PROPOSAL_IDS.NotifyFamily,
        priority: 2,
        rationale: "Notify family of attendance risk",
      })
      .asWarning();

    builder
      .recommend("schedule_attendance_meeting", "Schedule Attendance Meeting")
      .because(
        "Elevated absence patterns warrant a structured attendance meeting with family/staff."
      )
      .confidence(0.88)
      .priority("high")
      .supportedBy(
        "chronic_absenteeism",
        "five_consecutive_absences",
        "unexcused_absence_cluster"
      )
      .proposeAction({
        kind: "ScheduleConference",
        actionId: ATTENDANCE_ACTION_PROPOSAL_IDS.ScheduleConference,
        rationale: "Schedule attendance conference",
      });

    builder
      .recommend("notify_family", "Notify Family")
      .because(
        "Family notification is appropriate when attendance falls below expectations."
      )
      .confidence(0.9)
      .priority("high")
      .supportedBy("attendance_below_threshold", "unexcused_absence_cluster")
      .proposeAction({
        kind: "NotifyFamily",
        actionId: ATTENDANCE_ACTION_PROPOSAL_IDS.NotifyFamily,
        rationale: "Notify family of attendance concerns",
      });
  }

  if (byCode.has("declining_trend") && !byCode.has("chronic_absenteeism")) {
    builder
      .recommend("continue_monitoring", "Continue Monitoring")
      .because(
        "Attendance is declining but not yet at chronic thresholds. Continue monitoring and assign review."
      )
      .confidence(0.8)
      .priority("medium")
      .supportedBy("declining_trend")
      .proposeAction({
        kind: "AssignAttendanceReview",
        actionId: ATTENDANCE_ACTION_PROPOSAL_IDS.AssignAttendanceReview,
        rationale: "Assign attendance review for declining trend",
      });
  }

  if (
    byCode.has("excessive_tardies") ||
    byCode.has("repeated_monday_absences") ||
    byCode.has("repeated_friday_absences")
  ) {
    builder
      .recommend("escalate_support", "Escalate Support")
      .because(
        "Pattern indicators (tardies and/or weekday-specific absences) suggest need for escalated attendance support."
      )
      .confidence(0.84)
      .priority("high")
      .supportedBy(
        "excessive_tardies",
        "repeated_monday_absences",
        "repeated_friday_absences"
      )
      .proposeAction({
        kind: "AssignAttendanceReview",
        actionId: ATTENDANCE_ACTION_PROPOSAL_IDS.AssignAttendanceReview,
        rationale: "Assign review for attendance patterns",
      })
      .asWarning();
  }

  if (
    transportation ||
    (byCode.has("repeated_monday_absences") &&
      byCode.has("repeated_friday_absences"))
  ) {
    builder
      .recommend("review_transportation", "Review Transportation")
      .because(
        transportation
          ? "Transportation concern flagged on the observation; review may address attendance barriers."
          : "Monday and Friday absence patterns often correlate with transportation barriers."
      )
      .confidence(0.78)
      .priority("medium")
      .supportedBy("repeated_monday_absences", "repeated_friday_absences")
      .proposeAction({
        kind: "ReviewTransportation",
        actionId: ATTENDANCE_ACTION_PROPOSAL_IDS.ReviewTransportation,
        rationale: "Review transportation as an attendance barrier",
      });
  }

  if (
    ctx.readiness === "ready" &&
    !byCode.has("perfect_attendance") &&
    m.trend !== "declining"
  ) {
    builder
      .recommend("continue_monitoring", "Continue Monitoring")
      .because(
        "No blocking attendance issues. Continue routine monitoring."
      )
      .confidence(Math.max(ctx.confidence, 0.85))
      .priority("informational")
      .supportedBy("stable_trend", "improving_trend")
      .proposeAction({
        kind: "AssignAttendanceReview",
        actionId: ATTENDANCE_ACTION_PROPOSAL_IDS.AssignAttendanceReview,
        priority: 3,
        rationale: "Optional routine attendance review",
      })
      .asInformational();
  }
}
