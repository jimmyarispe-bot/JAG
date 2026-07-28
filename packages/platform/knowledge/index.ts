/**
 * JAG Knowledge™ — public platform entry (P-014).
 */

export const KNOWLEDGE_ID = "jag-knowledge" as const;
export const KNOWLEDGE_VERSION = "1.0.0" as const;

export const KNOWLEDGE_DESCRIPTOR = Object.freeze({
  id: KNOWLEDGE_ID,
  name: "JAG Knowledge™" as const,
  version: KNOWLEDGE_VERSION,
  type: "platform-capability" as const,
  description:
    "Canonical Knowledge Engine for documents, evidence, knowledge graph, search, OCR, and AI-ready context — consumed by every intelligence domain; education interpretation belongs to P-015.",
});

export { KNOWLEDGE_GUARDS } from "./types";
export type {
  Citation,
  DocumentDomain,
  DocumentRecord,
  DocumentStatus,
  DocumentTypeDefinition,
  DocumentTypeKey,
  DocumentVersion,
  EvidenceFact,
  ExtractionMethod,
  ExtractedEntity,
  GraphEdge,
  GraphNode,
  GraphNodeKind,
  KnowledgeFolder,
  KnowledgeInsight,
  KnowledgeRecommendation,
  KnowledgeSummary,
  KnowledgeWorkflow,
  OcrResult,
  SearchHit,
  SummaryKind,
  TimelineEntry,
  VerificationStatus,
  WorkflowKind,
} from "./types";

export { KnowledgeEngine, createKnowledgeEngine } from "./engine";
export { resetKnowledgeStoreForTests } from "./store";
export {
  KNOWLEDGE_SINKS,
  listKnowledgeEvents,
  listKnowledgeEvidenceLedger,
  listKnowledgeMemory,
  listKnowledgeTwin,
  resetKnowledgeOpsStoreForTests,
} from "./events";
export { DOCUMENT_TYPE_PRESETS } from "./core";
