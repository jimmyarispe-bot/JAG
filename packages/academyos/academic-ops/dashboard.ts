import { createSisAttendanceService } from "../sis/attendance";
import { hoursBetween } from "./rules";
import {
  listClasses,
  listSessions,
  listTeachers,
  listWaitlist,
} from "./store";
import type { AcademicOperationsSummary } from "./types";

export function buildAcademicOperationsSummary(
  organizationId: string,
  now = new Date()
): AcademicOperationsSummary {
  const today = now.toISOString().slice(0, 10);
  const classes = listClasses(organizationId).filter(
    (c) => c.status === "Active" || c.status === "Waitlisted"
  );
  const sessions = listSessions(organizationId);
  const todaySessions = sessions.filter(
    (s) => s.date === today && s.status !== "Cancelled"
  );
  const completed = sessions.filter(
    (s) => s.status === "Completed" || s.lessonStatus === "Delivered"
  );
  const cancellations = sessions.filter((s) => s.status === "Cancelled").length;
  const attendance = createSisAttendanceService().dashboard(organizationId);
  const teachers = listTeachers(organizationId);
  const teachersWithSessionsToday = new Set(
    todaySessions.map((s) => s.substituteTeacherId ?? s.teacherId)
  ).size;
  const teacherUtilization =
    teachers.length === 0
      ? 0
      : Math.round((teachersWithSessionsToday / teachers.length) * 1000) / 10;

  const capacityTotal = classes.reduce((a, c) => a + c.capacity, 0);
  const enrolledTotal = classes.reduce((a, c) => a + c.currentEnrollment, 0);
  const classCapacityUtilization =
    capacityTotal === 0
      ? 0
      : Math.round((enrolledTotal / capacityTotal) * 1000) / 10;

  const sessionCompletionRate =
    sessions.length === 0
      ? 100
      : Math.round((completed.length / sessions.length) * 1000) / 10;

  const instructionalHoursDelivered = completed.reduce(
    (sum, s) => sum + hoursBetween(s.startsAt, s.endsAt),
    0
  );

  return {
    organizationId,
    classesToday: todaySessions.length,
    attendanceRate: attendance.monthlyPresentRate,
    teacherUtilization,
    classCapacityUtilization,
    waitlistTotal: listWaitlist(organizationId).length,
    cancellations,
    sessionCompletionRate,
    instructionalHoursDelivered:
      Math.round(instructionalHoursDelivered * 100) / 100,
  };
}
