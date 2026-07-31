/**
 * JAG Learning Intelligence™ (P-015) — shared contracts.
 *
 * Pedagogy runtime SoR remains `packages/academyos/learning` (integrated, not replaced).
 * This package is the shared entry point other domains consume.
 */

export const LEARNING_INTELLIGENCE_GUARDS = Object.freeze({
  learningIntelligence: true,
  integratesAcademyOsMastery: true,
  duplicatesMasteryModel: false,
  duplicatesAssessmentModel: false,
  rebuildsPedagogyIp: false,
  educationGradebookRulesInPlatformCore: false,
  pedagogyInterpretationHere: true,
  knowledgeHoldsDocumentsOnly: true,
});

export type LearningIntelligenceDescriptor = {
  readonly id: "jag-learning-intelligence";
  readonly name: "JAG Learning Intelligence™";
  readonly version: string;
  readonly integrates: readonly string[];
};
