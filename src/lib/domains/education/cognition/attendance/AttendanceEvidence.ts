/**
 * Attendance evidence collection via shared EducationEvidenceBuilder.
 */

import type { EducationEvidenceBuilder } from "../framework";
import type { AttendanceMetrics } from "./AttendanceAnalyzer";
import type { AttendanceObservation } from "./AttendanceObservation";

export function collectAttendanceEvidence(
  builder: EducationEvidenceBuilder,
  observation: AttendanceObservation,
  metrics: AttendanceMetrics
): void {
  void observation;

  if (metrics.perfectAttendance) {
    builder.addSupportingEvidence(
      "perfect_attendance",
      "Perfect attendance in the observed history",
      { presentRate: metrics.presentRate }
    );
  }

  if (
    metrics.consecutiveAbsences >= metrics.thresholds.consecutiveAbsenceThreshold
  ) {
    builder.addBlockingIssue(
      "five_consecutive_absences",
      `${metrics.consecutiveAbsences} consecutive absences`,
      {
        consecutiveAbsences: metrics.consecutiveAbsences,
        suffix: String(metrics.consecutiveAbsences),
      }
    );
  }

  if (metrics.presentRate < metrics.thresholds.minimumAttendanceRate) {
    builder.addBlockingIssue(
      "attendance_below_threshold",
      `Attendance rate ${(metrics.presentRate * 100).toFixed(0)}% below threshold ${(metrics.thresholds.minimumAttendanceRate * 100).toFixed(0)}%`,
      {
        presentRate: metrics.presentRate,
        threshold: metrics.thresholds.minimumAttendanceRate,
      }
    );
  }

  if (metrics.chronicAbsenteeism) {
    builder.addBlockingIssue(
      "chronic_absenteeism",
      `Chronic absenteeism detected (${metrics.totalAbsences} absences in window)`,
      { totalAbsences: metrics.totalAbsences }
    );
  }

  if (metrics.trend === "improving") {
    builder.addSupportingEvidence(
      "improving_trend",
      "Attendance trend is improving",
      { recentRate: metrics.recentRate, earlierRate: metrics.earlierRate }
    );
  } else if (metrics.trend === "declining") {
    builder.addWarning(
      "declining_trend",
      "Attendance trend is declining",
      { recentRate: metrics.recentRate, earlierRate: metrics.earlierRate }
    );
  } else if (metrics.trend === "stable") {
    builder.addFinding("stable_trend", "Attendance trend is stable", {
      presentRate: metrics.presentRate,
    });
  }

  if (metrics.recovery) {
    builder.addSupportingEvidence(
      "recovery_pattern",
      "Attendance recovery pattern detected after a low period",
      { recentRate: metrics.recentRate, earlierRate: metrics.earlierRate }
    );
  }

  if (metrics.mondayAbsenceCount >= 3) {
    builder.addWarning(
      "repeated_monday_absences",
      `Repeated Monday absences (${metrics.mondayAbsenceCount})`,
      { count: metrics.mondayAbsenceCount }
    );
  }

  if (metrics.fridayAbsenceCount >= 3) {
    builder.addWarning(
      "repeated_friday_absences",
      `Repeated Friday absences (${metrics.fridayAbsenceCount})`,
      { count: metrics.fridayAbsenceCount }
    );
  }

  if (metrics.tardyCount >= metrics.thresholds.excessiveTardyThreshold) {
    builder.addWarning(
      "excessive_tardies",
      `Excessive tardies (${metrics.tardyCount})`,
      { tardyCount: metrics.tardyCount }
    );
  }

  if (
    metrics.excusedAbsences >= 3 &&
    metrics.excusedAbsences > metrics.unexcusedAbsences
  ) {
    builder.addFinding(
      "excused_absence_cluster",
      `Cluster of excused absences (${metrics.excusedAbsences})`,
      { excusedAbsences: metrics.excusedAbsences }
    );
  }

  if (metrics.unexcusedAbsences >= 3) {
    builder.addWarning(
      "unexcused_absence_cluster",
      `Cluster of unexcused absences (${metrics.unexcusedAbsences})`,
      { unexcusedAbsences: metrics.unexcusedAbsences }
    );
  }
}
