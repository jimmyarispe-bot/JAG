/**
 * AcademyOS InsightProvider — registered on the Platform SDK registry.
 * Live EI dashboard merge requires PER-EI-InsightProviders (not implemented).
 */

import type {
  InsightDescriptor,
  InsightEvaluationContext,
  InsightProvider,
  InsightRule,
} from "@/lib/platform-sdk";
import { buildAcademicOperationsSummary } from "../academic-ops/dashboard";
import { buildAdmissionsDashboard } from "../admissions/dashboard";
import { buildFinancialOperationsSummary } from "../finance/dashboard";
import { buildLearningProgressSummary } from "../learning/dashboard";
import { buildStudentSuccessSummary } from "../sis/dashboard";
import { buildCommunicationsSummary } from "../communications/dashboard";
import { buildWorkforceSummary } from "../workforce/dashboard";
import { buildEducationExecutiveDashboard } from "./education-dashboard";

const rules: readonly InsightRule[] = Object.freeze([
  {
    id: "academyos.communications.failed_notifications",
    domain: "communications",
    version: "1.0.0",
    evaluate(ctx) {
      const failed = Number(ctx.signals.failedNotifications ?? 0);
      if (failed <= 0) return null;
      return {
        severity: failed >= 5 ? "Warning" : "Info",
        title: "Failed notifications",
        description: `${failed} notification(s) failed delivery.`,
        suggestedNextStep: "Review channel configuration and retry failed sends.",
      };
    },
  },
  {
    id: "academyos.communications.outstanding_workflows",
    domain: "communications",
    version: "1.0.0",
    evaluate(ctx) {
      const outstanding = Number(ctx.signals.outstandingWorkflows ?? 0);
      if (outstanding <= 0) return null;
      return {
        severity: outstanding >= 10 ? "Warning" : "Info",
        title: "Outstanding workflows",
        description: `${outstanding} workflow(s) are Active or Waiting.`,
        suggestedNextStep: "Clear blockers in Admissions, Finance, and Workforce queues.",
      };
    },
  },
  {
    id: "academyos.workforce.cert_expirations",
    domain: "workforce",
    version: "1.0.0",
    evaluate(ctx) {
      const expiring = Number(ctx.signals.certificationExpirations ?? 0);
      if (expiring <= 0) return null;
      return {
        severity: expiring >= 3 ? "Warning" : "Info",
        title: "Certification expirations upcoming",
        description: `${expiring} certification(s) are expired or expiring within 60 days.`,
        suggestedNextStep: "Notify employees and schedule renewals.",
      };
    },
  },
  {
    id: "academyos.workforce.open_positions",
    domain: "workforce",
    version: "1.0.0",
    evaluate(ctx) {
      const open = Number(ctx.signals.openPositions ?? 0);
      if (open <= 0) return null;
      return {
        severity: open >= 3 ? "Warning" : "Info",
        title: "Open positions",
        description: `${open} position(s) remain unfilled.`,
        suggestedNextStep: "Prioritize hiring for campus and virtual coverage.",
      };
    },
  },
  {
    id: "academyos.learning.intervention_needed",
    domain: "learning",
    version: "1.0.0",
    evaluate(ctx) {
      const needing = Number(ctx.signals.studentsNeedingIntervention ?? 0);
      if (needing <= 0) return null;
      return {
        severity: needing >= 5 ? "Warning" : "Info",
        title: "Students needing intervention",
        description: `${needing} student(s) have active or review-due interventions.`,
        suggestedNextStep: "Assign staff and schedule progress reviews.",
      };
    },
  },
  {
    id: "academyos.learning.assessment_completion_low",
    domain: "learning",
    version: "1.0.0",
    evaluate(ctx) {
      const rate = Number(ctx.signals.assessmentCompletionRate ?? 100);
      if (rate >= 70) return null;
      return {
        severity: rate < 40 ? "Warning" : "Info",
        title: "Assessment completion below target",
        description: `Only ${rate}% of students have recorded assessments.`,
        suggestedNextStep: "Schedule formative checkpoints in the teacher gradebook.",
      };
    },
  },
  {
    id: "academyos.finance.ar_high",
    domain: "finance",
    version: "1.0.0",
    evaluate(ctx) {
      const ar = Number(ctx.signals.accountsReceivable ?? 0);
      if (ar <= 0) return null;
      return {
        severity: ar >= 10000 ? "Warning" : "Info",
        title: "Accounts receivable outstanding",
        description: `AR balance is $${ar.toFixed(2)}.`,
        suggestedNextStep: "Review aging buckets and trigger collection reminders.",
      };
    },
  },
  {
    id: "academyos.finance.payment_rate_low",
    domain: "finance",
    version: "1.0.0",
    evaluate(ctx) {
      const rate = Number(ctx.signals.paymentRate ?? 100);
      if (rate >= 85) return null;
      return {
        severity: rate < 60 ? "Critical" : "Warning",
        title: "Payment rate below target",
        description: `Only ${rate}% of issued invoices are fully paid.`,
        suggestedNextStep: "Enable AutoPay reminders and review overdue accounts.",
      };
    },
  },
  {
    id: "academyos.academic.waitlists",
    domain: "academic-ops",
    version: "1.0.0",
    evaluate(ctx) {
      const waitlists = Number(ctx.signals.academicWaitlists ?? 0);
      if (waitlists <= 0) return null;
      return {
        severity: waitlists >= 5 ? "Warning" : "Info",
        title: "Class waitlists active",
        description: `${waitlists} student(s) are waitlisted for classes.`,
        suggestedNextStep: "Review capacity and open additional sections.",
      };
    },
  },
  {
    id: "academyos.academic.session_cancellations",
    domain: "academic-ops",
    version: "1.0.0",
    evaluate(ctx) {
      const cancellations = Number(ctx.signals.sessionCancellations ?? 0);
      if (cancellations <= 0) return null;
      return {
        severity: cancellations >= 3 ? "Warning" : "Info",
        title: "Session cancellations",
        description: `${cancellations} instructional session(s) were cancelled.`,
        suggestedNextStep: "Schedule make-up sessions and notify families.",
      };
    },
  },
  {
    id: "academyos.sis.chronic_absenteeism",
    domain: "sis",
    version: "1.0.0",
    evaluate(ctx) {
      const chronic = Number(ctx.signals.chronicAbsenteeism ?? 0);
      if (chronic <= 0) return null;
      return {
        severity: chronic >= 5 ? "Warning" : "Info",
        title: "Chronic absenteeism detected",
        description: `${chronic} student(s) are below 90% monthly attendance.`,
        suggestedNextStep: "Notify families and schedule attendance interventions.",
      };
    },
  },
  {
    id: "academyos.sis.support_reviews_due",
    domain: "sis",
    version: "1.0.0",
    evaluate(ctx) {
      const due = Number(ctx.signals.supportPlanReviewsDue ?? 0);
      if (due <= 0) return null;
      return {
        severity: due >= 3 ? "Warning" : "Info",
        title: "Support plan reviews due",
        description: `${due} IEP/504/BSP review(s) need attention.`,
        suggestedNextStep: "Assign case managers and schedule review meetings.",
      };
    },
  },
  {
    id: "academyos.admissions.conversion_low",
    domain: "admissions",
    version: "1.0.0",
    evaluate(ctx) {
      const rate = Number(ctx.signals.admissionsConversionRate ?? 100);
      const inquiries = Number(ctx.signals.admissionsInquiries ?? 0);
      if (inquiries < 5 || rate >= 25) return null;
      return {
        severity: rate < 10 ? "Warning" : "Info",
        title: "Admissions conversion below target",
        description: `Conversion rate is ${rate}% across ${inquiries} inquiries.`,
        suggestedNextStep: "Review stalled pipeline stages and missing documents.",
      };
    },
  },
  {
    id: "academyos.admissions.missing_documents",
    domain: "admissions",
    version: "1.0.0",
    evaluate(ctx) {
      const missing = Number(ctx.signals.missingDocuments ?? 0);
      if (missing <= 0) return null;
      return {
        severity: missing >= 5 ? "Warning" : "Info",
        title: "Applicants with missing documents",
        description: `${missing} applicant(s) have outstanding document requirements.`,
        suggestedNextStep: "Notify guardians via parent portal.",
      };
    },
  },
  {
    id: "academyos.attendance.low",
    domain: "education",
    version: "1.0.0",
    evaluate(ctx) {
      const rate = Number(ctx.signals.presentRate ?? 100);
      if (rate >= 90) return null;
      return {
        severity: rate < 80 ? "Critical" : "Warning",
        title: "Attendance below target",
        description: `Present rate is ${rate}% for organization ${ctx.organizationId}.`,
        suggestedNextStep: "Review absences and notify guardians.",
      };
    },
  },
  {
    id: "academyos.iep.active",
    domain: "education",
    version: "1.0.0",
    evaluate(ctx) {
      const active = Number(ctx.signals.activeIeps ?? 0);
      if (active <= 0) return null;
      return {
        severity: "Info",
        title: "Active IEP caseload",
        description: `${active} active IEP document(s) require compliance monitoring.`,
        suggestedNextStep: "Confirm upcoming IEP review dates.",
      };
    },
  },
]);

export function createAcademyOsInsightProvider(): InsightProvider {
  return {
    id: "academyos.education-insights",
    version: "1.0.0",
    rules: () => rules,
    evaluate(ctx: InsightEvaluationContext): readonly InsightDescriptor[] {
      const dash = buildEducationExecutiveDashboard(ctx.organizationId);
      const admissions = buildAdmissionsDashboard(ctx.organizationId);
      const sis = buildStudentSuccessSummary(ctx.organizationId);
      const academic = buildAcademicOperationsSummary(ctx.organizationId);
      const finance = buildFinancialOperationsSummary(ctx.organizationId);
      const learning = buildLearningProgressSummary(ctx.organizationId);
      const workforce = buildWorkforceSummary(ctx.organizationId);
      const communications = buildCommunicationsSummary(ctx.organizationId);
      const inquiries = Object.values(admissions.pipelineByStage).reduce(
        (a, b) => a + b,
        0
      );
      const enriched: InsightEvaluationContext = {
        ...ctx,
        signals: {
          ...ctx.signals,
          presentRate:
            sis.attendanceTrends.presentRate ||
            academic.attendanceRate ||
            dash.attendance.presentRate,
          activeIeps: dash.complianceStatus.activeIeps,
          activeStudents: sis.activeStudents || dash.studentOutcomes.activeStudents,
          admissionsConversionRate: admissions.conversionRate,
          admissionsInquiries: inquiries,
          missingDocuments: admissions.missingDocuments,
          chronicAbsenteeism: sis.attendanceTrends.chronicAbsenteeismCount,
          supportPlanReviewsDue: sis.supportPlanReviewsDue,
          graduationProgressAvg:
            learning.graduationReadinessAverage ||
            sis.graduationProgress.averagePercent,
          academicWaitlists: academic.waitlistTotal,
          sessionCancellations: academic.cancellations,
          classesToday: academic.classesToday,
          teacherUtilization:
            workforce.teacherUtilization || academic.teacherUtilization,
          instructionalHours: academic.instructionalHoursDelivered,
          accountsReceivable: finance.accountsReceivable,
          paymentRate: finance.paymentRate,
          outstandingTuition: finance.outstandingTuition,
          scholarshipFunding: finance.scholarshipFunding,
          currentMonthRevenue: finance.currentMonthRevenue,
          studentsNeedingIntervention: learning.studentsNeedingIntervention,
          assessmentCompletionRate: learning.assessmentCompletionRate,
          studentsMasteringObjectives: learning.studentsMasteringObjectives,
          certificationExpirations: workforce.certificationExpirations,
          openPositions: workforce.openPositions,
          workforceHeadcount: workforce.headcount,
          payrollTotals: workforce.payrollTotals,
          substituteUsage: workforce.substituteUsage,
          growthTrendPercent: learning.growthTrendPercent,
          literacyProgressionAverage: learning.literacyProgressionAverage,
          deliveryRate: communications.deliveryRate,
          openRate: communications.openRate,
          responseRate: communications.responseRate,
          outstandingWorkflows: communications.outstandingWorkflows,
          failedNotifications: communications.failedNotifications,
          notificationsCreated: communications.trends.notificationsCreated,
          messagesSent: communications.trends.messagesSent,
        },
      };
      const now = ctx.asOf || new Date().toISOString();
      const out: InsightDescriptor[] = [];
      for (const rule of rules) {
        const hit = rule.evaluate(enriched);
        if (!hit) continue;
        out.push({
          id: `${rule.id}:${ctx.organizationId}:${now}`,
          organizationId: ctx.organizationId,
          ruleId: rule.id,
          severity: hit.severity,
          title: hit.title,
          description: hit.description,
          domain: rule.domain,
          createdAt: now,
        });
      }
      return Object.freeze(out);
    },
    format(insight) {
      return `[${insight.severity}] ${insight.title}: ${insight.description}`;
    },
  };
}
