export {
  canManageSchoolCalendar,
  canEditCalendar,
  canViewCalendar,
  canManageAdmissionsCalendar,
  assertCanView,
  assertCanEdit,
  requireCalendarViewAccess,
  requireCalendarEditAccess,
} from "./access";

export { expandOccurrences, timesOverlap } from "./recurrence";
export { detectCalendarConflicts } from "./conflicts";
export {
  createCalendarEvent,
  updateCalendarEvent,
  cancelCalendarEvent,
  duplicateCalendarEvent,
  getCalendarEvent,
} from "./service";
export {
  listCalendarOccurrences,
  getStudentSchedule,
  getFamilyCalendar,
  listResources,
  listStaffAvailability,
} from "./queries";
export { createResource, reserveResource } from "./resources";
export { upsertStaffAvailability, findTeacherAvailabilitySlots } from "./availability";
export {
  createMeetLink,
  updateMeetLink,
  cancelMeetLink,
  ensureGoogleMeetExtensionRegistered,
} from "./meet";
export {
  scheduleEventReminders,
  processDueCalendarReminders,
  DEFAULT_REMINDER_OFFSETS_MINUTES,
} from "./reminders";

export type * from "./types";
