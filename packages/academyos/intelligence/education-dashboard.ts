/**
 * Education Executive Intelligence — pack-local deterministic analytics.
 * Does not modify Platform Core EI; ready for PER-EI-InsightProviders bridge.
 */

import { buildAcademicOperationsSummary } from "../academic-ops/dashboard";
import type { AcademicOperationsSummary } from "../academic-ops/types";
import { listTeachers as listAoTeachers } from "../academic-ops/store";
import { buildAdmissionsSummary } from "../admissions/dashboard";
import type { AdmissionsSummary } from "../admissions/types";
import {
  createAttendanceService,
  createBillingService,
  createEnrollmentService,
  createGradingService,
  createIepService,
  createScholarshipsService,
  createStaffService,
  createStudentsService,
} from "../domain/services";
import { buildFinancialOperationsSummary } from "../finance/dashboard";
import type { FinancialOperationsSummary } from "../finance/types";
import { listScholarshipAwards } from "../finance/store";
import { buildLearningProgressSummary } from "../learning/dashboard";
import type { LearningProgressSummary } from "../learning/types";
import { buildStudentSuccessSummary } from "../sis/dashboard";
import type { StudentSuccessSummary } from "../sis/types";
import { createSisAttendanceService } from "../sis/attendance";
import { listStudents as listSisStudents } from "../sis/store";
import { buildCommunicationsSummary } from "../communications/dashboard";
import type { CommunicationsSummary } from "../communications/types";
import { buildWorkforceSummary } from "../workforce/dashboard";
import type { WorkforceSummary } from "../workforce/types";

export type EducationExecutiveDashboard = {
  readonly organizationId: string;
  readonly admissionsSummary: AdmissionsSummary;
  readonly studentSuccessSummary: StudentSuccessSummary;
  readonly academicOperationsSummary: AcademicOperationsSummary;
  readonly financialOperationsSummary: FinancialOperationsSummary;
  readonly learningProgressSummary: LearningProgressSummary;
  readonly workforceSummary: WorkforceSummary;
  readonly communicationsSummary: CommunicationsSummary;
  readonly enrollmentTrends: {
    readonly totalEnrollments: number;
    readonly activeStudents: number;
  };
  readonly attendance: {
    readonly records: number;
    readonly presentRate: number;
  };
  readonly academicProgress: {
    readonly gradedMarks: number;
  };
  readonly teacherUtilization: {
    readonly teachers: number;
    readonly staffTotal: number;
  };
  readonly scholarshipFunding: {
    readonly open: number;
    readonly awarded: number;
    readonly totalAmount: number;
  };
  readonly financialHealth: {
    readonly openInvoices: number;
    readonly openAmount: number;
  };
  readonly complianceStatus: {
    readonly activeIeps: number;
  };
  readonly studentOutcomes: {
    readonly activeStudents: number;
    readonly withdrawnStudents: number;
  };
};

export function buildEducationExecutiveDashboard(
  organizationId: string
): EducationExecutiveDashboard {
  const enrollments = createEnrollmentService().list(organizationId);
  const legacyStudents = createStudentsService().list(organizationId);
  const sisStudents = listSisStudents(organizationId);
  const attendance = createAttendanceService().list(organizationId);
  const sisAttendance = createSisAttendanceService().dashboard(organizationId);
  const staff = createStaffService().list(organizationId);
  const scholarships = createScholarshipsService().list(organizationId);
  const invoices = createBillingService().list(organizationId);
  const ieps = createIepService().list(organizationId);
  const grades = createGradingService().list(organizationId);
  const studentSuccessSummary = buildStudentSuccessSummary(organizationId);
  const academicOperationsSummary =
    buildAcademicOperationsSummary(organizationId);
  const financialOperationsSummary =
    buildFinancialOperationsSummary(organizationId);
  const learningProgressSummary = buildLearningProgressSummary(organizationId);
  const workforceSummary = buildWorkforceSummary(organizationId);
  const communicationsSummary = buildCommunicationsSummary(organizationId);
  const aoTeachers = listAoTeachers(organizationId);
  const financeAwards = listScholarshipAwards(organizationId);

  const present = attendance.filter((a) => a.status === "Present").length;
  const legacyPresentRate =
    attendance.length === 0
      ? 100
      : Math.round((present / attendance.length) * 100);
  const sisRecordCount = Object.values(sisAttendance.byStatus).reduce(
    (a, b) => a + b,
    0
  );
  const presentRate =
    sisRecordCount > 0 ? sisAttendance.monthlyPresentRate : legacyPresentRate;

  const teachers = staff.filter((s) => s.role === "Teacher");
  const teacherCount = Math.max(teachers.length, aoTeachers.length);
  const openScholarships = scholarships.filter((s) => s.status === "Open");
  const awarded = scholarships.filter((s) => s.status === "Awarded");
  const openInvoices = invoices.filter((i) => i.status === "Open");
  const activeSis = sisStudents.filter(
    (s) => s.status === "Active" || s.status === "Enrolled"
  ).length;

  return {
    organizationId,
    admissionsSummary: buildAdmissionsSummary(organizationId),
    studentSuccessSummary,
    academicOperationsSummary,
    financialOperationsSummary,
    learningProgressSummary,
    workforceSummary,
    communicationsSummary,
    enrollmentTrends: {
      totalEnrollments: Math.max(enrollments.length, activeSis),
      activeStudents: Math.max(
        legacyStudents.filter((s) => s.status === "Active").length,
        activeSis
      ),
    },
    attendance: {
      records: sisRecordCount > 0 ? sisRecordCount : attendance.length,
      presentRate,
    },
    academicProgress: {
      gradedMarks: grades.length,
    },
    teacherUtilization: {
      teachers: Math.max(teacherCount, workforceSummary.headcount),
      staffTotal: Math.max(
        staff.length,
        aoTeachers.length,
        workforceSummary.headcount
      ),
    },
    scholarshipFunding: {
      open: openScholarships.length,
      awarded: Math.max(
        awarded.length,
        financeAwards.filter((a) => a.status === "Active").length
      ),
      totalAmount: Math.max(
        scholarships.reduce((a, s) => a + s.amount, 0),
        financialOperationsSummary.scholarshipFunding
      ),
    },
    financialHealth: {
      openInvoices:
        financialOperationsSummary.accountsReceivable > 0
          ? Math.max(
              openInvoices.length,
              Math.ceil(financialOperationsSummary.accountsReceivable)
            )
          : openInvoices.length,
      openAmount: Math.max(
        openInvoices.reduce((a, i) => a + i.amount, 0),
        financialOperationsSummary.accountsReceivable
      ),
    },
    complianceStatus: {
      activeIeps:
        ieps.filter((i) => i.status === "Active").length +
        studentSuccessSummary.supportPlanReviewsDue,
    },
    studentOutcomes: {
      activeStudents: Math.max(
        legacyStudents.filter((s) => s.status === "Active").length,
        activeSis
      ),
      withdrawnStudents: sisStudents.filter((s) => s.status === "Withdrawn")
        .length,
    },
  };
}
