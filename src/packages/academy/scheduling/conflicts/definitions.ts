/**
 * Declarative scheduling constraints — no resolution algorithms.
 */

export type SchedulingConstraintSeverity = "error" | "warning";

export type AcademySchedulingConstraintDefinition = {
  readonly id: string;
  readonly code: string;
  readonly label: string;
  readonly description: string;
  readonly severity: SchedulingConstraintSeverity;
  /** Opaque fact paths a future evaluator may inspect — not evaluated here. */
  readonly factPaths: readonly string[];
};

export const ACADEMY_SCHEDULING_CONSTRAINTS: readonly AcademySchedulingConstraintDefinition[] =
  Object.freeze([
    Object.freeze({
      id: "academy.scheduling.constraint.teacher_double_booking",
      code: "teacher_double_booking",
      label: "Teacher Double-Booking",
      description:
        "A teacher must not be assigned to overlapping time slots",
      severity: "error" as const,
      factPaths: Object.freeze([
        "assignment.teacherId",
        "assignment.timeSlotId",
        "assignment.dayOfWeek",
      ]),
    }),
    Object.freeze({
      id: "academy.scheduling.constraint.room_conflict",
      code: "room_conflict",
      label: "Room Conflict",
      description: "A room must not host overlapping sections",
      severity: "error" as const,
      factPaths: Object.freeze([
        "section.roomId",
        "section.timeSlotId",
        "section.dayOfWeek",
      ]),
    }),
    Object.freeze({
      id: "academy.scheduling.constraint.student_overlap",
      code: "overlapping_student_schedules",
      label: "Overlapping Student Schedules",
      description: "A student must not have overlapping active sections",
      severity: "error" as const,
      factPaths: Object.freeze([
        "studentSchedule.studentId",
        "studentSchedule.sectionIds",
        "section.timeSlotId",
      ]),
    }),
    Object.freeze({
      id: "academy.scheduling.constraint.program_restriction",
      code: "program_restrictions",
      label: "Program Restrictions",
      description:
        "Sections must belong to programs allowed for the campus/student",
      severity: "warning" as const,
      factPaths: Object.freeze([
        "section.programId",
        "student.programId",
        "campus.allowedProgramCodes",
      ]),
    }),
    Object.freeze({
      id: "academy.scheduling.constraint.campus_restriction",
      code: "campus_restrictions",
      label: "Campus Restrictions",
      description:
        "Assignments must respect campus modality and location rules",
      severity: "warning" as const,
      factPaths: Object.freeze([
        "section.campusId",
        "teacherAssignment.campusId",
        "room.campusId",
      ]),
    }),
  ]);

export const ACADEMY_SCHEDULING_CONSTRAINT_IDS = Object.freeze(
  ACADEMY_SCHEDULING_CONSTRAINTS.map((c) => c.id)
);
