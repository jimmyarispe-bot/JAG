/**
 * Education experience contribution contracts — no React, no pages.
 */

/** Declared Education experience fragment kinds (tokens only). */
export const EDUCATION_EXPERIENCE_FRAGMENTS = [
  "briefing.student",
  "briefing.class",
  "nav.education",
  "widget.enrollment.status",
  "widget.attendance.summary",
  "widget.progress.snapshot",
] as const;

export type EducationExperienceFragmentId =
  (typeof EDUCATION_EXPERIENCE_FRAGMENTS)[number];

export interface EducationExperienceFragmentDeclaration {
  id: EducationExperienceFragmentId;
  description?: string;
}
