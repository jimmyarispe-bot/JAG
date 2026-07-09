/** Personal Learning Journey (PAJ) runtime — Doc 3 */
import "@/lib/platform/paj/registry/register";

export * from "@/lib/platform/paj/types";
export { PAJ_ENGINE_VERSION } from "@/lib/platform/paj/types";
export { createLearningJourney } from "@/lib/platform/paj/lifecycle/create-journey";
export { processJourneyEvidence } from "@/lib/platform/paj/lifecycle/process-evidence";
export { confirmCompetencyAdvance } from "@/lib/platform/paj/lifecycle/confirm-advance";
export { getJourneySnapshot } from "@/lib/platform/paj/query/journey";
export { getCompetencyGuidance } from "@/lib/platform/paj/guidance";
export { evaluateJourneyRecommendations } from "@/lib/platform/paj/recommendations";
export {
  evaluateEvidenceBundle,
  canAdvanceFromCompetency,
  resolveNextCompetencyKey,
} from "@/lib/platform/paj/mastery";
export {
  resolveSlPlacementCompetency,
  evaluatePrerequisitesMet,
} from "@/lib/platform/paj/progression";
export { PAJ_EVENT_DEFINITIONS } from "@/lib/platform/paj/catalog/events";
