/**
 * Academic calendar day-type definitions — package catalog only.
 */

export type AcademyCalendarDayKind =
  | "instructional"
  | "holiday"
  | "professional_development"
  | "break"
  | "semester_boundary"
  | "trimester_boundary"
  | "summer_session";

export type AcademyCalendarDefinition = {
  readonly id: string;
  readonly kind: AcademyCalendarDayKind;
  readonly label: string;
  readonly description: string;
};

export const ACADEMY_ACADEMIC_CALENDAR_DEFINITIONS: readonly AcademyCalendarDefinition[] =
  Object.freeze([
    Object.freeze({
      id: "academy.scheduling.calendar.instructional",
      kind: "instructional" as const,
      label: "Instructional Day",
      description: "Standard instructional day on the academic calendar",
    }),
    Object.freeze({
      id: "academy.scheduling.calendar.holiday",
      kind: "holiday" as const,
      label: "School Holiday",
      description: "Non-instructional school holiday",
    }),
    Object.freeze({
      id: "academy.scheduling.calendar.professional_development",
      kind: "professional_development" as const,
      label: "Professional Development Day",
      description: "Staff professional development; no student instruction",
    }),
    Object.freeze({
      id: "academy.scheduling.calendar.break",
      kind: "break" as const,
      label: "Break",
      description: "Scheduled academic break (e.g. winter/spring)",
    }),
    Object.freeze({
      id: "academy.scheduling.calendar.semester_boundary",
      kind: "semester_boundary" as const,
      label: "Semester Boundary",
      description: "Start or end of a semester term",
    }),
    Object.freeze({
      id: "academy.scheduling.calendar.trimester_boundary",
      kind: "trimester_boundary" as const,
      label: "Trimester Boundary",
      description: "Start or end of a trimester term",
    }),
    Object.freeze({
      id: "academy.scheduling.calendar.summer_session",
      kind: "summer_session" as const,
      label: "Summer Session",
      description: "Summer instructional session window",
    }),
  ]);

export const ACADEMY_ACADEMIC_CALENDAR_DEFINITION_IDS = Object.freeze(
  ACADEMY_ACADEMIC_CALENDAR_DEFINITIONS.map((d) => d.id)
);
