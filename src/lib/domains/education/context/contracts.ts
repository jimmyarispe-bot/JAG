/**
 * Education context contracts — shapes only.
 * No discovery algorithms or SoR access.
 */

/** Normalized Education context family tokens. */
export const EDUCATION_CONTEXT_FAMILIES = [
  "school",
  "campus",
  "academic_term",
  "program",
  "class",
  "session",
  "student",
  "family",
  "teacher",
] as const;

export type EducationContextFamily =
  (typeof EDUCATION_CONTEXT_FAMILIES)[number];

/** Opaque Education context profile descriptor (contract). */
export interface EducationContextProfile {
  contextId: string;
  family: EducationContextFamily;
  organizationId: string;
  label?: string;
  /** Opaque attributes — never interpreted by Core. */
  attributes?: Readonly<Record<string, unknown>>;
}

export interface SchoolContextRef {
  kind: "school";
  schoolId: string;
  organizationId: string;
}

export interface CampusContextRef {
  kind: "campus";
  campusId: string;
  schoolId?: string;
  organizationId: string;
}

export interface AcademicTermContextRef {
  kind: "academic_term";
  termId: string;
  organizationId: string;
}

export interface ProgramContextRef {
  kind: "program";
  programId: string;
  organizationId: string;
}

export interface ClassContextRef {
  kind: "class";
  classId: string;
  programId?: string;
  organizationId: string;
}

export interface SessionContextRef {
  kind: "session";
  sessionId: string;
  classId?: string;
  organizationId: string;
}

export interface StudentContextRef {
  kind: "student";
  studentPartyId: string;
  organizationId: string;
}

export interface FamilyContextRef {
  kind: "family";
  familyPartyId: string;
  organizationId: string;
}

export interface TeacherContextRef {
  kind: "teacher";
  teacherPartyId: string;
  organizationId: string;
}

export type EducationContextRef =
  | SchoolContextRef
  | CampusContextRef
  | AcademicTermContextRef
  | ProgramContextRef
  | ClassContextRef
  | SessionContextRef
  | StudentContextRef
  | FamilyContextRef
  | TeacherContextRef;
