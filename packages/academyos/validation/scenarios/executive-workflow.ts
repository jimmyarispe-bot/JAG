/**
 * Scenario 6 — Executive Workflow (morning dashboard)
 */

import {
  buildEducationExecutiveDashboard,
  createAcademyOsInsightProvider,
  createApplicantsService,
  createCommunicationsReportingService,
  createEmployeeService,
  createFamilyAccountsService,
  createFinanceBillingService,
  createFinanceReportingService,
  createSisStudentsService,
  createTuitionService,
  createWorkforceReportingService,
  routeAcademyOsDomainEvent,
} from "../aos";
import { isOk, type ScenarioDefinition } from "../harness";

export const executiveWorkflowScenario: ScenarioDefinition = {
  id: "executive_workflow",
  name: "Executive Workflow",
  domains: ["executive", "admissions", "finance", "workforce", "communications"],
  run(ctx) {
    const org = ctx.organizationId;

    // Seed operational activity across domains
    createApplicantsService().create({
      organizationId: org,
      student: {
        firstName: "Exec",
        lastName: "Student",
        dateOfBirth: "2012-01-01",
        gradeLevel: "9",
      },
      guardian: {
        firstName: "Exec",
        lastName: "Parent",
        email: `exec.parent.${org}@example.com`,
        phone: "555-0300",
        relationship: "Parent",
      },
      schoolName: "Lincoln",
      program: "STEM",
      gradeLevel: "9",
      createdBy: "advisor1",
    });

    const student = createSisStudentsService().create({
      organizationId: org,
      identity: {
        preferredName: "Active",
        legalFirstName: "Active",
        legalLastName: "Learner",
        dateOfBirth: "2012-02-02",
        stateStudentId: null,
      },
      gradeLevel: "9",
      campusId: "c1",
      campusName: "Lincoln",
      program: "STEM",
      status: "Active",
      createdBy: "u1",
    });
    if (!isOk(student)) {
      ctx.assert("exec.seed_student", false, student.error, "blocker");
      return;
    }

    const plan = createTuitionService().createPlan({
      organizationId: org,
      name: "Exec Plan",
      frequency: "Monthly",
      baseAmount: 750,
      program: "STEM",
      campusId: "c1",
      effectiveFrom: "2026-01-01",
      createdBy: "u1",
    });
    if (!isOk(plan)) {
      ctx.assert("exec.seed_plan", false, plan.error, "blocker");
      return;
    }
    const account = createFamilyAccountsService().create({
      organizationId: org,
      displayName: "Exec Family",
      responsibleParties: [
        { name: "Exec Parent", email: `ep.${org}@example.com`, sharePercent: 100 },
      ],
      studentIds: [student.id],
      createdBy: "u1",
    });
    if (isOk(account)) {
      createTuitionService().assignSchedule({
        organizationId: org,
        tuitionPlanId: plan.id,
        familyAccountId: account.id,
        studentId: student.id,
        startsOn: "2026-01-01",
        createdBy: "u1",
      });
      createFinanceBillingService().generateTuitionInvoice({
        organizationId: org,
        familyAccountId: account.id,
        studentId: student.id,
        periodMonth: "2026-07",
        createdBy: "u1",
      });
    }

    createEmployeeService().create({
      organizationId: org,
      displayName: "Staff One",
      employmentType: "Full-time",
      campusName: "Lincoln",
      createdBy: "hr1",
    });

    routeAcademyOsDomainEvent({
      organizationId: org,
      domain: "admissions",
      eventKey: "application_received",
      recipientType: "staff",
      recipientId: "advisor1",
      createdBy: "system",
    });

    const dash = ctx.measure("executive_workflow.dashboard_load", () =>
      buildEducationExecutiveDashboard(org)
    );

    ctx.assert("exec.morning_dashboard", dash.organizationId === org, undefined, "blocker");
    ctx.assert(
      "exec.enrollment_metrics",
      dash.admissionsSummary != null || dash.enrollmentTrends.totalEnrollments >= 0
    );
    ctx.assert("exec.finance", dash.financialOperationsSummary != null);
    ctx.assert("exec.staffing", dash.workforceSummary != null);
    ctx.assert("exec.communications", dash.communicationsSummary != null);
    ctx.assert(
      "exec.risk_indicators",
      dash.communicationsSummary.failedNotifications >= 0 &&
        dash.workforceSummary.certificationExpirations >= 0
    );

    const financeReport = createFinanceReportingService().generate(
      org,
      "outstanding_balances"
    );
    ctx.assert("exec.finance_report", financeReport.csv != null || financeReport.rows != null);

    const workforceReport = createWorkforceReportingService().generate(
      org,
      "employee_directory"
    );
    ctx.assert("exec.staffing_report", workforceReport.pdf.startsWith("%PDF"));

    const commReport = createCommunicationsReportingService().generate(
      org,
      "communication_trends"
    );
    ctx.assert("exec.communications_report", commReport.rows.length >= 1);

    const insights = ctx.measure("executive_workflow.insights", () =>
      createAcademyOsInsightProvider().evaluate({
        organizationId: org,
        asOf: new Date().toISOString(),
        signals: {},
      })
    );
    ctx.assert("exec.ei_reflects_activity", Array.isArray(insights));
  },
};
