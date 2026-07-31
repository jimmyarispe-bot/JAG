/**
 * Academy Scheduling package contributions — declarative definitions only.
 */

export {
  registerAcademyPackageScheduling,
  ACADEMY_SCHEDULING_ENTITY_DEFINITIONS,
  ACADEMY_SCHEDULING_ENTITY_TYPES,
  type AcademySchedulingRegistrationResult,
} from "@/packages/academy/scheduling/registration";

export {
  ACADEMY_SCHEDULING_PERMISSIONS,
  ACADEMY_SCHEDULING_PERMISSION_KEYS,
  ACADEMY_SCHEDULING_PERMISSION_PACK,
  ACADEMY_SCHEDULING_PERMISSION_PACK_ID,
} from "@/packages/academy/scheduling/permissions";

export {
  ACADEMY_SCHEDULING_REPORTS,
  ACADEMY_SCHEDULING_REPORT_IDS,
  listAcademySchedulingReports,
  getAcademySchedulingPermissionPack,
  listRegisteredAcademySchedulingPrograms,
  listRegisteredAcademySchedulingCalendars,
  listRegisteredAcademySchedulingConstraints,
} from "@/packages/academy/scheduling/reports";

export {
  ACADEMY_SCHEDULING_PROGRAMS,
  ACADEMY_SCHEDULING_PROGRAM_IDS,
  ACADEMY_SCHEDULING_PROGRAM_CODES,
} from "@/packages/academy/scheduling/programs";

export {
  ACADEMY_ACADEMIC_CALENDAR_DEFINITIONS,
  ACADEMY_ACADEMIC_CALENDAR_DEFINITION_IDS,
} from "@/packages/academy/scheduling/academic-calendar";

export {
  ACADEMY_SCHEDULING_CONSTRAINTS,
  ACADEMY_SCHEDULING_CONSTRAINT_IDS,
} from "@/packages/academy/scheduling/conflicts";

export { ACADEMY_STUDENT_SCHEDULE_HORIZONS } from "@/packages/academy/scheduling/student-schedules";

export { ACADEMY_TEACHER_SCHEDULE_DEFINITION_IDS } from "@/packages/academy/scheduling/teacher-schedules";

export { resetAcademySchedulingForTests } from "@/packages/academy/scheduling/testing";
