export {
  CONNECTED_SYSTEM_PLACEHOLDERS,
  KNOWLEDGE_LIBRARY_CATEGORIES,
  type ConnectedSystemCard,
} from "@/lib/evidence-center/catalog";

export {
  EVIDENCE_DOMAINS,
  EVIDENCE_TYPES,
  EVIDENCE_STATUSES,
  ALLOWED_EVIDENCE_EXTENSIONS,
  REPORTING_PERIOD_KINDS,
  DEFAULT_BUSINESS_UNITS,
  CONFIDENTIALITY_LEVELS,
  EVIDENCE_SOURCES,
  RELATIONSHIP_TYPES,
  TIMELINE_EVENT_KINDS,
  type EvidenceDomain,
  type EvidenceType,
  type EvidenceStatus,
  type EvidenceDocument,
  type EvidenceVersion,
  type EvidenceRelationship,
  type EvidenceTimelineEvent,
  type UploadEvidenceInput,
  type EvidenceSearchFilters,
  type CatalogDashboardSummary,
  type ConfidentialityLevel,
  type EvidenceSource,
  type RelationshipType,
  type ReportingPeriodKind,
} from "@/lib/evidence-center/types";

export {
  validateUploadEvidence,
  isAllowedEvidenceFile,
  validateRelationshipType,
} from "@/lib/evidence-center/validate";

export {
  resetEvidenceStoreForTests,
  listEvidenceForOrganization,
  getEvidenceDocument,
  listBusinessUnitsForOrganization,
  addBusinessUnitForOrganization,
  listVersionsForDocument,
  listRelationshipsForDocument,
} from "@/lib/evidence-center/store";

export {
  uploadEvidence,
  addEvidenceVersion,
  createEvidenceRelationship,
  searchEvidence,
  getEvidenceForOrganization,
  getVersionsForOrganization,
  getRelationshipsForOrganization,
  queueSummary,
  catalogDashboardSummary,
  setEvidenceStatusForTests,
  simulateEvidenceProcessing,
} from "@/lib/evidence-center/service";

export {
  canAccessEvidenceOrganization,
  listAccessibleEvidenceOrganizations,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center/access";

export {
  KNOWLEDGE_GRAPH_NODE_TYPES,
  KNOWLEDGE_GRAPH_RELATIONSHIP_TYPES,
  PLACEHOLDER_NODE_TYPES,
  knowledgeGraphNodeId,
  resetKnowledgeGraphStoreForTests,
  listGraphNodes,
  listGraphEdges,
  getGraphNode,
  upsertKnowledgeGraphNode,
  createKnowledgeGraphEdge,
  updateKnowledgeGraphEdge,
  removeKnowledgeGraphEdge,
  queryKnowledgeGraph,
  knowledgeGraphSummary,
  queryConnectedEvidence,
  ensureOrganizationScaffold,
  syncEvidenceDocumentToGraph,
  syncEvidenceRelationshipToGraph,
  registerConnectorEvidenceInGraph,
  isKnowledgeGraphNodeType,
  isKnowledgeGraphRelationshipType,
  type KnowledgeGraphNodeType,
  type KnowledgeGraphRelationshipType,
  type KnowledgeGraphNode,
  type KnowledgeGraphEdge,
  type KnowledgeGraphSummary,
  type ConnectedEvidenceResult,
} from "@/lib/evidence-center/knowledge-graph";

export {
  PROCESSING_STAGES,
  PROCESSING_JOB_STATUSES,
  PROCESSING_STAGE_CATALOG,
  DEFAULT_PROCESSOR_CHAIN,
  createAndRunProcessingJob,
  runProcessingJob,
  retryProcessingJob,
  getProcessingJobForOrganization,
  listJobsForOrganization,
  listEventsForJob,
  pipelineDashboardMetrics,
  forceFailProcessingJobForTests,
  resetPipelineStoreForTests,
  type ProcessingStage,
  type ProcessingJobStatus,
  type EvidenceProcessingJob,
  type EvidenceProcessingEvent,
  type PipelineMetrics,
  type EvidenceProcessorModule,
} from "@/lib/evidence-center/pipeline";

export {
  JAG_EVIDENCE_DOCUMENTS_BUCKET,
  JAG_EVIDENCE_MAX_BYTES,
  JAG_EVIDENCE_ALLOWED_EXTENSIONS,
  JAG_EVIDENCE_ALLOWED_MIME_TYPES,
  sanitizeJagEvidenceFilename,
  buildJagEvidenceObjectPath,
  parseJagEvidenceObjectPath,
  assertJagEvidencePathForOrganization,
} from "@/lib/evidence-center/storage";
export type {
  JagEvidenceObjectRef,
  JagEvidenceDocumentLifecycle,
  JagEvidenceVersionStatus,
} from "@/lib/evidence-center/storage";

export { validateJagEvidenceFileInput } from "@/lib/evidence-center/validate-file";
export { isJagEvidenceMemoryFallbackEnabled } from "@/lib/evidence-center/memory-fallback";
export {
  resolveEvidenceUploadFileSelection,
  stemFromFilename,
} from "@/lib/evidence-center/upload-file-selection";
export {
  MAX_BULK_EVIDENCE_FILES,
  MAX_BULK_EVIDENCE_CONCURRENCY,
} from "@/lib/evidence-center/bulk-constants";
export {
  resolveEvidenceUploadBatchSelection,
  summarizeEvidenceQueue,
  countValidPending,
  clearEvidenceUploadModalBatchState,
} from "@/lib/evidence-center/bulk-queue";
export type {
  EvidenceUploadQueueItem,
  EvidenceUploadModalBatchUiState,
} from "@/lib/evidence-center/bulk-queue";
export {
  mapWithConcurrency,
  runJagEvidenceBulkUpload,
  selectItemsForBulkUpload,
} from "@/lib/evidence-center/bulk-upload";
export { runJagEvidenceSingleUpload } from "@/lib/evidence-center/client-upload";
export {
  authorizeEvidenceUpload,
  completeEvidenceUpload,
  createEvidenceDownloadUrl,
} from "@/lib/evidence-center/upload-service";
