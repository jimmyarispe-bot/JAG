/**
 * JAG OS — Universal Documents Engine (public API).
 */

export type {
  CommunicationsDocumentPort,
  DecisionDocumentPort,
  DocumentCategory,
  DocumentCategoryId,
  DocumentClassification,
  DocumentDefinition,
  DocumentDefinitionId,
  DocumentEvent,
  DocumentEventType,
  DocumentExtensionCallResult,
  DocumentExtensionPorts,
  DocumentInstance,
  DocumentInstanceId,
  DocumentLifecycleStatus,
  DocumentMetadata,
  DocumentMetrics,
  DocumentPermission,
  DocumentPermissionAction,
  DocumentReference,
  DocumentResult,
  DocumentTemplate,
  DocumentTemplateId,
  DocumentVersion,
  DocumentVersionId,
  EntityDocumentPort,
  FormsDocumentPort,
  IntelligenceDocumentPort,
  ProcessDocumentPort,
  WorkflowDocumentPort,
} from "@/jag/documents/contracts";

export {
  DOCUMENT_CLASSIFICATIONS,
  bindDocumentExtensions,
  getDocumentExtensions,
  resetDocumentExtensionsForTests,
} from "@/jag/documents/contracts";

export {
  DocumentRegistry,
  assertDocumentRegistered,
  getDocumentCategory,
  getDocumentDefinition,
  getDocumentTemplate,
  listDocumentCategories,
  listDocumentDefinitions,
  listDocumentTemplates,
  registerDocument,
  registerDocumentCategory,
  registerDocumentTemplate,
  resetDocumentRegistryForTests,
  validateDocumentRegistryDependencies,
} from "@/jag/documents/registry";

export {
  DocumentRuntime,
  accessDocument,
  archiveDocument,
  createDocument,
  documentNow,
  getDocumentAccessCount,
  getDocumentInstance,
  getDocumentMetrics,
  getDocumentVersion,
  linkDocument,
  listDocumentInstances,
  listDocumentVersions,
  resetDocumentClockForTests,
  resetDocumentIdsForTests,
  resetDocumentInstanceStoreForTests,
  restoreDocument,
  setDocumentClockForTests,
  setDocumentIdPrefixForTests,
  updateDocumentMetadata,
  validateDocument,
  versionDocument,
} from "@/jag/documents/runtime";

export {
  assertAllowedClassification,
  assertUniversalClassification,
  isDocumentClassification,
  listUniversalClassifications,
} from "@/jag/documents/classification";

export {
  assertVersionImmutable,
  getCurrentVersion,
  orderVersionsAscending,
  resolveHistoricalVersions,
} from "@/jag/documents/versions";

export { checkDocumentPermission } from "@/jag/documents/permissions";

export type {
  DocumentPersistencePorts,
  DocumentRepository,
  DocumentStorageProvider,
  DocumentVersionRepository,
  JagDocumentStoragePort,
} from "@/jag/documents/storage";

export {
  bindDocumentPersistence,
  getDocumentPersistence,
  resetDocumentPersistenceForTests,
} from "@/jag/documents/storage";

export {
  emitDocumentEvent,
  listDocumentEvents,
  resetDocumentEventsForTests,
  subscribeDocumentEvents,
} from "@/jag/documents/events";

export type { DocumentTelemetryEvent } from "@/jag/documents/telemetry";
export {
  resetDocumentTelemetryForTests,
  subscribeDocumentTelemetry,
  trackDocumentTelemetry,
} from "@/jag/documents/telemetry";

export {
  createTestDocumentDefinition,
  freezeDocumentEngineForTests,
  registerTestDocument,
  resetDocumentEngineForTests,
} from "@/jag/documents/testing";
