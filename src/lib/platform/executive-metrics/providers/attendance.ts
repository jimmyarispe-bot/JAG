import { buildMetric, statusFromHigherIsBetter } from "@/lib/platform/executive-metrics/metric";
import type { ExecutiveMetric } from "@/lib/platform/executive-metrics/types";
import type { ExecutiveMetricsSourceBundle } from "@/lib/platform/executive-metrics/sources";

/**
 * Attendance domain — Founder today-slices preferred; CCM rate as fallback.
 * Emits rate + detail metrics so Founder cards map without re-querying.
 */
export function provideAttendanceMetrics(sources: ExecutiveMetricsSourceBundle): ExecutiveMetric[] {
  const now = sources.loadedAt;
  const ops = sources.founderOps;
  const student = ops?.studentAttendance;
  const teacher = ops?.teacherAttendance;

  const studentRate =
    student?.rate ?? sources.commandCenter?.attendanceRate ?? null;
  const teacherRate = teacher?.rate ?? null;

  return [
    buildMetric({
      id: "attendance.rate",
      name: "Attendance Rate",
      domain: "attendance",
      source: ops?.studentAttendance
        ? "founder-ops.student-attendance"
        : "command-center",
      value: studentRate,
      unit: "percent",
      zeroIsValid: true,
      confidence: studentRate == null ? undefined : "Medium",
      status: statusFromHigherIsBetter(studentRate, 95, 90, 85),
      lastUpdated: now,
    }),
    buildMetric({
      id: "attendance.student_present_today",
      name: "Students Present Today",
      domain: "attendance",
      source: "founder-ops.student-attendance",
      value: student ? student.present : null,
      unit: "count",
      zeroIsValid: true,
      confidence: student ? "High" : undefined,
      lastUpdated: now,
    }),
    buildMetric({
      id: "attendance.student_records_today",
      name: "Student Attendance Records Today",
      domain: "attendance",
      source: "founder-ops.student-attendance",
      value: student ? student.total : null,
      unit: "count",
      zeroIsValid: true,
      confidence: student ? "High" : undefined,
      lastUpdated: now,
    }),
    buildMetric({
      id: "attendance.teacher_submission_rate",
      name: "Teacher Attendance Submission Rate",
      domain: "attendance",
      source: "founder-ops.teacher-attendance",
      value: teacherRate,
      unit: "percent",
      zeroIsValid: true,
      confidence: teacherRate == null ? undefined : "Medium",
      status: statusFromHigherIsBetter(teacherRate, 95, 85, 70),
      lastUpdated: now,
    }),
    buildMetric({
      id: "attendance.teacher_sessions_submitted",
      name: "Teacher Sessions Submitted Today",
      domain: "attendance",
      source: "founder-ops.teacher-attendance",
      value: teacher ? teacher.submitted : null,
      unit: "count",
      zeroIsValid: true,
      confidence: teacher ? "High" : undefined,
      lastUpdated: now,
    }),
    buildMetric({
      id: "attendance.teacher_sessions_total",
      name: "Teacher Sessions Today",
      domain: "attendance",
      source: "founder-ops.teacher-attendance",
      value: teacher ? teacher.total : null,
      unit: "count",
      zeroIsValid: true,
      confidence: teacher ? "High" : undefined,
      lastUpdated: now,
    }),
  ];
}
