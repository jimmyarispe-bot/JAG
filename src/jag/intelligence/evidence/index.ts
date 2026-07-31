/**
 * Evidence Graph v1 — provider-independent organizational evidence model.
 */

export { EVIDENCE_GRAPH_VERSION } from "@/jag/intelligence/evidence/version";

export {
  ORGANIZATIONAL_EVIDENCE_KINDS,
  FORBIDDEN_EVIDENCE_KINDS,
  EVIDENCE_GRAPH_SOURCE_KINDS,
  type OrganizationalEvidenceKind,
  type ForbiddenEvidenceKind,
  type EvidenceGraphSourceKind,
} from "@/jag/intelligence/evidence/reference-kinds";

export {
  EVIDENCE_PRIORITIES,
  defaultPriorityForKind,
  evidencePriorityRank,
  compareEvidencePriority,
  type EvidencePriority,
} from "@/jag/intelligence/evidence/priority";

export type {
  EvidenceNodeId,
  EvidenceNode,
  EvidenceEdgeType,
  EvidenceCorrelationSink,
  EvidenceEdge,
  EvidenceCorrelation,
  EvidenceGraph,
  EvidenceBundle,
  DeclaredEvidenceLink,
  EvidenceCollectorSeed,
  EvidenceCollectorInput,
} from "@/jag/intelligence/evidence/types";

export {
  EVIDENCE_CORRELATION_RULES,
  listCorrelationRules,
  findCorrelationRule,
  type EvidenceCorrelationRule,
} from "@/jag/intelligence/evidence/correlation-rules";

export { correlateEvidenceNodes } from "@/jag/intelligence/evidence/correlation";

export {
  nodeIdFor,
  compareEvidenceNodes,
  compareEvidenceEdges,
  sortGraphMembers,
  wouldCreateCycle,
  freezeGraph,
} from "@/jag/intelligence/evidence/graph-utils";

export {
  collectEvidenceGraph,
  createEvidenceCollector,
  type EvidenceCollector,
  type EvidenceCollectorResult,
} from "@/jag/intelligence/evidence/collector";

export {
  createEvidenceResolver,
  type EvidenceResolver,
} from "@/jag/intelligence/evidence/resolver";

export { buildEvidenceBundle } from "@/jag/intelligence/evidence/bundle";

export {
  traceFindingThroughGraph,
  type EvidenceTracePath,
  type FindingEvidenceTrace,
} from "@/jag/intelligence/evidence/traceability";

export { validateEvidenceGraph } from "@/jag/intelligence/evidence/validate-graph";
