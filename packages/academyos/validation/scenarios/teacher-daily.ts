/**
 * Scenario 4 — Teacher Daily Workflow
 */

import {
  buildEducationExecutiveDashboard,
  createAnnouncementService,
  createAssessmentService,
  createClassesService,
  createCommunicationCenterService,
  createCurriculumService,
  createInterventionService,
  createMessagingService,
  createSessionsService,
  createSisAttendanceService,
  createSisStudentsService,
  createStudentSchedulingService,
  createTeacherWorkspaceService,
  createTeachersService,
  routeAcademyOsDomainEvent,
} from "../aos";
import { isOk, type ScenarioDefinition } from "../harness";

export const teacherDailyScenario: ScenarioDefinition = {
  id: "teacher_daily",
  name: "Teacher Daily Workflow",
  domains: [
    "academic_ops",
    "sis",
    "learning",
    "communications",
    "executive",
  ],
  run(ctx) {
    const org = ctx.organizationId;
    const today = "2026-07-21"; // Tuesday

    const teacher = createTeachersService().create({
      organizationId: org,
      displayName: "Ms. Rivera",
      subjects: ["Reading"],
      campusIds: ["campus-1"],
      availability: [{ dayOfWeek: 2, startTime: "08:00", endTime: "16:00" }],
      createdBy: "u1",
    });
    ctx.assert("teacher.login_identity", isOk(teacher), undefined, "blocker");
    if (!isOk(teacher)) return;

    const student = createSisStudentsService().create({
      organizationId: org,
      identity: {
        preferredName: "Sam",
        legalFirstName: "Sam",
        legalLastName: "Lee",
        dateOfBirth: "2014-01-01",
        stateStudentId: null,
      },
      gradeLevel: "5",
      campusId: "campus-1",
      campusName: "Lincoln",
      program: "General",
      status: "Active",
      createdBy: "u1",
    });
    ctx.assert("teacher.student", isOk(student), undefined, "blocker");
    if (!isOk(student)) return;

    const cls = createClassesService().create({
      organizationId: org,
      name: "Reading Lab",
      subject: "Reading",
      teacherId: teacher.id,
      campusId: "campus-1",
      gradeLevels: ["5"],
      capacity: 8,
      schedule: [{ dayOfWeek: 2, startTime: "09:00", endTime: "09:50" }],
      isVirtual: false,
      createdBy: "u1",
    });
    ctx.assert("teacher.class", isOk(cls), undefined, "blocker");
    if (!isOk(cls)) return;

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
      startsOn: today,
      endsOn: today,
      createdBy: "u1",
    });
    const sessions =
      sessionsResult && "sessions" in sessionsResult
        ? sessionsResult.sessions
        : [];
    ctx.assert("teacher.sessions", sessions.length >= 1);

    const workspace = ctx.measure("teacher_daily.workspace", () =>
      createTeacherWorkspaceService().get({
        organizationId: org,
        teacherId: teacher.id,
        asOf: new Date(`${today}T12:00:00.000Z`),
      })
    );
    ctx.assert(
      "teacher.dashboard_state",
      workspace != null && !("error" in workspace)
    );
    if (workspace && !("error" in workspace)) {
      ctx.assert(
        "teacher.todays_schedule",
        workspace.todaySchedule.length >= 1
      );
    }

    const attendance = createSisAttendanceService().record({
      organizationId: org,
      studentId: student.id,
      date: today,
      status: "Present",
      createdBy: teacher.id,
    });
    ctx.assert("teacher.attendance", isOk(attendance));

    const curriculum = createCurriculumService().create({
      organizationId: org,
      name: "Reading Daily",
      subject: "Reading",
      program: "General",
      campusId: "campus-1",
      gradeLevels: ["5"],
      publish: true,
      objectives: [
        {
          id: "obj-r1",
          code: "R.1",
          title: "Fluency",
          description: "Oral reading fluency",
          competencyId: null,
        },
      ],
      createdBy: teacher.id,
    });
    ctx.assert("teacher.curriculum", isOk(curriculum), undefined, "blocker");
    if (!isOk(curriculum)) return;

    const assessment = createAssessmentService().record({
      organizationId: org,
      studentId: student.id,
      teacherId: teacher.id,
      kind: "Formative",
      assessedOn: today,
      objectiveId: "obj-r1",
      curriculumId: curriculum.id,
      result: "Developing",
      domain: "Reading",
      notes: "Session notes: strong decoding",
      createdBy: teacher.id,
    });
    ctx.assert("teacher.assessment_and_notes", isOk(assessment));

    const intervention = createInterventionService().create({
      organizationId: org,
      studentId: student.id,
      kind: "Reading",
      goals: "Improve fluency",
      assignedStaffIds: [teacher.id],
      startsOn: today,
      reviewOn: "2026-08-21",
      createdBy: teacher.id,
    });
    ctx.assert("teacher.intervention", isOk(intervention));

    const thread = createMessagingService().openThread({
      organizationId: org,
      subject: "Today's reading progress",
      participantType: "parent",
      participantIds: ["parent@example.com", teacher.id],
      studentId: student.id,
      secure: true,
      createdBy: teacher.id,
    });
    ctx.assert("teacher.parent_message_thread", isOk(thread), undefined, "blocker");
    if (isOk(thread)) {
      const msg = createMessagingService().send({
        organizationId: org,
        threadId: thread.id,
        body: "Sam made strong progress in fluency today.",
        senderType: "staff",
        senderId: teacher.id,
      });
      ctx.assert("teacher.parent_message", isOk(msg));
    }

    routeAcademyOsDomainEvent({
      organizationId: org,
      domain: "learning",
      eventKey: "intervention_assigned",
      recipientType: "parent",
      recipientId: "parent@example.com",
      studentId: student.id,
      createdBy: teacher.id,
    });

    const announcement = createAnnouncementService().create({
      organizationId: org,
      title: "Reading Lab update",
      body: "Fluency focus this week.",
      scope: "Class",
      scopeTargetId: cls.id,
      createdBy: teacher.id,
    });
    if (isOk(announcement)) {
      createAnnouncementService().publish({
        organizationId: org,
        announcementId: announcement.id,
        actor: teacher.id,
      });
    }

    const center = createCommunicationCenterService().timeline({
      organizationId: org,
      studentId: student.id,
    });
    ctx.assert("teacher.communication_center", center.length > 0);

    const dash = buildEducationExecutiveDashboard(org);
    ctx.assert(
      "executive.teacher_metrics",
      dash.academicOperationsSummary != null ||
        dash.learningProgressSummary != null
    );
  },
};
