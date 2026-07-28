/**
 * Scenario 1 — Student Journey (Lead → Parent notification)
 */

import { listJagPlatformEvents } from "@/lib/jag-platform/events";
import {
  buildEducationExecutiveDashboard,
  createApplicantsService,
  createAssessmentService,
  createClassesService,
  createCurriculumService,
  createEnrollmentWizardService,
  createGradebookService,
  createMasteryService,
  createParentPortalService,
  createProgressService,
  createSisAttendanceService,
  createSisStudentsService,
  createStudentSchedulingService,
  createTeachersService,
  listStudentTimeline,
  routeAcademyOsDomainEvent,
} from "../aos";
import { isOk, type ScenarioDefinition } from "../harness";

const STAGES = [
  "Application Started",
  "Application Submitted",
  "Document Review",
  "Assessment Scheduled",
  "Assessment Complete",
  "Admissions Review",
  "Accepted",
] as const;

export const studentJourneyScenario: ScenarioDefinition = {
  id: "student_journey",
  name: "Student Journey",
  domains: [
    "admissions",
    "sis",
    "academic_ops",
    "learning",
    "communications",
    "executive",
  ],
  run(ctx) {
    const org = ctx.organizationId;
    const applicants = createApplicantsService();

    const lead = ctx.measure("student_journey.create_applicant", () =>
      applicants.create({
        organizationId: org,
        student: {
          firstName: "Jordan",
          lastName: "Lee",
          dateOfBirth: "2012-05-01",
          gradeLevel: "8",
        },
        guardian: {
          firstName: "Alex",
          lastName: "Lee",
          email: `alex.lee.${org}@example.com`,
          phone: "555-0100",
          relationship: "Parent",
        },
        schoolName: "Lincoln",
        program: "STEM",
        gradeLevel: "8",
        createdBy: "advisor1",
      })
    );
    ctx.assert("lead.created", isOk(lead), isOk(lead) ? undefined : lead.error, "blocker");
    if (!isOk(lead)) return;

    let current = lead;
    for (const stage of STAGES) {
      const next = applicants.transition({
        organizationId: org,
        applicantId: current.id,
        stage,
        actor: "advisor1",
      });
      ctx.assert(
        `stage.${stage}`,
        isOk(next),
        isOk(next) ? undefined : next?.error ?? "transition failed",
        "blocker"
      );
      if (!isOk(next)) return;
      current = next;
    }
    ctx.assert("accepted", current.stage === "Accepted");

    const events = listJagPlatformEvents({ organizationId: org });
    ctx.assert(
      "events.admissions",
      events.some((e) => e.eventType.includes("admissions")),
      "expected admissions platform events"
    );

    const wizardStart = createParentPortalService().acceptOffer({
      token: current.parentAccessToken,
    });
    ctx.assert("enrollment.wizard_start", isOk(wizardStart), undefined, "blocker");
    if (!isOk(wizardStart)) return;

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
      if (!isOk(saved)) {
        ctx.assert(`enrollment.section.${section}`, false, saved?.error, "blocker");
        return;
      }
      wizard = saved;
    }

    const submitted = ctx.measure("student_journey.enroll_submit", () =>
      wizardSvc.submit({
        organizationId: org,
        wizardId: wizard.id,
        actor: "parent",
      })
    );
    ctx.assert("enrollment.submitted", isOk(submitted), undefined, "blocker");
    const enrolled = applicants.get(org, current.id);
    ctx.assert("enrollment.enrolled_stage", enrolled?.stage === "Enrolled");

    const students = createSisStudentsService().list(org);
    ctx.assert("sis.student_record", students.length >= 1, undefined, "blocker");
    const student = students[0]!;

    const teacher = createTeachersService().create({
      organizationId: org,
      displayName: "Ms. Rivera",
      subjects: ["Math"],
      campusIds: ["campus-1"],
      availability: [{ dayOfWeek: 1, startTime: "09:00", endTime: "15:00" }],
      createdBy: "u1",
    });
    ctx.assert("ao.teacher", isOk(teacher), undefined, "blocker");
    if (!isOk(teacher)) return;

    const cls = createClassesService().create({
      organizationId: org,
      name: "Algebra I",
      subject: "Math",
      program: "STEM",
      teacherId: teacher.id,
      campusId: "campus-1",
      gradeLevels: ["8"],
      capacity: 12,
      schedule: [{ dayOfWeek: 1, startTime: "09:00", endTime: "09:50" }],
      isVirtual: false,
      createdBy: "u1",
    });
    ctx.assert("ao.class", isOk(cls), undefined, "blocker");
    if (!isOk(cls)) return;

    const assigned = createStudentSchedulingService().assign({
      organizationId: org,
      classId: cls.id,
      studentId: student.id,
      kind: "Core",
      createdBy: "u1",
    });
    ctx.assert("ao.class_assignment", "enrollment" in assigned);

    const attendance = createSisAttendanceService().record({
      organizationId: org,
      studentId: student.id,
      date: "2026-07-21",
      status: "Present",
      createdBy: "u1",
    });
    ctx.assert("sis.attendance", isOk(attendance));

    const curriculum = createCurriculumService().create({
      organizationId: org,
      name: "Math Foundations",
      subject: "Math",
      program: "STEM",
      campusId: "campus-1",
      gradeLevels: ["8"],
      publish: true,
      objectives: [
        {
          id: "obj-m1",
          code: "M.1",
          title: "Linear equations",
          description: "Solve linear equations",
          competencyId: null,
        },
      ],
      createdBy: "u1",
    });
    ctx.assert("learning.curriculum", isOk(curriculum), undefined, "blocker");
    if (!isOk(curriculum)) return;

    const assessment = createAssessmentService().record({
      organizationId: org,
      studentId: student.id,
      teacherId: teacher.id,
      kind: "Formative",
      assessedOn: "2026-07-21",
      objectiveId: "obj-m1",
      curriculumId: curriculum.id,
      result: "Developing",
      domain: "Math",
      progressionLevel: 2,
      createdBy: "u1",
    });
    ctx.assert("learning.assessment", isOk(assessment));

    createMasteryService().update({
      organizationId: org,
      studentId: student.id,
      objectiveId: "obj-m1",
      level: "Proficient",
      domain: "Math",
      progressionLevel: 2,
      actor: "u1",
    });
    createProgressService().snapshot({
      organizationId: org,
      studentId: student.id,
      actor: "u1",
    });
    const gradebook = createGradebookService().get({
      organizationId: org,
      studentId: student.id,
      teacherId: teacher.id,
    });
    ctx.assert("learning.gradebook", isOk(gradebook));

    const notifs = routeAcademyOsDomainEvent({
      organizationId: org,
      domain: "learning",
      eventKey: "assessment_completed",
      recipientType: "parent",
      recipientId: `alex.lee.${org}@example.com`,
      studentId: student.id,
      variables: { student: "Jordan Lee", parent: "Alex Lee" },
      createdBy: "system",
    });
    ctx.assert(
      "communications.parent_notification",
      Array.isArray(notifs) && notifs.length > 0
    );

    const timeline = listStudentTimeline(org, student.id);
    ctx.assert("sis.timeline", timeline.length >= 0);

    const dash = ctx.measure("student_journey.dashboard", () =>
      buildEducationExecutiveDashboard(org)
    );
    ctx.assert(
      "executive.metrics",
      dash.enrollmentTrends.activeStudents >= 1 ||
        dash.studentOutcomes.activeStudents >= 1
    );
  },
};
