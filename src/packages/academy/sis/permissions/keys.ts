/**
 * Academy SIS permission keys — package contributions only.
 */

export const ACADEMY_SIS_PERMISSIONS = {
  viewStudent: "academyos.sis.students.view",
  editStudent: "academyos.sis.students.edit",
  viewGuardian: "academyos.sis.guardians.view",
  editGuardian: "academyos.sis.guardians.edit",
  viewContacts: "academyos.sis.contacts.view",
  editContacts: "academyos.sis.contacts.edit",
  viewMedical: "academyos.sis.medical.view",
  editMedical: "academyos.sis.medical.edit",
  viewAcademicProfile: "academyos.sis.academic.view",
  editAcademicProfile: "academyos.sis.academic.edit",
  viewAccommodations: "academyos.sis.accommodations.view",
  editAccommodations: "academyos.sis.accommodations.edit",
  manageEnrollment: "academyos.sis.enrollment.manage",
  viewEnrollment: "academyos.sis.enrollment.view",
  viewReports: "academyos.sis.reports.view",
} as const;

export type AcademySisPermissionKey =
  (typeof ACADEMY_SIS_PERMISSIONS)[keyof typeof ACADEMY_SIS_PERMISSIONS];

export const ACADEMY_SIS_PERMISSION_KEYS = Object.freeze(
  Object.values(ACADEMY_SIS_PERMISSIONS)
);

/** Declarative permission pack id for Package Runtime contributions. */
export const ACADEMY_SIS_PERMISSION_PACK_ID = "academy.permission.sis" as const;

export const ACADEMY_SIS_PERMISSION_PACK = Object.freeze({
  id: ACADEMY_SIS_PERMISSION_PACK_ID,
  label: "Academy SIS",
  description: "Student Information System permission keys",
  permissions: ACADEMY_SIS_PERMISSION_KEYS,
});
