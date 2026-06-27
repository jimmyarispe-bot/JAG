/** Relationship type keys — mirrored in platform_relationship_type_definitions SQL seed. */
export const RELATIONSHIP_TYPE_KEYS = [
  "student.family",
  "student.guardian",
  "student.school",
  "student.campus",
  "student.teacher",
  "student.advisor",
  "student.therapist",
  "student.case_manager",
  "student.transportation_route",
  "student.scholarship",
  "student.grant",
  "student.document",
  "student.enrollment",
  "student.class",
  "student.assessment",
  "employee.school",
  "employee.department",
  "employee.supervisor",
  "school.organization",
  "school.campus",
] as const;

export type RelationshipTypeKey = (typeof RELATIONSHIP_TYPE_KEYS)[number];

export function isRelationshipTypeKey(value: string): value is RelationshipTypeKey {
  return (RELATIONSHIP_TYPE_KEYS as readonly string[]).includes(value);
}

/** Student-scoped relationship types for support team / family views */
export const STUDENT_RELATIONSHIP_TYPES: RelationshipTypeKey[] = [
  "student.family",
  "student.guardian",
  "student.school",
  "student.campus",
  "student.teacher",
  "student.advisor",
  "student.therapist",
  "student.case_manager",
  "student.transportation_route",
  "student.enrollment",
  "student.class",
];
