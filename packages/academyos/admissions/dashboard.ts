import { listApplicants, listDocuments } from "./store";
import {
  ADMISSIONS_STAGES,
  type AdmissionsDashboardMetrics,
  type AdmissionsStage,
  type AdmissionsSummary,
} from "./types";

function daysBetween(a: string, b: string): number {
  const ms = Date.parse(b) - Date.parse(a);
  if (Number.isNaN(ms) || ms < 0) return 0;
  return ms / (1000 * 60 * 60 * 24);
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function buildAdmissionsDashboard(
  organizationId: string,
  now = new Date()
): AdmissionsDashboardMetrics {
  const applicants = listApplicants(organizationId);
  const thisMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const pipelineByStage = Object.fromEntries(
    ADMISSIONS_STAGES.map((s) => [s, 0])
  ) as Record<AdmissionsStage, number>;
  for (const a of applicants) pipelineByStage[a.stage] += 1;

  const missingDocuments = applicants.filter((a) =>
    listDocuments(organizationId, a.id).some(
      (d) => d.status === "Required" || d.status === "Rejected"
    )
  ).length;

  const enrolled = applicants.filter((a) => a.stage === "Enrolled");
  const enrolledThisMonth = enrolled.filter(
    (a) => a.enrolledAt && monthKey(a.enrolledAt) === thisMonth
  ).length;

  const inquired = applicants.length;
  const conversionRate =
    inquired === 0
      ? 0
      : Math.round((enrolled.length / inquired) * 1000) / 10;

  const closed = applicants.filter(
    (a) => a.stage === "Enrolled" && a.enrolledAt
  );
  const averageDaysInPipeline =
    closed.length === 0
      ? 0
      : Math.round(
          (closed.reduce(
            (sum, a) => sum + daysBetween(a.inquiredAt, a.enrolledAt!),
            0
          ) /
            closed.length) *
            10
        ) / 10;

  return {
    newInquiries: pipelineByStage.Inquiry,
    applicationsStarted: pipelineByStage["Application Started"],
    applicationsSubmitted: pipelineByStage["Application Submitted"],
    missingDocuments,
    assessmentsAwaitingScheduling: applicants.filter(
      (a) =>
        a.assessmentStatus === "Awaiting Schedule" &&
        a.stage !== "Inquiry" &&
        a.stage !== "Declined" &&
        a.stage !== "Withdrawn" &&
        a.stage !== "Enrolled"
    ).length,
    pendingAdmissionsDecisions: pipelineByStage["Admissions Review"],
    acceptedAwaitingEnrollment:
      pipelineByStage.Accepted + pipelineByStage["Enrollment Pending"],
    enrolledThisMonth,
    conversionRate,
    averageDaysInPipeline,
    pipelineByStage: Object.freeze(pipelineByStage),
  };
}

export function buildAdmissionsSummary(
  organizationId: string,
  now = new Date()
): AdmissionsSummary {
  const dash = buildAdmissionsDashboard(organizationId, now);
  const applicants = listApplicants(organizationId);

  const enrollmentByCampus: Record<string, number> = {};
  const enrollmentByProgram: Record<string, number> = {};
  for (const a of applicants.filter((x) => x.stage === "Enrolled")) {
    const campus = a.schoolName?.trim() || a.schoolId || "Unassigned";
    enrollmentByCampus[campus] = (enrollmentByCampus[campus] ?? 0) + 1;
    enrollmentByProgram[a.program] =
      (enrollmentByProgram[a.program] ?? 0) + 1;
  }

  const awarded = applicants.filter((a) => a.scholarshipStatus === "Awarded");
  const interested = applicants.filter(
    (a) =>
      a.scholarshipStatus === "Interested" ||
      a.scholarshipStatus === "Applied" ||
      a.scholarshipStatus === "Eligible" ||
      a.scholarshipStatus === "Documentation Pending"
  );

  return {
    pipelineByStage: dash.pipelineByStage,
    conversionRate: dash.conversionRate,
    averageEnrollmentDays: dash.averageDaysInPipeline,
    enrollmentByCampus: Object.freeze(enrollmentByCampus),
    enrollmentByProgram: Object.freeze(enrollmentByProgram),
    scholarshipUtilization: {
      awarded: awarded.length,
      totalAmount: awarded.reduce((s, a) => s + a.scholarshipAmount, 0),
      interested: interested.length,
    },
    enrollmentTrends: {
      enrolledThisMonth: dash.enrolledThisMonth,
      accepted: applicants.filter((a) => a.stage === "Accepted").length,
      declined: applicants.filter((a) => a.stage === "Declined").length,
    },
  };
}
