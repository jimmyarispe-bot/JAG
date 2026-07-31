/**
 * Admissions process — navigation contribution references.
 */

export const ACADEMY_ADMISSIONS_NAVIGATION_IDS = {
  main: "academyos.main",
  module: "admissions",
} as const;

export const ACADEMY_ADMISSIONS_NAVIGATION_CONTRIBUTION_IDS = Object.freeze([
  ACADEMY_ADMISSIONS_NAVIGATION_IDS.main,
] as const);
