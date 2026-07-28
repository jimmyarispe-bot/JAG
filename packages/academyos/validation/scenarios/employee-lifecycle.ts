/**
 * Scenario 3 — Employee Lifecycle
 */

import {
  buildEducationExecutiveDashboard,
  buildWorkforceSummary,
  createAssignmentService,
  createCertificationService,
  createEmployeeService,
  createPayrollPreparationService,
  createPerformanceService,
  createPositionService,
  createTimekeepingService,
  createWorkflowService,
  routeAcademyOsDomainEvent,
} from "../aos";
import { isOk, type ScenarioDefinition } from "../harness";

export const employeeLifecycleScenario: ScenarioDefinition = {
  id: "employee_lifecycle",
  name: "Employee Lifecycle",
  domains: ["workforce", "communications", "executive"],
  run(ctx) {
    const org = ctx.organizationId;

    const onboarding = createWorkflowService().start({
      organizationId: org,
      recipe: "Employee Onboarding",
      createdBy: "hr1",
    });
    ctx.assert("workforce.candidate_workflow", isOk(onboarding));

    const position = createPositionService().create({
      organizationId: org,
      title: "Structured Literacy Teacher",
      department: "Academics",
      createdBy: "hr1",
    });
    ctx.assert("workforce.position", isOk(position), undefined, "blocker");
    if (!isOk(position)) return;

    const employee = createEmployeeService().create({
      organizationId: org,
      displayName: "Jamie Chen",
      email: `jamie.${org}@academy.test`,
      employmentType: "Full-time",
      campusId: "c1",
      campusName: "Lincoln",
      department: "Academics",
      positionId: position.id,
      annualSalary: 52000,
      createdBy: "hr1",
    });
    ctx.assert("workforce.employee", isOk(employee), undefined, "blocker");
    if (!isOk(employee)) return;

    const assignment = createAssignmentService().assign({
      organizationId: org,
      employeeId: employee.id,
      kind: "Class",
      targetId: "class-1",
      targetName: "SL Cohort A",
      startsOn: "2026-07-01",
      createdBy: "hr1",
    });
    ctx.assert("workforce.assignment", isOk(assignment));

    const cert = createCertificationService().create({
      organizationId: org,
      employeeId: employee.id,
      kind: "Structured Literacy Credential",
      name: "SL Credential",
      expiresOn: new Date(Date.now() + 20 * 86_400_000).toISOString().slice(0, 10),
      createdBy: "hr1",
    });
    ctx.assert("workforce.certification", isOk(cert));
    if (isOk(cert)) {
      ctx.assert(
        "workforce.cert_reminder_status",
        cert.status === "Expiring Soon" || cert.status === "Valid"
      );
    }

    const certNotif = routeAcademyOsDomainEvent({
      organizationId: org,
      domain: "workforce",
      eventKey: "certification_expiring",
      recipientType: "employee",
      recipientId: employee.id,
      employeeId: employee.id,
      createdBy: "system",
    });
    ctx.assert(
      "communications.cert_reminder",
      Array.isArray(certNotif) && certNotif.length > 0
    );

    const timesheet = createTimekeepingService().create({
      organizationId: org,
      employeeId: employee.id,
      weekStarting: "2026-07-20",
      createdBy: "hr1",
    });
    ctx.assert("workforce.timesheet", isOk(timesheet), undefined, "blocker");
    if (!isOk(timesheet)) return;

    createTimekeepingService().addEntry({
      organizationId: org,
      timesheetId: timesheet.id,
      entry: {
        date: "2026-07-21",
        minutes: 300,
        source: "Manual",
        sessionId: null,
        notes: "Instruction",
      },
      actor: employee.id,
    });
    const submitted = createTimekeepingService().submit({
      organizationId: org,
      timesheetId: timesheet.id,
      actor: employee.id,
    });
    ctx.assert("workforce.timesheet_submit", isOk(submitted));

    const approved = ctx.measure("employee_lifecycle.timesheet_approve", () =>
      createTimekeepingService().approve({
        organizationId: org,
        timesheetId: timesheet.id,
        actor: "leader",
        isSchoolLeader: true,
      })
    );
    ctx.assert("workforce.timesheet_approve", isOk(approved), undefined, "blocker");
    if (isOk(approved)) {
      ctx.assert("workforce.payroll_lock", approved.locked === true);
    }

    const approveNotif = routeAcademyOsDomainEvent({
      organizationId: org,
      domain: "workforce",
      eventKey: "timesheet_approved",
      recipientType: "employee",
      recipientId: employee.id,
      employeeId: employee.id,
      createdBy: "leader",
    });
    ctx.assert(
      "communications.timesheet_approved",
      Array.isArray(approveNotif) && approveNotif.length > 0
    );

    const payroll = createPayrollPreparationService().prepare({
      organizationId: org,
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      virtualSessions: [
        {
          employeeId: employee.id,
          programKey: "structured_literacy",
          studentCount: 3,
        },
      ],
      createdBy: "hr1",
    });
    ctx.assert("workforce.payroll_prep", payroll.lines.length >= 1);
    ctx.assert(
      "workforce.payroll_rules",
      (payroll.lines[0]?.virtualSessionAmount ?? 0) === 45
    );

    const review = createPerformanceService().create({
      organizationId: org,
      employeeId: employee.id,
      kind: "Annual Review",
      title: "2026 Review",
      reviewedOn: "2026-06-15",
      createdBy: "hr1",
    });
    ctx.assert("workforce.performance", isOk(review));

    const summary = buildWorkforceSummary(org);
    const dash = buildEducationExecutiveDashboard(org);
    ctx.assert("executive.workforce_insights", summary.headcount >= 1);
    ctx.assert(
      "executive.workforce_dashboard",
      dash.workforceSummary.headcount === summary.headcount
    );
  },
};
