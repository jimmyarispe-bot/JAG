import type {
  EducationKgKind,
  EducationObjectType,
} from "@/lib/platform/integrations/connectors/education/entities";

export const CANONICAL_TYPE: Record<EducationObjectType, string> = {
  student: "education.student",
  teacher: "education.teacher",
  course: "education.course",
  class: "education.course",
  assignment: "education.assignment",
  grade: "education.grade",
  attendance: "education.attendance",
  schedule: "education.schedule",
};

export const KG_KIND_FOR_OBJECT: Partial<Record<EducationObjectType, EducationKgKind>> = {
  student: "Student",
  teacher: "Person",
  course: "Organization",
  class: "Organization",
  assignment: "Task",
  grade: "Document",
  attendance: "Document",
  schedule: "Meeting",
};

export function educationCanonicalType(objectType: string): string {
  return (
    CANONICAL_TYPE[objectType as EducationObjectType] ?? `education.${objectType}`
  );
}

export function educationKgKind(objectType: string): EducationKgKind | null {
  return KG_KIND_FOR_OBJECT[objectType as EducationObjectType] ?? null;
}
