/**
 * Teacher schedule definition shapes — declarative only.
 */

export type TeacherScheduleHorizon = "active" | "future" | "historical";

export type AcademyTeacherScheduleDefinition = {
  readonly id: string;
  readonly horizon: TeacherScheduleHorizon;
  readonly label: string;
  readonly metadataKeys: readonly string[];
};

export const ACADEMY_TEACHER_SCHEDULE_DEFINITIONS: readonly AcademyTeacherScheduleDefinition[] =
  Object.freeze([
    Object.freeze({
      id: "academy.scheduling.teacher_schedule.active",
      horizon: "active" as const,
      label: "Active Teacher Schedule",
      metadataKeys: Object.freeze([
        "teacherId",
        "sectionIds",
        "timeSlotIds",
        "campusId",
      ]),
    }),
    Object.freeze({
      id: "academy.scheduling.teacher_schedule.future",
      horizon: "future" as const,
      label: "Future Teacher Schedule",
      metadataKeys: Object.freeze([
        "teacherId",
        "sectionIds",
        "effectiveFrom",
      ]),
    }),
    Object.freeze({
      id: "academy.scheduling.teacher_schedule.historical",
      horizon: "historical" as const,
      label: "Historical Teacher Schedule",
      metadataKeys: Object.freeze([
        "teacherId",
        "sectionIds",
        "effectiveTo",
      ]),
    }),
  ]);

export const ACADEMY_TEACHER_SCHEDULE_DEFINITION_IDS = Object.freeze(
  ACADEMY_TEACHER_SCHEDULE_DEFINITIONS.map((d) => d.id)
);
