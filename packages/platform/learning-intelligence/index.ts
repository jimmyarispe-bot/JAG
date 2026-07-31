/**
 * JAG Learning Intelligence™ — public platform entry (P-015).
 *
 * Integrates AcademyOS mastery/assessment/intervention runtime.
 * Does not recreate pedagogy IP or replace packages/academyos/learning.
 */

export const LEARNING_INTELLIGENCE_ID = "jag-learning-intelligence" as const;
export const LEARNING_INTELLIGENCE_VERSION = "1.0.0" as const;

export const LEARNING_INTELLIGENCE_DESCRIPTOR = Object.freeze({
  id: LEARNING_INTELLIGENCE_ID,
  name: "JAG Learning Intelligence™" as const,
  version: LEARNING_INTELLIGENCE_VERSION,
  type: "platform-capability" as const,
  description:
    "Shared Learning Intelligence facade that integrates AcademyOS mastery, assessment, curriculum, intervention, and progress services — consumed by Education UX and future industry adapters.",
  integrates: Object.freeze([
    "packages/academyos/learning",
    "docs/blueprints/academy-way-learning-system",
    "docs/platform/consolidation/10_CANONICAL_PRODUCT_SPEC.md",
  ]),
});

export { LEARNING_INTELLIGENCE_GUARDS } from "./types";
export {
  LearningIntelligenceEngine,
  createLearningIntelligenceEngine,
  resetLearningIntelligenceForTests,
} from "./engine";
export { academyOsLearningAdapter } from "./academyos-adapter";
export type { MasteryLevel, MasteryScaleConfig } from "./academyos-adapter";
export {
  LEARNING_INTELLIGENCE_SINKS,
  listLearningIntelEvents,
  listLearningIntelEvidence,
  listLearningIntelMemory,
  listLearningIntelTwin,
  resetLearningIntelOpsStoreForTests,
} from "./events";
