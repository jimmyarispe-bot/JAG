/**
 * Admissions form contribution ids — package ownership surface.
 * Definitions remain registered via Forms Framework (AcademyOS form defs).
 */

export const ACADEMY_ADMISSIONS_FORM_IDS = {
  inquiry: "academyos.inquiry.create",
  application: "academyos.application.create",
  student: "academyos.student.create",
} as const;

export const ACADEMY_ADMISSIONS_FORM_DEFINITION_IDS = Object.freeze([
  ACADEMY_ADMISSIONS_FORM_IDS.inquiry,
  ACADEMY_ADMISSIONS_FORM_IDS.application,
  ACADEMY_ADMISSIONS_FORM_IDS.student,
] as const);
