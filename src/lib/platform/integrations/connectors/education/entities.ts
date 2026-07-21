/**
 * RC-3.06 — Education Connectors
 * Canvas · PowerSchool · Google Classroom → shared canonical education entities.
 */

export const EDUCATION_PROVIDERS = [
  "canvas",
  "powerschool",
  "google_classroom",
] as const;
export type EducationProvider = (typeof EDUCATION_PROVIDERS)[number];

export const EDUCATION_OBJECT_TYPES = [
  "student",
  "teacher",
  "course",
  /** Legacy alias — normalized as Course. */
  "class",
  "assignment",
  "grade",
  "attendance",
  "schedule",
] as const;

export type EducationObjectType = (typeof EDUCATION_OBJECT_TYPES)[number];

export const EDUCATION_KG_KINDS = [
  "Student",
  "Person",
  "Organization",
  "Task",
  "Document",
  "Meeting",
] as const;

export type EducationKgKind = (typeof EDUCATION_KG_KINDS)[number];

export type EducationRawEntity = {
  id: string;
  objectType: EducationObjectType;
  provider: EducationProvider;
  organizationId: string;
  updatedAt: string;
  version: number;
  payload: Record<string, unknown>;
};

export type EducationCanonicalEntity = {
  id: string;
  externalId: string;
  organizationId: string;
  sourceSystem: EducationProvider;
  syncedAt: string;
  version: number;
  objectType: EducationObjectType;
  canonicalType: string;
  attributes: Record<string, unknown>;
};
