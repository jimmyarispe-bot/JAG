/**
 * Academy Scheduling permission keys — package contributions only.
 */

export const ACADEMY_SCHEDULING_PERMISSIONS = {
  viewSchedule: "academyos.scheduling.schedule.view",
  editSchedule: "academyos.scheduling.schedule.edit",
  assignTeacher: "academyos.scheduling.teachers.assign",
  createClass: "academyos.scheduling.classes.create",
  publishSchedule: "academyos.scheduling.schedule.publish",
  manageCalendar: "academyos.scheduling.calendar.manage",
  viewCalendar: "academyos.scheduling.calendar.view",
  manageRooms: "academyos.scheduling.rooms.manage",
  viewReports: "academyos.scheduling.reports.view",
} as const;

export type AcademySchedulingPermissionKey =
  (typeof ACADEMY_SCHEDULING_PERMISSIONS)[keyof typeof ACADEMY_SCHEDULING_PERMISSIONS];

export const ACADEMY_SCHEDULING_PERMISSION_KEYS = Object.freeze(
  Object.values(ACADEMY_SCHEDULING_PERMISSIONS)
);

export const ACADEMY_SCHEDULING_PERMISSION_PACK_ID =
  "academy.permission.scheduling" as const;

export const ACADEMY_SCHEDULING_PERMISSION_PACK = Object.freeze({
  id: ACADEMY_SCHEDULING_PERMISSION_PACK_ID,
  label: "Academy Scheduling",
  description: "Scheduling and timetable permission keys",
  permissions: ACADEMY_SCHEDULING_PERMISSION_KEYS,
});
