/**
 * AcademyOS entity object types synchronized into JAG.
 */

export const ACADEMYOS_OBJECT_TYPES = [
  "organization",
  "campus",
  "program",
  "student",
  "guardian",
  "employee",
  "teacher",
  "class",
  "enrollment",
  "attendance",
  "session",
  "tuition",
  "scholarship",
  "payroll_summary",
  "financial_summary",
  "document",
  "task",
  "communication",
] as const;

export type AcademyOsObjectType = (typeof ACADEMYOS_OBJECT_TYPES)[number];

export type AcademyOsRawEntity = {
  id: string;
  objectType: AcademyOsObjectType;
  organizationId: string;
  campusId?: string | null;
  updatedAt: string;
  version: number;
  payload: Record<string, unknown>;
};

export type AcademyOsCanonicalEntity = {
  /** JAG internal id */
  id: string;
  externalId: string;
  sourceSystem: "academyos";
  syncedAt: string;
  version: number;
  organizationId: string;
  campusId: string | null;
  objectType: AcademyOsObjectType;
  canonicalType: string;
  attributes: Record<string, unknown>;
};
