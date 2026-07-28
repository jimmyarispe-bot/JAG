/**
 * Demo Organization — in-pack seed exercising major AcademyOS workflows.
 * Uses pack stores only (no production DB writes).
 */

import { installAcademyOsIndustryPack } from "../../install";
import {
  createApplicantsService,
  createClassesService,
  createClassEnrollmentService,
  createEmployeeService,
  createFamiliesService,
  createFamilyAccountsService,
  createFinanceBillingService,
  createGuardiansService,
  createNotificationService,
  createSchoolsService,
  createSisAttendanceService,
  createSisStudentsService,
  createStaffService,
  createStudentsService,
  createTeachersService,
  createTuitionService,
} from "../aos";
import type { DemoOrganizationSeed, OperationsRunOptions } from "../types";

function ok<T extends object>(value: T | { error: string }): value is T {
  return value != null && !("error" in value);
}

export function seedDemoOrganization(
  options: OperationsRunOptions = {}
): DemoOrganizationSeed {
  const organizationId =
    options.organizationId ?? "org.academyos.demo.rc3";
  const actor = "ops.demo.seed";

  installAcademyOsIndustryPack({
    organizationId,
    freshSdk: true,
  });

  const schools = createSchoolsService();
  const campusA = schools.create({
    organizationId,
    name: "Demo Academy — North Campus",
    code: "DEMO-N",
    createdBy: actor,
  });
  const campusB = schools.create({
    organizationId,
    name: "Demo Academy — South Campus",
    code: "DEMO-S",
    createdBy: actor,
  });

  const admin = createStaffService().create({
    organizationId,
    firstName: "Riley",
    lastName: "Admin",
    role: "Admin",
    schoolId: ok(campusA) ? campusA.id : null,
    createdBy: actor,
  });

  const teacher = createTeachersService().create({
    organizationId,
    displayName: "Casey Teacher",
    email: `teacher@${organizationId}.example`,
    campusIds: ok(campusA) ? [campusA.id] : [],
    subjects: ["Math"],
    createdBy: actor,
  });

  const employee = createEmployeeService().create({
    organizationId,
    displayName: "Taylor Employee",
    email: `hr@${organizationId}.example`,
    employmentType: "Full-time",
    campusId: ok(campusA) ? campusA.id : null,
    campusName: ok(campusA) ? campusA.name : null,
    department: "Operations",
    createdBy: actor,
  });

  const domainStudent = createStudentsService().create({
    organizationId,
    firstName: "Jamie",
    lastName: "Student",
    schoolId: ok(campusA) ? campusA.id : null,
    gradeLevel: "7",
    createdBy: actor,
  });

  const sisStudent = createSisStudentsService().create({
    organizationId,
    identity: {
      preferredName: "Jamie",
      legalFirstName: "Jamie",
      legalLastName: "Student",
      dateOfBirth: "2013-04-12",
      stateStudentId: null,
      internalAcademyId: ok(domainStudent) ? domainStudent.id : undefined,
    },
    gradeLevel: "7",
    campusId: ok(campusA) ? campusA.id : "demo-campus",
    campusName: ok(campusA) ? campusA.name : "Demo Academy",
    program: "Core",
    status: "Active",
    createdBy: actor,
  });

  const parent = createGuardiansService().create({
    organizationId,
    firstName: "Morgan",
    lastName: "Parent",
    studentIds: ok(domainStudent) ? [domainStudent.id] : [],
    createdBy: actor,
  });

  if (ok(sisStudent)) {
    createFamiliesService().add({
      organizationId,
      studentId: sisStudent.id,
      kind: "Parent",
      firstName: "Morgan",
      lastName: "Parent",
      email: `parent@${organizationId}.example`,
      phone: "555-0142",
      relationship: "Parent",
      createdBy: actor,
    });
  }

  const klass =
    ok(teacher) &&
    createClassesService().create({
      organizationId,
      name: "Grade 7 Homeroom",
      subject: "Homeroom",
      teacherId: teacher.id,
      schoolId: ok(campusA) ? campusA.id : null,
      campusId: ok(campusA) ? campusA.id : null,
      gradeLevels: ["7"],
      capacity: 24,
      schedule: [
        {
          dayOfWeek: 1,
          startTime: "08:00",
          endTime: "08:30",
        },
      ],
      createdBy: actor,
    });

  if (ok(sisStudent) && klass && ok(klass)) {
    createClassEnrollmentService().assign({
      organizationId,
      studentId: sisStudent.id,
      classId: klass.id,
      className: klass.name,
      kind: "Class",
      teacherId: ok(teacher) ? teacher.id : null,
      campusId: ok(campusA) ? campusA.id : null,
      startsOn: "2026-01-01",
      createdBy: actor,
    });
    createSisAttendanceService().record({
      organizationId,
      studentId: sisStudent.id,
      classId: klass.id,
      teacherId: ok(teacher) ? teacher.id : null,
      status: "Present",
      date: new Date().toISOString().slice(0, 10),
      createdBy: actor,
    });
  }

  const applicants = createApplicantsService();
  const applicant = applicants.create({
    organizationId,
    student: {
      firstName: "Avery",
      lastName: "Applicant",
      dateOfBirth: "2014-01-20",
      gradeLevel: "6",
    },
    guardian: {
      firstName: "Quinn",
      lastName: "Applicant",
      email: `quinn@${organizationId}.example`,
      phone: "555-0199",
      relationship: "Parent",
    },
    schoolName: "Demo Academy — North Campus",
    program: "Core",
    gradeLevel: "6",
    createdBy: actor,
  });
  if (ok(applicant)) {
    for (const stage of [
      "Application Submitted",
      "Document Review",
      "Assessment Scheduled",
      "Assessment Complete",
      "Admissions Review",
      "Accepted",
    ] as const) {
      applicants.transition({
        organizationId,
        applicantId: applicant.id,
        stage,
        actor,
      });
    }
  }

  let tuitionInvoices = 0;
  if (ok(sisStudent)) {
    const plan = createTuitionService().createPlan({
      organizationId,
      name: "Demo Monthly",
      frequency: "Monthly",
      baseAmount: 1250,
      program: "Core",
      campusId: ok(campusA) ? campusA.id : null,
      effectiveFrom: "2026-01-01",
      createdBy: actor,
    });
    const account = createFamilyAccountsService().create({
      organizationId,
      displayName: "Student Family Account",
      responsibleParties: [
        {
          name: "Morgan Parent",
          email: `parent@${organizationId}.example`,
          sharePercent: 100,
        },
      ],
      studentIds: [sisStudent.id],
      createdBy: actor,
    });
    if (ok(plan) && ok(account)) {
      createTuitionService().assignSchedule({
        organizationId,
        tuitionPlanId: plan.id,
        familyAccountId: account.id,
        studentId: sisStudent.id,
        startsOn: "2026-01-01",
        createdBy: actor,
      });
      const invoice = createFinanceBillingService().generateTuitionInvoice({
        organizationId,
        familyAccountId: account.id,
        studentId: sisStudent.id,
        periodMonth: "2026-07",
        createdBy: actor,
      });
      if (ok(invoice)) tuitionInvoices = 1;
    }
  }

  createNotificationService().fromDomainEvent({
    organizationId,
    domain: "admissions",
    eventKey: "enrollment_accepted",
    recipientType: "parent",
    recipientId: ok(parent) ? parent.id : "demo-parent",
    title: "Welcome to Demo Academy",
    body: "RC-3 demo organization seeded.",
    createdBy: actor,
    channel: "email",
  });

  const workflowsExercised = [
    "organization.install",
    "campuses.create",
    "administrators.create",
    "teachers.create",
    "students.create",
    "parents.link",
    "classes.create",
    "enrollments.create",
    "admissions.applicant",
    "tuition.invoice",
    "employees.create",
    "attendance.record",
    "notifications.dispatch",
  ] as const;

  const counts = {
    campuses: [campusA, campusB].filter(ok).length,
    administrators: ok(admin) ? 1 : 0,
    teachers: ok(teacher) ? 1 : 0,
    students: ok(sisStudent) || ok(domainStudent) ? 1 : 0,
    parents: ok(parent) ? 1 : 0,
    classes: klass && ok(klass) ? 1 : 0,
    enrollments: ok(sisStudent) && klass && ok(klass) ? 1 : 0,
    tuitionInvoices,
    employees: ok(employee) ? 1 : 0,
    applicants: ok(applicant) ? 1 : 0,
  };

  return {
    organizationId,
    createdAt: new Date().toISOString(),
    counts: Object.freeze(counts),
    workflowsExercised: Object.freeze([...workflowsExercised]),
    summary: `Demo org ${organizationId} seeded with ${Object.values(counts).reduce((a, b) => a + b, 0)} entities across major workflows`,
  };
}
