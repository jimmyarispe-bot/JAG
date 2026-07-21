/**
 * RC-3.06 Education ECC widgets — Enrollment, Student health, Teacher workload,
 * Academic performance, Attendance, Scholarship analytics.
 */

import { computeEducationSignals } from "@/lib/platform/integrations/connectors/education/intelligence/signals";
import { educationStore } from "@/lib/platform/integrations/connectors/education/services/store";

export type StudentEnrollmentWidget = {
  kind: "student_enrollment";
  title: string;
  activeStudents: number;
  attendanceRate: number;
};

export type StudentHealthWidget = {
  kind: "student_health";
  title: string;
  studentHealth: number;
  atRiskStudents: number;
  activeStudents: number;
};

export type TeacherWorkloadWidget = {
  kind: "teacher_workload";
  title: string;
  teacherWorkload: number;
  teacherCount: number;
  courseCount: number;
};

export type AcademicPerformanceWidget = {
  kind: "academic_performance";
  title: string;
  academicPerformance: number;
  activeStudents: number;
};

export type EducationAttendanceWidget = {
  kind: "education_attendance";
  title: string;
  attendanceRate: number;
  activeStudents: number;
};

export type ScholarshipAnalyticsWidget = {
  kind: "scholarship_analytics";
  title: string;
  scholarshipAwardTotal: number;
  scholarshipAwardCount: number;
  scholarshipCoveragePct: number;
};

export type EducationEccWidgets = {
  studentEnrollment: StudentEnrollmentWidget;
  studentHealth: StudentHealthWidget;
  teacherWorkload: TeacherWorkloadWidget;
  academicPerformance: AcademicPerformanceWidget;
  attendance: EducationAttendanceWidget;
  scholarshipAnalytics: ScholarshipAnalyticsWidget;
};

export function buildEducationEccWidgets(
  organizationId: string
): EducationEccWidgets | null {
  const records = educationStore.allRecords(organizationId);
  if (!records.length) return null;
  const s = computeEducationSignals(records, organizationId);

  return {
    studentEnrollment: {
      kind: "student_enrollment",
      title: "Student Enrollment",
      activeStudents: s.activeStudents,
      attendanceRate: s.attendanceRate,
    },
    studentHealth: {
      kind: "student_health",
      title: "Student Health",
      studentHealth: s.studentHealth,
      atRiskStudents: s.atRiskStudents,
      activeStudents: s.activeStudents,
    },
    teacherWorkload: {
      kind: "teacher_workload",
      title: "Teacher Workload",
      teacherWorkload: s.teacherWorkload,
      teacherCount: s.teacherCount,
      courseCount: s.courseCount,
    },
    academicPerformance: {
      kind: "academic_performance",
      title: "Academic Performance",
      academicPerformance: s.academicPerformance,
      activeStudents: s.activeStudents,
    },
    attendance: {
      kind: "education_attendance",
      title: "Attendance",
      attendanceRate: s.attendanceRate,
      activeStudents: s.activeStudents,
    },
    scholarshipAnalytics: {
      kind: "scholarship_analytics",
      title: "Scholarship Analytics",
      scholarshipAwardTotal: s.scholarshipAwardTotal,
      scholarshipAwardCount: s.scholarshipAwardCount,
      scholarshipCoveragePct: s.scholarshipCoveragePct,
    },
  };
}
