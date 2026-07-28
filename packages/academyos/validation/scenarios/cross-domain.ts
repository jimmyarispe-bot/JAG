/**
 * Cross-Domain Event Validation
 */

import {
  createAssessmentService,
  createCurriculumService,
  createEmployeeService,
  createFamilyAccountsService,
  createFinanceBillingService,
  createNotificationService,
  createPayrollPreparationService,
  createSessionsService,
  createSisStudentsService,
  createClassesService,
  createTeachersService,
  createStudentSchedulingService,
  createTimekeepingService,
  createTuitionService,
  routeAcademyOsDomainEvent,
  createApplicantsService,
  createEnrollmentWizardService,
  createParentPortalService,
} from "../aos";
import { isOk, type ScenarioDefinition } from "../harness";

export const crossDomainScenario: ScenarioDefinition = {
  id: "cross_domain_events",
  name: "Cross-Domain Event Validation",
  domains: ["cross_domain", "admissions", "finance", "workforce", "learning", "academic_ops"],
  run(ctx) {
    const org = ctx.organizationId;

    // Enrollment → student record + family notification
    const applicant = createApplicantsService().create({
      organizationId: org,
      student: {
        firstName: "Cross",
        lastName: "Enroll",
        dateOfBirth: "2011-01-01",
        gradeLevel: "10",
      },
      guardian: {
        firstName: "Guard",
        lastName: "Enroll",
        email: `cross.${org}@example.com`,
        phone: "555-0400",
        relationship: "Parent",
      },
      schoolName: "Lincoln",
      program: "STEM",
      gradeLevel: "10",
      createdBy: "advisor1",
    });
    ctx.assert("xd.applicant", isOk(applicant), undefined, "blocker");
    if (!isOk(applicant)) return;

    for (const stage of [
      "Application Started",
      "Application Submitted",
      "Document Review",
      "Admissions Review",
      "Accepted",
    ] as const) {
      const t = createApplicantsService().transition({
        organizationId: org,
        applicantId: applicant.id,
        stage,
        actor: "advisor1",
      });
      if (!isOk(t)) {
        ctx.assert("xd.stage", false, t?.error, "blocker");
        return;
      }
    }

    const token = createApplicantsService().get(org, applicant.id)!.parentAccessToken;
    const wizardStart = createParentPortalService().acceptOffer({ token });
    if (!isOk(wizardStart)) {
      ctx.assert("xd.wizard", false, wizardStart.error, "blocker");
      return;
    }
    const wizardSvc = createEnrollmentWizardService();
    let wizard = wizardStart;
    for (const section of [
      "Student Information",
      "Parent/Guardian",
      "Emergency Contacts",
      "Medical Information",
      "Educational History",
      "Scholarships",
      "Tuition Plan",
      "Agreements & Policies",
    ] as const) {
      const saved = wizardSvc.save({
        organizationId: org,
        wizardId: wizard.id,
        actor: "parent",
        section,
        data: { [section]: "ok" },
        completeSection: true,
      });
      if (!isOk(saved)) return;
      wizard = saved;
    }
    wizardSvc.submit({
      organizationId: org,
      wizardId: wizard.id,
      actor: "parent",
    });

    const students = createSisStudentsService().list(org);
    ctx.assert("xd.enrollment_creates_student", students.length >= 1, undefined, "critical");
    const enrollNotif = routeAcademyOsDomainEvent({
      organizationId: org,
      domain: "admissions",
      eventKey: "enrollment_accepted",
      recipientType: "parent",
      recipientId: `cross.${org}@example.com`,
      studentId: students[0]?.id,
      createdBy: "system",
    });
    ctx.assert(
      "xd.enrollment_family_notification",
      Array.isArray(enrollNotif) && enrollNotif.length > 0
    );

    // Invoice → parent notification + finance insight path
    const student =
      students[0] ??
      (() => {
        const s = createSisStudentsService().create({
          organizationId: org,
          identity: {
            preferredName: "X",
            legalFirstName: "X",
            legalLastName: "Y",
            dateOfBirth: "2012-01-01",
            stateStudentId: null,
          },
          gradeLevel: "8",
          campusId: "c1",
          campusName: "Lincoln",
          program: "STEM",
          status: "Active",
          createdBy: "u1",
        });
        return isOk(s) ? s : null;
      })();
    if (!student) {
      ctx.assert("xd.student_for_invoice", false, undefined, "blocker");
      return;
    }

    const plan = createTuitionService().createPlan({
      organizationId: org,
      name: "XD Plan",
      frequency: "Monthly",
      baseAmount: 400,
      program: "STEM",
      campusId: "c1",
      effectiveFrom: "2026-01-01",
      createdBy: "u1",
    });
    if (!isOk(plan)) {
      ctx.assert("xd.plan", false, plan.error, "blocker");
      return;
    }
    const account = createFamilyAccountsService().create({
      organizationId: org,
      displayName: "XD Family",
      responsibleParties: [
        { name: "P", email: `xdpay.${org}@example.com`, sharePercent: 100 },
      ],
      studentIds: [student.id],
      createdBy: "u1",
    });
    if (!isOk(account)) {
      ctx.assert("xd.account", false, account.error, "blocker");
      return;
    }
    createTuitionService().assignSchedule({
      organizationId: org,
      tuitionPlanId: plan.id,
      familyAccountId: account.id,
      studentId: student.id,
      startsOn: "2026-01-01",
      createdBy: "u1",
    });
    const invoice = createFinanceBillingService().generateTuitionInvoice({
      organizationId: org,
      familyAccountId: account.id,
      studentId: student.id,
      periodMonth: "2026-07",
      createdBy: "u1",
    });
    ctx.assert("xd.invoice", isOk(invoice));
    const invNotif = routeAcademyOsDomainEvent({
      organizationId: org,
      domain: "finance",
      eventKey: "invoice_issued",
      recipientType: "parent",
      recipientId: `xdpay.${org}@example.com`,
      familyId: account.id,
      createdBy: "system",
    });
    ctx.assert("xd.invoice_notification", Array.isArray(invNotif) && invNotif.length > 0);
    ctx.assert(
      "xd.finance_insight_signal",
      createNotificationService().search({
        organizationId: org,
        domain: "finance",
      }).length > 0
    );

    // Timesheet approval → payroll queue
    const employee = createEmployeeService().create({
      organizationId: org,
      displayName: "XD Teacher",
      employmentType: "Full-time",
      annualSalary: 40000,
      createdBy: "hr1",
    });
    ctx.assert("xd.employee", isOk(employee), undefined, "blocker");
    if (!isOk(employee)) return;

    const ts = createTimekeepingService().create({
      organizationId: org,
      employeeId: employee.id,
      weekStarting: "2026-07-20",
      createdBy: "hr1",
    });
    if (!isOk(ts)) {
      ctx.assert("xd.timesheet", false, ts.error, "blocker");
      return;
    }
    createTimekeepingService().addEntry({
      organizationId: org,
      timesheetId: ts.id,
      entry: {
        date: "2026-07-21",
        minutes: 120,
        source: "Manual",
        sessionId: null,
        notes: "",
      },
      actor: employee.id,
    });
    createTimekeepingService().submit({
      organizationId: org,
      timesheetId: ts.id,
      actor: employee.id,
    });
    const approved = createTimekeepingService().approve({
      organizationId: org,
      timesheetId: ts.id,
      actor: "leader",
      isSchoolLeader: true,
    });
    ctx.assert("xd.timesheet_approved", isOk(approved));
    const payroll = createPayrollPreparationService().prepare({
      organizationId: org,
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      createdBy: "hr1",
    });
    ctx.assert(
      "xd.payroll_queue",
      payroll.lines.some((l) => l.employeeId === employee.id)
    );

    // Assessment completion → learning insight + parent message
    const curriculum = createCurriculumService().create({
      organizationId: org,
      name: "XD Curriculum",
      subject: "Reading",
      program: "STEM",
      campusId: "c1",
      gradeLevels: ["10"],
      publish: true,
      objectives: [
        {
          id: "obj-xd",
          code: "X.1",
          title: "XD",
          description: "XD",
          competencyId: null,
        },
      ],
      createdBy: "u1",
    });
    if (isOk(curriculum)) {
      createAssessmentService().record({
        organizationId: org,
        studentId: student.id,
        teacherId: employee.id,
        kind: "Formative",
        assessedOn: "2026-07-21",
        objectiveId: "obj-xd",
        curriculumId: curriculum.id,
        result: "Proficient",
        domain: "Reading",
        createdBy: "u1",
      });
    }
    const assessNotif = routeAcademyOsDomainEvent({
      organizationId: org,
      domain: "learning",
      eventKey: "assessment_completed",
      recipientType: "parent",
      recipientId: `cross.${org}@example.com`,
      studentId: student.id,
      createdBy: "system",
    });
    ctx.assert(
      "xd.assessment_parent_message",
      Array.isArray(assessNotif) && assessNotif.length > 0
    );

    // Teacher substitution → schedule update + notifications
    const aoTeacher = createTeachersService().create({
      organizationId: org,
      displayName: "Primary",
      subjects: ["Math"],
      campusIds: ["c1"],
      createdBy: "u1",
    });
    const subTeacher = createTeachersService().create({
      organizationId: org,
      displayName: "Substitute",
      subjects: ["Math"],
      campusIds: ["c1"],
      createdBy: "u1",
    });
    if (isOk(aoTeacher) && isOk(subTeacher)) {
      const cls = createClassesService().create({
        organizationId: org,
        name: "XD Math",
        subject: "Math",
        teacherId: aoTeacher.id,
        campusId: "c1",
        gradeLevels: ["10"],
        capacity: 10,
        schedule: [{ dayOfWeek: 1, startTime: "10:00", endTime: "10:50" }],
        isVirtual: false,
        createdBy: "u1",
      });
      if (isOk(cls)) {
        createStudentSchedulingService().assign({
          organizationId: org,
          classId: cls.id,
          studentId: student.id,
          kind: "Core",
          createdBy: "u1",
        });
        const sessionsResult = createSessionsService().generate({
          organizationId: org,
          classId: cls.id,
          startsOn: "2026-07-20",
          endsOn: "2026-07-20",
          createdBy: "u1",
        });
        const session =
          sessionsResult &&
          "sessions" in sessionsResult &&
          sessionsResult.sessions[0]
            ? sessionsResult.sessions[0]
            : null;
        if (session) {
          const sub = createSessionsService().substitute({
            organizationId: org,
            sessionId: session.id,
            substituteTeacherId: subTeacher.id,
            actor: "u1",
          });
          ctx.assert("xd.schedule_update", isOk(sub));
        } else {
          ctx.assert(
            "xd.session_for_sub",
            false,
            "no session generated",
            "major"
          );
        }
      }
    }

    const subNotif = routeAcademyOsDomainEvent({
      organizationId: org,
      domain: "academic_ops",
      eventKey: "teacher_substitution",
      recipientType: "parent",
      recipientId: `cross.${org}@example.com`,
      studentId: student.id,
      createdBy: "system",
    });
    ctx.assert(
      "xd.substitution_notification",
      Array.isArray(subNotif) && subNotif.length > 0
    );
  },
};
