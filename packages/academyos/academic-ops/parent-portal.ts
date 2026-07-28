/**
 * Academic Ops parent portal facets — schedule, sessions, announcements.
 */

import { findStudentByParentToken } from "../sis/store";
import { createSisAttendanceService } from "../sis/attendance";
import {
  getClass,
  getTeacher,
  listEnrollments,
  listSessions,
} from "./store";

export function createAcademicOpsParentPortalService() {
  return {
    resolve(token: string) {
      const student = findStudentByParentToken(token);
      if (!student) return { error: "Invalid parent access token." as const };

      const enrollments = listEnrollments(student.organizationId, {
        studentId: student.id,
      }).filter((e) => e.status === "Active");

      const schedule = enrollments.map((e) => {
        const cls = getClass(student.organizationId, e.classId);
        const teacher = cls
          ? getTeacher(student.organizationId, cls.teacherId)
          : null;
        return {
          enrollmentId: e.id,
          classId: e.classId,
          className: cls?.name ?? e.classId,
          subject: cls?.subject ?? "",
          kind: e.kind,
          teacherName: teacher?.displayName ?? null,
          teacherId: cls?.teacherId ?? null,
          schedule: cls?.schedule ?? [],
          room: cls?.room ?? null,
          isVirtual: cls?.isVirtual ?? false,
          virtualMeetingUrl: cls?.virtualMeetingUrl ?? null,
        };
      });

      const classIds = new Set(enrollments.map((e) => e.classId));
      const upcomingSessions = listSessions(student.organizationId)
        .filter(
          (s) =>
            classIds.has(s.classId) &&
            s.studentIds.includes(student.id) &&
            s.status !== "Cancelled" &&
            s.date >= new Date().toISOString().slice(0, 10)
        )
        .slice(0, 30)
        .map((s) => ({
          sessionId: s.id,
          classId: s.classId,
          className:
            getClass(student.organizationId, s.classId)?.name ?? s.classId,
          date: s.date,
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          status: s.status,
        }));

      const attendance = createSisAttendanceService().list(
        student.organizationId,
        student.id
      );

      return {
        schedule,
        teacherAssignments: Object.freeze(
          schedule
            .filter((s) => s.teacherId)
            .map((s) => ({
              className: s.className,
              teacherName: s.teacherName,
              teacherId: s.teacherId,
            }))
        ),
        upcomingSessions: Object.freeze(upcomingSessions),
        attendanceHistory: attendance,
        calendar: Object.freeze(
          upcomingSessions.map((s) => ({
            date: s.date,
            title: s.className,
            startsAt: s.startsAt,
            endsAt: s.endsAt,
          }))
        ),
        classAnnouncements: Object.freeze([
          {
            id: "ao-welcome",
            title: "Class schedule",
            body: "Your student's class schedule and upcoming sessions are listed below.",
          },
        ]),
      };
    },
  };
}
