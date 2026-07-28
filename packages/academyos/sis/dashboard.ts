import { createSisAttendanceService } from "./attendance";
import { listStudents, listSupportPlans } from "./store";
import type { StudentSuccessSummary } from "./types";

export function buildStudentSuccessSummary(
  organizationId: string,
  now = new Date()
): StudentSuccessSummary {
  const students = listStudents(organizationId);
  const active = students.filter(
    (s) => s.status === "Active" || s.status === "Enrolled"
  );
  const attendance = createSisAttendanceService().dashboard(
    organizationId,
    now
  );

  const enrollmentByCampus: Record<string, number> = {};
  const academicLevelDistribution: Record<string, number> = {};
  for (const s of active) {
    const campus = s.campusName?.trim() || s.campusId || "Unassigned";
    enrollmentByCampus[campus] = (enrollmentByCampus[campus] ?? 0) + 1;
    const level = s.academic.readingLevel?.trim() || "Unspecified";
    academicLevelDistribution[level] =
      (academicLevelDistribution[level] ?? 0) + 1;
  }

  const reviewsDue = listSupportPlans(organizationId).filter((p) => {
    if (p.status === "Review Due") return true;
    if (!p.reviewDate) return false;
    return Date.parse(p.reviewDate) <= now.getTime();
  }).length;

  const progressPercents = active.map((s) => {
    const total = s.academic.graduationRequirementsTotal || 1;
    return Math.min(
      100,
      Math.round((s.academic.graduationRequirementsMet / total) * 100)
    );
  });
  const averagePercent =
    progressPercents.length === 0
      ? 0
      : Math.round(
          progressPercents.reduce((a, b) => a + b, 0) / progressPercents.length
        );
  const onTrack = progressPercents.filter((p) => p >= 75).length;

  return {
    activeStudents: active.length,
    attendanceTrends: {
      presentRate: attendance.monthlyPresentRate,
      records: Object.values(attendance.byStatus).reduce((a, b) => a + b, 0),
      chronicAbsenteeismCount: attendance.chronicAbsenteeism,
    },
    enrollmentByCampus: Object.freeze(enrollmentByCampus),
    supportPlanReviewsDue: reviewsDue,
    graduationProgress: {
      averagePercent,
      onTrack,
    },
    academicLevelDistribution: Object.freeze(academicLevelDistribution),
  };
}
