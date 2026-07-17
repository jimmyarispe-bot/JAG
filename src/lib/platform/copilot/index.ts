/**
 * Executive Copilot — public exports.
 *
 * Transforms connected organizational systems + existing intelligence into
 * evidence-backed executive reasoning. Does not create domains or modify connectors.
 */

export { COPILOT_VERSION, COPILOT_INTENTS, EVIDENCE_SYSTEMS } from "./types";
export type {
  CopilotIntent,
  EvidenceSystem,
  EvidenceItem,
  EvidenceChain,
  ExplainabilityBundle,
  ExecutiveReasoningLens,
  CopilotRecommendation,
  ConnectorSystemSnapshot,
  IntelligenceSnapshot,
  CopilotContext,
  SessionMemory,
  ConversationTurn,
  DecisionScenarioKind,
  DecisionSimulationResult,
  ExecutiveMorningBrief,
  CopilotAskRequest,
  CopilotAskResult,
} from "./types";

export type { CopilotEngine } from "./contracts";

export {
  buildEvidenceChain,
  buildEvidenceChainFromContext,
  connectorEvidence,
  intelligenceEvidence,
} from "./evidence/chain";

export {
  snapshotAcademyOs,
  snapshotQuickBooks,
  snapshotSquare,
  snapshotPlaid,
  snapshotGoogleWorkspace,
  orderedConnectorSnapshots,
} from "./context/connectors";

export {
  recommendationFromWisdom,
  primaryRecommendation,
  allRecommendations,
  buildExplainability,
} from "./recommendation/framework";

export { routeIntent, isSimulationIntent } from "./conversation/intents";
export {
  createSessionMemory,
  rememberQuestion,
  applyTurnMemory,
} from "./conversation/memory";
export { runConversation } from "./conversation/engine";

export { buildMorningBrief, formatBriefAnswer } from "./brief/morning";

export { SCENARIO_CATALOG, matchScenarioKind, resolveScenarioDefinition } from "./simulator/catalog";
export { buildSimulationResult } from "./simulator/engine";
export type { PredictiveSoftResult } from "./simulator/engine";

export { createCopilotEngine, askCopilot, morningBrief } from "./orchestrator";
export type { OrchestratorDeps } from "./orchestrator";
