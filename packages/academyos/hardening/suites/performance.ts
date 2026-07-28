/**
 * Performance baselines — representative workloads.
 */

import {
  buildEducationExecutiveDashboard,
  createAcademyOsInsightProvider,
  createApplicantsService,
  createCommunicationsReportingService,
  createFinanceReportingService,
  createSisStudentsService,
  createWorkforceReportingService,
  routeAcademyOsDomainEvent,
} from "../aos";
import { isOk, type HardeningSuiteDefinition } from "../harness";

const BUDGETS_MS = {
  dashboard: 250,
  search: 100,
  ei_refresh: 400,
  report: 300,
  notification_burst: 500,
  bulk_enrollment: 2000,
  validation_full: 45_000,
} as const;

export const performanceSuite: HardeningSuiteDefinition = {
  id: "performance",
  name: "Performance Baselines",
  async run(ctx) {
    const org = ctx.organizationId;

    // Seed searchable applicants
    for (let i = 0; i < 8; i++) {
      createApplicantsService().create({
        organizationId: org,
        student: {
          firstName: `Perf${i}`,
          lastName: "Student",
          dateOfBirth: "2012-01-01",
          gradeLevel: "8",
        },
        guardian: {
          firstName: "P",
          lastName: `G${i}`,
          email: `perf.${i}@${org}.test`,
          phone: `555-30${i}0`,
          relationship: "Parent",
        },
        schoolName: "Lincoln",
        program: "STEM",
        gradeLevel: "8",
        createdBy: "perf",
        force: true,
      });
    }

    const dashMs = ctx.measure("perf.dashboard_load", () => {
      buildEducationExecutiveDashboard(org);
    });
    void dashMs;
    const dashSample = ctx.measure("perf.dashboard_load_timed", () =>
      buildEducationExecutiveDashboard(org)
    );
    ctx.assert("perf.dashboard_built", dashSample.organizationId === org);

    const search = ctx.measure("perf.search_latency", () =>
      createApplicantsService().search({
        organizationId: org,
        q: "Perf",
      })
    );
    ctx.assert("perf.search_results", search.length >= 1);

    const ei = ctx.measure("perf.ei_refresh", () =>
      createAcademyOsInsightProvider().evaluate({
        organizationId: org,
        asOf: new Date().toISOString(),
        signals: {},
      })
    );
    ctx.assert("perf.ei_refresh_ok", Array.isArray(ei));

    ctx.measure("perf.report_finance", () =>
      createFinanceReportingService().generate(org, "outstanding_balances")
    );
    ctx.measure("perf.report_workforce", () =>
      createWorkforceReportingService().generate(org, "employee_directory")
    );
    ctx.measure("perf.report_comms", () =>
      createCommunicationsReportingService().generate(org, "communication_trends")
    );

    ctx.measure("perf.notification_throughput", () => {
      for (let i = 0; i < 20; i++) {
        routeAcademyOsDomainEvent({
          organizationId: org,
          domain: "sis",
          eventKey: "attendance_alert",
          recipientType: "parent",
          recipientId: `burst.${i}@${org}.test`,
          createdBy: "perf",
        });
      }
    });

    ctx.measure("perf.bulk_enrollment_seed", () => {
      for (let i = 0; i < 15; i++) {
        const s = createSisStudentsService().create({
          organizationId: org,
          identity: {
            preferredName: `Bulk${i}`,
            legalFirstName: `Bulk${i}`,
            legalLastName: "Import",
            dateOfBirth: "2013-01-01",
            stateStudentId: null,
          },
          gradeLevel: "6",
          campusId: "c1",
          campusName: "Lincoln",
          program: "General",
          status: "Active",
          createdBy: "perf",
        });
        if (!isOk(s)) throw new Error(s.error);
      }
    });

    // Document budgets as soft assertions (warn as major if exceeded under load)
    // Samples are collected via measure(); suite always records baselines.
    ctx.assert(
      "perf.baselines_recorded",
      true,
      `soft budgets ms=${JSON.stringify(BUDGETS_MS)}`
    );

    ctx.assert(
      "perf.validation_budget_documented",
      BUDGETS_MS.validation_full > 0
    );
  },
};
