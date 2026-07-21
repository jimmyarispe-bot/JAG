/**
 * RC-3.06 Education intelligence signals from canonical entities only.
 * Scholarship analytics soft-reads government awards when available.
 */

import type { EducationCanonicalEntity } from "@/lib/platform/integrations/connectors/education/entities";
import { enterpriseStore } from "@/lib/platform/integrations/connectors/enterprise/services/store";

function num(v: unknown): number {
  return Number(v ?? 0);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

export type EducationIntelligenceSignals = {
  activeStudents: number;
  teacherCount: number;
  courseCount: number;
  attendanceRate: number;
  academicPerformance: number;
  studentHealth: number;
  teacherWorkload: number;
  atRiskStudents: number;
  scholarshipAwardTotal: number;
  scholarshipAwardCount: number;
  scholarshipCoveragePct: number;
};

export function computeEducationSignals(
  records: readonly EducationCanonicalEntity[],
  organizationId?: string
): EducationIntelligenceSignals {
  const students = records.filter((r) => r.objectType === "student");
  const activeStudents = students.filter(
    (s) => String(s.attributes.status) === "active"
  ).length;
  const teachers = records.filter((r) => r.objectType === "teacher");
  const courses = records.filter(
    (r) => r.objectType === "course" || r.objectType === "class"
  );
  const grades = records.filter((r) => r.objectType === "grade");
  const attendance = records.filter((r) => r.objectType === "attendance");
  const assignments = records.filter((r) => r.objectType === "assignment");

  const present = attendance.filter((a) => String(a.attributes.status) === "present").length;
  const attendanceRate = attendance.length
    ? Math.round((present / attendance.length) * 1000) / 10
    : 100;

  const gradePcts = grades
    .map((g) => {
      const max = num(g.attributes.maxScore) || 100;
      return max > 0 ? (num(g.attributes.score) / max) * 100 : 0;
    })
    .filter((n) => n >= 0);
  const academicPerformance = gradePcts.length
    ? Math.round((gradePcts.reduce((a, b) => a + b, 0) / gradePcts.length) * 10) / 10
    : 0;

  const byStudentAbsences = new Map<string, number>();
  for (const a of attendance) {
    if (String(a.attributes.status) !== "absent") continue;
    const sid = String(a.attributes.studentId ?? "");
    if (!sid) continue;
    byStudentAbsences.set(sid, (byStudentAbsences.get(sid) ?? 0) + 1);
  }
  const byStudentAvg = new Map<string, number[]>();
  for (const g of grades) {
    const sid = String(g.attributes.studentId ?? "");
    if (!sid) continue;
    const max = num(g.attributes.maxScore) || 100;
    const pct = max > 0 ? (num(g.attributes.score) / max) * 100 : 0;
    const arr = byStudentAvg.get(sid) ?? [];
    arr.push(pct);
    byStudentAvg.set(sid, arr);
  }
  let atRiskStudents = 0;
  for (const s of students) {
    const absences = byStudentAbsences.get(s.externalId) ?? 0;
    const avgs = byStudentAvg.get(s.externalId) ?? [];
    const avg = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : 100;
    if (absences >= 2 || avg < 70) atRiskStudents += 1;
  }

  const studentHealth = clamp(
    55 +
      (attendanceRate >= 90 ? 20 : attendanceRate >= 75 ? 8 : -10) +
      (academicPerformance >= 85 ? 15 : academicPerformance >= 70 ? 6 : -12) -
      atRiskStudents * 8
  );

  const courseLoad =
    teachers.length > 0
      ? teachers.reduce((s, t) => s + num(t.attributes.courseLoad), 0) / teachers.length
      : courses.length;
  const assignmentsPerTeacher =
    teachers.length > 0 ? assignments.length / teachers.length : assignments.length;
  const teacherWorkload = clamp(
    courseLoad * 18 + assignmentsPerTeacher * 12 + (courseLoad >= 3 ? 10 : 0)
  );

  let scholarshipAwardTotal = 0;
  let scholarshipAwardCount = 0;
  if (organizationId) {
    const awards = enterpriseStore
      .allRecords(organizationId)
      .filter((r) => r.objectType === "award");
    scholarshipAwardCount = awards.length;
    scholarshipAwardTotal = Math.round(
      awards.reduce((s, a) => s + num(a.attributes.totalAmt), 0)
    );
  }
  const scholarshipCoveragePct =
    activeStudents > 0
      ? Math.round((scholarshipAwardCount / activeStudents) * 1000) / 10
      : 0;

  return {
    activeStudents: activeStudents || students.length,
    teacherCount: teachers.length,
    courseCount: courses.length,
    attendanceRate,
    academicPerformance,
    studentHealth,
    teacherWorkload,
    atRiskStudents,
    scholarshipAwardTotal,
    scholarshipAwardCount,
    scholarshipCoveragePct,
  };
}
