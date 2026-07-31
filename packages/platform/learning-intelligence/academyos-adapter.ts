/**
 * Education adapter — delegates to AcademyOS learning pack (canonical mastery SoR).
 * Do not copy mastery/assessment logic here.
 */

import {
  buildLearningProgressSummary,
  createAssessmentService,
  createCurriculumService,
  createGradebookService,
  createInterventionService,
  createLearningParentPortalService,
  createLearningProfileService,
  createLearningReportingService,
  createMasteryService,
  createProgressService,
  DEFAULT_MASTERY_SCALE,
  MASTERY_LEVELS,
  ASSESSMENT_KINDS,
  INTERVENTION_KINDS,
  resetLearningStoreForTests,
  type MasteryLevel,
  type MasteryScaleConfig,
} from "@academyos";

export const academyOsLearningAdapter = Object.freeze({
  id: "academyos-learning" as const,
  description:
    "AcademyOS learning pack — curriculum, mastery, assessments, interventions, progress",
  soR: "packages/academyos/learning",
  createMasteryService,
  createAssessmentService,
  createCurriculumService,
  createInterventionService,
  createProgressService,
  createGradebookService,
  createLearningProfileService,
  createLearningReportingService,
  createLearningParentPortalService,
  buildLearningProgressSummary,
  resetLearningStoreForTests,
  constants: Object.freeze({
    MASTERY_LEVELS,
    ASSESSMENT_KINDS,
    INTERVENTION_KINDS,
    DEFAULT_MASTERY_SCALE,
  }),
});

export type { MasteryLevel, MasteryScaleConfig };
