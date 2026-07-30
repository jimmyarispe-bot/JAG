/**
 * Explainability & Intelligence Graph Explorer — Sprint 208.
 * Application layer only. Import via `…/explain/index`.
 */

export {
  EXPLAIN_NODE_KINDS,
  EXPLAIN_EDGE_KINDS,
  type ExplainNodeKind,
  type ExplainEdgeKind,
  type ExplainEvidenceRef,
  type ExplainTimelineEntry,
  type ExplainConfidence,
  type ExplainNode,
  type ExplainEdge,
  type ReasoningStep,
  type Explanation,
  type GraphQuery,
  type ExplainGraph,
} from "./types";

export { analyzeConfidence } from "./ConfidenceAnalyzer";
export { collectEvidence } from "./EvidenceCollector";
export { buildReasoningChain } from "./ReasoningChain";
export {
  exploreDependencies,
  resetDependencyTraversalForTests,
} from "./DependencyExplorer";
export { buildExplainGraph, nodeKindLabel, type GraphSeed } from "./GraphBuilder";
export {
  generateExplanation,
  resetExplanationCacheForTests,
} from "./ExplanationEngine";
export {
  ExplainabilityRegistry,
  type ExplanationSubject,
  type SubjectExplainer,
} from "./ExplainabilityRegistry";
export {
  recordExplainObservation,
  listExplainObservations,
  clearExplainObservationsForTests,
  type ExplainObservation,
  type ExplainObservationKind,
} from "./ExplainabilityObservability";
export {
  ExplanationService,
  buildOrganizationGraphSeed,
  resetExplainabilityForTests,
} from "./ExplanationService";
