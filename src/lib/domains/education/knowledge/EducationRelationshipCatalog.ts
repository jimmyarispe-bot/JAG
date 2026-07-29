/**
 * Canonical Education relationship catalog — edges between entity concepts.
 * Definitions only; no graph execution.
 */

import { EDUCATION_ENTITY_IDS } from "./EducationEntityCatalog";

export interface EducationRelationshipDefinition {
  /** Stable id, e.g. education.rel.student_enrolled_in_program */
  id: string;
  name: string;
  description: string;
  /** Source entity id. */
  fromEntityId: string;
  /** Target entity id. */
  toEntityId: string;
  /** Predicate phrase (canonical). */
  predicate: string;
  /** Optional inverse predicate. */
  inversePredicate?: string;
  cardinality?: "one_to_one" | "one_to_many" | "many_to_many";
}

export const EDUCATION_RELATIONSHIP_IDS = {
  studentEnrolledInProgram: "education.rel.student_enrolled_in_program",
  teacherTeachesClass: "education.rel.teacher_teaches_class",
  familySupportsStudent: "education.rel.family_supports_student",
  assessmentMeasuresGoal: "education.rel.assessment_measures_goal",
  interventionTargetsStudent: "education.rel.intervention_targets_student",
  scholarshipFundsEnrollment: "education.rel.scholarship_funds_enrollment",
  classBelongsToCourse: "education.rel.class_belongs_to_course",
  courseBelongsToProgram: "education.rel.course_belongs_to_program",
  sessionBelongsToClass: "education.rel.session_belongs_to_class",
  attendanceRecordForSession: "education.rel.attendance_record_for_session",
  attendanceRecordForStudent: "education.rel.attendance_record_for_student",
  progressRecordForStudent: "education.rel.progress_record_for_student",
  programOfferedAtCampus: "education.rel.program_offered_at_campus",
  studentHasGoal: "education.rel.student_has_goal",
} as const;

export const EDUCATION_RELATIONSHIP_CATALOG: readonly EducationRelationshipDefinition[] =
  [
    {
      id: EDUCATION_RELATIONSHIP_IDS.studentEnrolledInProgram,
      name: "Student enrolled in Program",
      description: "A student is enrolled in an educational program.",
      fromEntityId: EDUCATION_ENTITY_IDS.student,
      toEntityId: EDUCATION_ENTITY_IDS.program,
      predicate: "enrolled_in",
      inversePredicate: "has_enrollee",
      cardinality: "many_to_many",
    },
    {
      id: EDUCATION_RELATIONSHIP_IDS.teacherTeachesClass,
      name: "Teacher teaches Class",
      description: "A teacher is assigned to instruct a class.",
      fromEntityId: EDUCATION_ENTITY_IDS.teacher,
      toEntityId: EDUCATION_ENTITY_IDS.class,
      predicate: "teaches",
      inversePredicate: "taught_by",
      cardinality: "many_to_many",
    },
    {
      id: EDUCATION_RELATIONSHIP_IDS.familySupportsStudent,
      name: "Family supports Student",
      description: "A family supports a student.",
      fromEntityId: EDUCATION_ENTITY_IDS.family,
      toEntityId: EDUCATION_ENTITY_IDS.student,
      predicate: "supports",
      inversePredicate: "supported_by",
      cardinality: "many_to_many",
    },
    {
      id: EDUCATION_RELATIONSHIP_IDS.assessmentMeasuresGoal,
      name: "Assessment measures Goal",
      description: "An assessment measures progress toward a goal.",
      fromEntityId: EDUCATION_ENTITY_IDS.assessment,
      toEntityId: EDUCATION_ENTITY_IDS.goal,
      predicate: "measures",
      inversePredicate: "measured_by",
      cardinality: "many_to_many",
    },
    {
      id: EDUCATION_RELATIONSHIP_IDS.interventionTargetsStudent,
      name: "Intervention targets Student",
      description: "An intervention is directed at a student.",
      fromEntityId: EDUCATION_ENTITY_IDS.intervention,
      toEntityId: EDUCATION_ENTITY_IDS.student,
      predicate: "targets",
      inversePredicate: "receives_intervention",
      cardinality: "many_to_many",
    },
    {
      id: EDUCATION_RELATIONSHIP_IDS.scholarshipFundsEnrollment,
      name: "Scholarship funds Enrollment",
      description: "A scholarship funds or conditions an enrollment.",
      fromEntityId: EDUCATION_ENTITY_IDS.scholarship,
      toEntityId: EDUCATION_ENTITY_IDS.enrollment,
      predicate: "funds",
      inversePredicate: "funded_by",
      cardinality: "many_to_many",
    },
    {
      id: EDUCATION_RELATIONSHIP_IDS.classBelongsToCourse,
      name: "Class belongs to Course",
      description: "A class is an offering of a course.",
      fromEntityId: EDUCATION_ENTITY_IDS.class,
      toEntityId: EDUCATION_ENTITY_IDS.course,
      predicate: "belongs_to",
      inversePredicate: "has_class",
      cardinality: "many_to_one",
    },
    {
      id: EDUCATION_RELATIONSHIP_IDS.courseBelongsToProgram,
      name: "Course belongs to Program",
      description: "A course is part of a program.",
      fromEntityId: EDUCATION_ENTITY_IDS.course,
      toEntityId: EDUCATION_ENTITY_IDS.program,
      predicate: "belongs_to",
      inversePredicate: "has_course",
      cardinality: "many_to_one",
    },
    {
      id: EDUCATION_RELATIONSHIP_IDS.sessionBelongsToClass,
      name: "Session belongs to Class",
      description: "A session is a meeting of a class.",
      fromEntityId: EDUCATION_ENTITY_IDS.session,
      toEntityId: EDUCATION_ENTITY_IDS.class,
      predicate: "belongs_to",
      inversePredicate: "has_session",
      cardinality: "many_to_one",
    },
    {
      id: EDUCATION_RELATIONSHIP_IDS.attendanceRecordForSession,
      name: "Attendance Record for Session",
      description: "An attendance record is tied to a session.",
      fromEntityId: EDUCATION_ENTITY_IDS.attendanceRecord,
      toEntityId: EDUCATION_ENTITY_IDS.session,
      predicate: "recorded_for",
      cardinality: "many_to_one",
    },
    {
      id: EDUCATION_RELATIONSHIP_IDS.attendanceRecordForStudent,
      name: "Attendance Record for Student",
      description: "An attendance record is about a student.",
      fromEntityId: EDUCATION_ENTITY_IDS.attendanceRecord,
      toEntityId: EDUCATION_ENTITY_IDS.student,
      predicate: "about",
      cardinality: "many_to_one",
    },
    {
      id: EDUCATION_RELATIONSHIP_IDS.progressRecordForStudent,
      name: "Progress Record for Student",
      description: "A progress record is about a student.",
      fromEntityId: EDUCATION_ENTITY_IDS.progressRecord,
      toEntityId: EDUCATION_ENTITY_IDS.student,
      predicate: "about",
      cardinality: "many_to_one",
    },
    {
      id: EDUCATION_RELATIONSHIP_IDS.programOfferedAtCampus,
      name: "Program offered at Campus",
      description: "A program is offered at a campus.",
      fromEntityId: EDUCATION_ENTITY_IDS.program,
      toEntityId: EDUCATION_ENTITY_IDS.campus,
      predicate: "offered_at",
      inversePredicate: "offers_program",
      cardinality: "many_to_many",
    },
    {
      id: EDUCATION_RELATIONSHIP_IDS.studentHasGoal,
      name: "Student has Goal",
      description: "A student has an associated learning goal.",
      fromEntityId: EDUCATION_ENTITY_IDS.student,
      toEntityId: EDUCATION_ENTITY_IDS.goal,
      predicate: "has_goal",
      inversePredicate: "belongs_to_student",
      cardinality: "one_to_many",
    },
  ] as const;

export function educationRelationshipById(): ReadonlyMap<
  string,
  EducationRelationshipDefinition
> {
  return new Map(EDUCATION_RELATIONSHIP_CATALOG.map((r) => [r.id, r]));
}
