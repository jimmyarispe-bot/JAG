/**
 * Admissions process — permission keys (declarative references).
 */

export const ACADEMY_ADMISSIONS_PERMISSIONS = {
  read: "academyos.admissions.read",
  create: "academyos.admissions.create",
  update: "academyos.admissions.update",
  approve: "academyos.admissions.approve",
  start: "academyos.admissions.create",
  transition: "academyos.admissions.update",
  decide: "academyos.admissions.approve",
  enroll: "academyos.admissions.approve",
} as const;
