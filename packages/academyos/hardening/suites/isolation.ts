/**
 * Multi-tenant isolation regression (RC-2 hardening gate).
 */

import {
  createApplicantsService,
  createEmployeeService,
  createNotificationService,
  createSisStudentsService,
  listEmployees,
} from "../aos";
import { isOk, type HardeningSuiteDefinition } from "../harness";

export const multiTenantIsolationSuite: HardeningSuiteDefinition = {
  id: "multi_tenant_isolation",
  name: "Multi-Tenant Isolation",
  run(ctx) {
    const orgs = ctx.organizationIds;
    ctx.assert("mt.orgs", orgs.length >= 2, undefined, "blocker");
    if (orgs.length < 2) return;
    const [orgA, orgB] = orgs;

    const a = createApplicantsService().create({
      organizationId: orgA,
      student: {
        firstName: "MtA",
        lastName: "Kid",
        dateOfBirth: "2012-01-01",
        gradeLevel: "7",
      },
      guardian: {
        firstName: "G",
        lastName: "A",
        email: `mt.a@${orgA}.test`,
        phone: "555-7001",
        relationship: "Parent",
      },
      schoolName: "A",
      program: "STEM",
      gradeLevel: "7",
      createdBy: "uA",
    });
    const b = createApplicantsService().create({
      organizationId: orgB,
      student: {
        firstName: "MtB",
        lastName: "Kid",
        dateOfBirth: "2012-01-01",
        gradeLevel: "7",
      },
      guardian: {
        firstName: "G",
        lastName: "B",
        email: `mt.b@${orgB}.test`,
        phone: "555-7002",
        relationship: "Parent",
      },
      schoolName: "B",
      program: "Arts",
      gradeLevel: "7",
      createdBy: "uB",
    });
    ctx.assert("mt.applicants", isOk(a) && isOk(b), undefined, "blocker");
    if (!isOk(a) || !isOk(b)) return;

    ctx.assert(
      "mt.no_applicant_leak",
      !createApplicantsService().list(orgA).some((x) => x.id === b.id) &&
        !createApplicantsService().list(orgB).some((x) => x.id === a.id),
      undefined,
      "blocker"
    );

    const sa = createSisStudentsService().create({
      organizationId: orgA,
      identity: {
        preferredName: "MtSA",
        legalFirstName: "Mt",
        legalLastName: "SA",
        dateOfBirth: "2012-01-01",
        stateStudentId: null,
      },
      gradeLevel: "7",
      campusId: "camp-a",
      campusName: "A",
      program: "STEM",
      status: "Active",
      createdBy: "uA",
    });
    const sb = createSisStudentsService().create({
      organizationId: orgB,
      identity: {
        preferredName: "MtSB",
        legalFirstName: "Mt",
        legalLastName: "SB",
        dateOfBirth: "2012-01-01",
        stateStudentId: null,
      },
      gradeLevel: "7",
      campusId: "camp-b",
      campusName: "B",
      program: "Arts",
      status: "Active",
      createdBy: "uB",
    });
    ctx.assert("mt.students", isOk(sa) && isOk(sb));
    if (isOk(sa) && isOk(sb)) {
      ctx.assert(
        "mt.school_program_isolation",
        createSisStudentsService()
          .list(orgA)
          .filter((s) => s.id === sa.id)
          .every((s) => s.campusId === "camp-a" && s.program === "STEM") &&
          createSisStudentsService()
            .list(orgB)
            .filter((s) => s.id === sb.id)
            .every((s) => s.campusId === "camp-b" && s.program === "Arts"),
        undefined,
        "critical"
      );
    }

    const ea = createEmployeeService().create({
      organizationId: orgA,
      displayName: "Mt Emp A",
      employmentType: "Full-time",
      createdBy: "hrA",
    });
    const eb = createEmployeeService().create({
      organizationId: orgB,
      displayName: "Mt Emp B",
      employmentType: "Part-time",
      createdBy: "hrB",
    });
    ctx.assert(
      "mt.workforce_isolation",
      isOk(ea) &&
        isOk(eb) &&
        !listEmployees(orgA).some((e) => e.id === eb.id) &&
        !listEmployees(orgB).some((e) => e.id === ea.id),
      undefined,
      "blocker"
    );

    createNotificationService().fromDomainEvent({
      organizationId: orgA,
      domain: "sis",
      eventKey: "attendance_alert",
      recipientType: "parent",
      recipientId: `mt.a@${orgA}.test`,
      createdBy: "system",
    });
    ctx.assert(
      "mt.notification_isolation",
      createNotificationService()
        .list(orgA)
        .every((n) => n.organizationId === orgA) &&
        !createNotificationService()
          .list(orgB)
          .some((n) => n.recipientId === `mt.a@${orgA}.test`)
    );
  },
};
