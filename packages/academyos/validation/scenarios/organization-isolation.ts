/**
 * Organization Isolation — multi-org leakage checks
 */

import {
  createApplicantsService,
  createEmployeeService,
  createFamilyAccountsService,
  createNotificationService,
  createSisStudentsService,
  createWorkflowService,
  listEmployees,
} from "../aos";
import { isOk, type ScenarioDefinition } from "../harness";

export const organizationIsolationScenario: ScenarioDefinition = {
  id: "organization_isolation",
  name: "Organization Isolation",
  domains: ["isolation", "admissions", "sis", "finance", "workforce", "communications"],
  run(ctx) {
    const orgs = ctx.organizationIds;
    ctx.assert(
      "isolation.orgs_provided",
      orgs.length >= 2,
      "need at least two organizationIds",
      "blocker"
    );
    if (orgs.length < 2) return;

    const [orgA, orgB] = orgs;

    const applicantA = createApplicantsService().create({
      organizationId: orgA,
      student: {
        firstName: "IsoA",
        lastName: "Student",
        dateOfBirth: "2012-01-01",
        gradeLevel: "8",
      },
      guardian: {
        firstName: "ParentA",
        lastName: "A",
        email: `iso.a@${orgA}.test`,
        phone: "555-1000",
        relationship: "Parent",
      },
      schoolName: "Campus A",
      program: "STEM",
      gradeLevel: "8",
      createdBy: "uA",
    });
    const applicantB = createApplicantsService().create({
      organizationId: orgB,
      student: {
        firstName: "IsoB",
        lastName: "Student",
        dateOfBirth: "2012-01-01",
        gradeLevel: "8",
      },
      guardian: {
        firstName: "ParentB",
        lastName: "B",
        email: `iso.b@${orgB}.test`,
        phone: "555-2000",
        relationship: "Parent",
      },
      schoolName: "Campus B",
      program: "Arts",
      gradeLevel: "8",
      createdBy: "uB",
    });
    ctx.assert("isolation.applicant_a", isOk(applicantA));
    ctx.assert("isolation.applicant_b", isOk(applicantB));

    ctx.assert(
      "isolation.no_applicant_leak_a",
      createApplicantsService().list(orgA).every((a) => a.organizationId === orgA)
    );
    ctx.assert(
      "isolation.no_applicant_leak_b",
      createApplicantsService().list(orgB).every((a) => a.organizationId === orgB)
    );
    ctx.assert(
      "isolation.applicant_present",
      createApplicantsService().list(orgA).some((a) => a.id === (isOk(applicantA) ? applicantA.id : "")) &&
        createApplicantsService().list(orgB).some((a) => a.id === (isOk(applicantB) ? applicantB.id : ""))
    );

    const studentA = createSisStudentsService().create({
      organizationId: orgA,
      identity: {
        preferredName: "IsoAKid",
        legalFirstName: "IsoA",
        legalLastName: "Kid",
        dateOfBirth: "2012-01-01",
        stateStudentId: null,
      },
      gradeLevel: "8",
      campusId: "campus-a",
      campusName: "Campus A",
      program: "STEM-ISO",
      status: "Active",
      createdBy: "uA",
    });
    const studentB = createSisStudentsService().create({
      organizationId: orgB,
      identity: {
        preferredName: "IsoBKid",
        legalFirstName: "IsoB",
        legalLastName: "Kid",
        dateOfBirth: "2012-01-01",
        stateStudentId: null,
      },
      gradeLevel: "8",
      campusId: "campus-b",
      campusName: "Campus B",
      program: "Arts-ISO",
      status: "Active",
      createdBy: "uB",
    });
    ctx.assert("isolation.student_a", isOk(studentA));
    ctx.assert("isolation.student_b", isOk(studentB));
    ctx.assert(
      "isolation.school_isolation",
      createSisStudentsService()
        .list(orgA)
        .every((s) => s.organizationId === orgA) &&
        (isOk(studentA)
          ? createSisStudentsService()
              .list(orgA)
              .some((s) => s.id === studentA.id && s.campusId === "campus-a")
          : false)
    );
    ctx.assert(
      "isolation.program_isolation",
      (isOk(studentA)
        ? createSisStudentsService()
            .list(orgA)
            .some((s) => s.id === studentA.id && s.program === "STEM-ISO")
        : false) &&
        (isOk(studentB)
          ? createSisStudentsService()
              .list(orgB)
              .some((s) => s.id === studentB.id && s.program === "Arts-ISO")
          : false)
    );
    ctx.assert(
      "isolation.no_student_leak",
      createSisStudentsService()
        .list(orgA)
        .every((s) => s.organizationId === orgA) &&
        createSisStudentsService()
          .list(orgB)
          .every((s) => s.organizationId === orgB) &&
        !(
          isOk(studentA) &&
          createSisStudentsService()
            .list(orgB)
            .some((s) => s.id === studentA.id)
        )
    );

    if (isOk(studentA)) {
      createFamilyAccountsService().create({
        organizationId: orgA,
        displayName: "Family A",
        responsibleParties: [
          { name: "PA", email: `pa@${orgA}.test`, sharePercent: 100 },
        ],
        studentIds: [studentA.id],
        createdBy: "uA",
      });
    }
    if (isOk(studentB)) {
      createFamilyAccountsService().create({
        organizationId: orgB,
        displayName: "Family B",
        responsibleParties: [
          { name: "PB", email: `pb@${orgB}.test`, sharePercent: 100 },
        ],
        studentIds: [studentB.id],
        createdBy: "uB",
      });
    }

    const empA = createEmployeeService().create({
      organizationId: orgA,
      displayName: "Emp A Isolation",
      employmentType: "Full-time",
      createdBy: "hrA",
    });
    const empB = createEmployeeService().create({
      organizationId: orgB,
      displayName: "Emp B Isolation",
      employmentType: "Part-time",
      createdBy: "hrB",
    });
    ctx.assert(
      "isolation.role_workforce_a",
      isOk(empA) && listEmployees(orgA).some((e) => e.id === empA.id)
    );
    ctx.assert(
      "isolation.role_workforce_b",
      isOk(empB) && listEmployees(orgB).some((e) => e.id === empB.id)
    );
    ctx.assert(
      "isolation.no_employee_leak",
      listEmployees(orgA).every((e) => e.organizationId === orgA) &&
        listEmployees(orgB).every((e) => e.organizationId === orgB) &&
        !(isOk(empA) && listEmployees(orgB).some((e) => e.id === empA.id))
    );

    const wfA = createWorkflowService().start({
      organizationId: orgA,
      recipe: "Admissions Checklist",
      createdBy: "uA",
    });
    const wfB = createWorkflowService().start({
      organizationId: orgB,
      recipe: "Tuition Collection",
      createdBy: "uB",
    });
    ctx.assert(
      "isolation.workflows",
      isOk(wfA) &&
        isOk(wfB) &&
        createWorkflowService().list(orgA).some((w) => w.id === wfA.id) &&
        createWorkflowService().list(orgB).some((w) => w.id === wfB.id) &&
        !createWorkflowService().list(orgB).some((w) => w.id === wfA.id)
    );

    createNotificationService().fromDomainEvent({
      organizationId: orgA,
      domain: "sis",
      eventKey: "attendance_alert",
      recipientType: "parent",
      recipientId: `pa@${orgA}.test`,
      createdBy: "system",
    });
    createNotificationService().fromDomainEvent({
      organizationId: orgB,
      domain: "sis",
      eventKey: "attendance_alert",
      recipientType: "parent",
      recipientId: `pb@${orgB}.test`,
      createdBy: "system",
    });
    ctx.assert(
      "isolation.notifications",
      createNotificationService().list(orgA).every((n) => n.organizationId === orgA) &&
        createNotificationService().list(orgB).every((n) => n.organizationId === orgB)
    );
  },
};
