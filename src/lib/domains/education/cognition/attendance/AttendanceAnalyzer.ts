/**
 * Attendance metrics and validation — domain reasoning only.
 * Pipeline orchestration lives in AttendanceContributor (framework).
 */

import type { AttendanceObservation } from "./AttendanceObservation";

export interface AttendanceThresholds {
  minimumAttendanceRate: number;
  chronicAbsenceThreshold: number;
  excessiveTardyThreshold: number;
  consecutiveAbsenceThreshold: number;
}

export interface AttendanceMetrics {
  completedSessions: number;
  presentCount: number;
  excusedAbsences: number;
  unexcusedAbsences: number;
  totalAbsences: number;
  tardyCount: number;
  presentRate: number;
  consecutiveAbsences: number;
  mondayAbsenceCount: number;
  fridayAbsenceCount: number;
  recentRate: number;
  earlierRate: number;
  trend: "improving" | "declining" | "stable" | "unknown";
  perfectAttendance: boolean;
  chronicAbsenteeism: boolean;
  recovery: boolean;
  thresholds: AttendanceThresholds;
}

export function resolveAttendanceThresholds(
  observation: AttendanceObservation
): AttendanceThresholds {
  const r = observation.requirements;
  return {
    minimumAttendanceRate: r?.minimumAttendanceRate ?? 0.9,
    chronicAbsenceThreshold: r?.chronicAbsenceThreshold ?? 10,
    excessiveTardyThreshold: r?.excessiveTardyThreshold ?? 5,
    consecutiveAbsenceThreshold: r?.consecutiveAbsenceThreshold ?? 5,
  };
}

/** Pure metrics over normalized attendance history. */
export function analyzeAttendanceMetrics(
  observation: AttendanceObservation
): AttendanceMetrics {
  const thresholds = resolveAttendanceThresholds(observation);
  const history = [...observation.attendanceHistory].sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  const completed = history.filter((s) => s.status !== "scheduled");

  let presentCount = 0;
  let excusedAbsences = 0;
  let unexcusedAbsences = 0;
  let tardyCount = 0;
  let mondayAbsenceCount = 0;
  let fridayAbsenceCount = 0;

  for (const session of completed) {
    if (session.status === "present") presentCount += 1;
    if (session.status === "absent_excused") excusedAbsences += 1;
    if (session.status === "absent_unexcused") unexcusedAbsences += 1;
    if (session.status === "tardy") {
      tardyCount += 1;
      presentCount += 1;
    }
    const absent =
      session.status === "absent_excused" ||
      session.status === "absent_unexcused";
    if (absent && session.weekday === "monday") mondayAbsenceCount += 1;
    if (absent && session.weekday === "friday") fridayAbsenceCount += 1;
  }

  const totalAbsences = excusedAbsences + unexcusedAbsences;
  const completedSessions = completed.length;
  const presentRate =
    completedSessions === 0 ? 1 : presentCount / completedSessions;

  let consecutiveAbsences = 0;
  let run = 0;
  for (const session of completed) {
    if (
      session.status === "absent_excused" ||
      session.status === "absent_unexcused"
    ) {
      run += 1;
      consecutiveAbsences = Math.max(consecutiveAbsences, run);
    } else {
      run = 0;
    }
  }

  const midpoint = Math.floor(completed.length / 2);
  const earlier = completed.slice(0, midpoint);
  const recent = completed.slice(midpoint);
  const rateOf = (sessions: typeof completed) => {
    if (sessions.length === 0) return 1;
    const present = sessions.filter(
      (s) => s.status === "present" || s.status === "tardy"
    ).length;
    return present / sessions.length;
  };
  const earlierRate = rateOf(earlier);
  const recentRate = rateOf(recent);

  let trend: AttendanceMetrics["trend"] = "unknown";
  if (completed.length >= 4) {
    const delta = recentRate - earlierRate;
    if (delta >= 0.1) trend = "improving";
    else if (delta <= -0.1) trend = "declining";
    else trend = "stable";
  }

  const perfectAttendance =
    completedSessions > 0 &&
    totalAbsences === 0 &&
    tardyCount === 0 &&
    presentRate === 1;

  const chronicAbsenteeism =
    totalAbsences >= thresholds.chronicAbsenceThreshold ||
    (completedSessions > 0 &&
      presentRate < thresholds.minimumAttendanceRate);

  const recovery =
    trend === "improving" &&
    earlierRate < thresholds.minimumAttendanceRate &&
    recentRate >= thresholds.minimumAttendanceRate;

  return {
    completedSessions,
    presentCount,
    excusedAbsences,
    unexcusedAbsences,
    totalAbsences,
    tardyCount,
    presentRate,
    consecutiveAbsences,
    mondayAbsenceCount,
    fridayAbsenceCount,
    recentRate,
    earlierRate,
    trend,
    perfectAttendance,
    chronicAbsenteeism,
    recovery,
    thresholds,
  };
}

export function validateAttendanceObservation(
  observation: AttendanceObservation
): void {
  if (!observation?.organizationId?.trim()) {
    throw new Error("AttendanceObservation.organizationId is required");
  }
  if (!observation.student?.studentId?.trim()) {
    throw new Error("AttendanceObservation.student.studentId is required");
  }
  if (!Array.isArray(observation.attendanceHistory)) {
    throw new Error("AttendanceObservation.attendanceHistory is required");
  }
}
