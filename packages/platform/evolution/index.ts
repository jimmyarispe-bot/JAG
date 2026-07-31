/**
 * JAG Evolution™ — public platform entry (P-005).
 */

export const EVOLUTION_ID = "jag-evolution" as const;
export const EVOLUTION_VERSION = "1.0.0" as const;

export const EVOLUTION_DESCRIPTOR = Object.freeze({
  id: EVOLUTION_ID,
  name: "JAG Evolution™" as const,
  version: EVOLUTION_VERSION,
  type: "platform-capability" as const,
  description:
    "Governed continuous-improvement engine that captures ideas, analyzes the repository, classifies requests, and produces evidence-backed proposals — never automatic production code.",
});

export type {
  ArchitectureLayer,
  ArchitectureReview,
  EvolutionAnalyticsSnapshot,
  EvolutionCaptureRequest,
  EvolutionClassification,
  EvolutionDashboard,
  EvolutionProposal,
  EvolutionRequestStatus,
  EvolutionUnderstanding,
  PriorityScores,
  RepositoryAnalysis,
  RepositoryHit,
} from "./types";
export { EVOLUTION_CLASSIFICATIONS } from "./types";
export {
  resetEvolutionStoreForTests,
  listRequests,
  listProposals,
  buildEvolutionAnalytics,
} from "./store";
export {
  captureEvolutionRequest,
  isTeachJagUtterance,
} from "./capture";
export { analyzeUnderstanding } from "./analysis/understand";
export { analyzeRepository } from "./repository/search";
export { reviewArchitecture } from "./governance/architecture";
export { classifyEvolution } from "./classification/classify";
export { scorePriority } from "./prioritization/score";
export { generateEvolutionProposal } from "./proposals/generate";
export { formatTeachJagMessage } from "./automation/mr-jag-response";
export { EVOLUTION_AUTOMATION_GUARDS } from "./automation";
export { buildEvolutionDashboard } from "./dashboard/build";
export { EvolutionEngine, createEvolutionEngine } from "./engine";
