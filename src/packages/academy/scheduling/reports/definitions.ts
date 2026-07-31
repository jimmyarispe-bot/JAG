/**
 * Academy Scheduling report definitions — no rendering.
 */

export type AcademySchedulingReportDefinition = {
  readonly id: string;
  readonly applicationId: "academyos";
  readonly title: string;
  readonly domain: "scheduling";
  readonly entityType: string;
  readonly fields: readonly string[];
  readonly requiredPermission: string;
  readonly version: string;
};

function report(input: {
  id: string;
  title: string;
  entityType: string;
  fields: readonly string[];
}): AcademySchedulingReportDefinition {
  return Object.freeze({
    ...input,
    applicationId: "academyos" as const,
    domain: "scheduling" as const,
    version: "1.0.0",
    requiredPermission: "academyos.scheduling.reports.view",
    fields: Object.freeze([...input.fields]),
  });
}

export const ACADEMY_SCHEDULING_REPORTS: readonly AcademySchedulingReportDefinition[] =
  Object.freeze([
    report({
      id: "academy.scheduling.report.master_schedule",
      title: "Master Schedule",
      entityType: "Section",
      fields: Object.freeze([
        "displayName",
        "sectionCode",
        "courseId",
        "primaryTeacherId",
        "roomId",
        "timeSlotId",
        "status",
      ]),
    }),
    report({
      id: "academy.scheduling.report.teacher_schedule",
      title: "Teacher Schedule",
      entityType: "TeacherAssignment",
      fields: Object.freeze([
        "teacherId",
        "sectionId",
        "campusId",
        "isPrimaryTeacher",
        "status",
      ]),
    }),
    report({
      id: "academy.scheduling.report.student_schedule",
      title: "Student Schedule",
      entityType: "StudentSchedule",
      fields: Object.freeze([
        "studentId",
        "horizon",
        "sectionIds",
        "academicTermId",
        "status",
      ]),
    }),
    report({
      id: "academy.scheduling.report.room_utilization",
      title: "Room Utilization",
      entityType: "Room",
      fields: Object.freeze([
        "displayName",
        "code",
        "campusId",
        "capacity",
        "status",
      ]),
    }),
    report({
      id: "academy.scheduling.report.class_roster",
      title: "Class Roster",
      entityType: "Class",
      fields: Object.freeze([
        "displayName",
        "courseId",
        "primaryTeacherId",
        "capacity",
        "status",
      ]),
    }),
    report({
      id: "academy.scheduling.report.program_capacity",
      title: "Program Capacity",
      entityType: "Program",
      fields: Object.freeze([
        "displayName",
        "code",
        "capacity",
        "modality",
        "status",
      ]),
    }),
  ]);

export const ACADEMY_SCHEDULING_REPORT_IDS = Object.freeze(
  ACADEMY_SCHEDULING_REPORTS.map((r) => r.id)
);

const reportRegistry = new Map<string, AcademySchedulingReportDefinition>();
const permissionPackRegistry = new Map<string, unknown>();
const programRegistry = new Map<string, unknown>();
const calendarRegistry = new Map<string, unknown>();
const constraintRegistry = new Map<string, unknown>();

export function resetAcademySchedulingReportsForTests(): void {
  reportRegistry.clear();
  permissionPackRegistry.clear();
  programRegistry.clear();
  calendarRegistry.clear();
  constraintRegistry.clear();
}

export function registerAcademySchedulingReports(): readonly AcademySchedulingReportDefinition[] {
  reportRegistry.clear();
  for (const item of ACADEMY_SCHEDULING_REPORTS) {
    reportRegistry.set(item.id, item);
  }
  return listAcademySchedulingReports();
}

export function listAcademySchedulingReports(): AcademySchedulingReportDefinition[] {
  return [...reportRegistry.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function getAcademySchedulingReport(
  id: string
): AcademySchedulingReportDefinition | null {
  return reportRegistry.get(id) ?? null;
}

export function registerAcademySchedulingPermissionPack(pack: {
  id: string;
  label: string;
  description: string;
  permissions: readonly string[];
}): void {
  permissionPackRegistry.set(pack.id, Object.freeze({ ...pack }));
}

export function getAcademySchedulingPermissionPack(id: string): unknown {
  return permissionPackRegistry.get(id) ?? null;
}

export function registerAcademySchedulingProgramCatalog(
  programs: readonly { id: string }[]
): void {
  programRegistry.clear();
  for (const p of programs) {
    programRegistry.set(p.id, p);
  }
}

export function listRegisteredAcademySchedulingPrograms(): unknown[] {
  return [...programRegistry.values()];
}

export function registerAcademySchedulingCalendarCatalog(
  defs: readonly { id: string }[]
): void {
  calendarRegistry.clear();
  for (const d of defs) {
    calendarRegistry.set(d.id, d);
  }
}

export function listRegisteredAcademySchedulingCalendars(): unknown[] {
  return [...calendarRegistry.values()];
}

export function registerAcademySchedulingConstraints(
  defs: readonly { id: string }[]
): void {
  constraintRegistry.clear();
  for (const d of defs) {
    constraintRegistry.set(d.id, d);
  }
}

export function listRegisteredAcademySchedulingConstraints(): unknown[] {
  return [...constraintRegistry.values()];
}
