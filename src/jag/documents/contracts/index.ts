export type {
  DocumentCategory,
  DocumentCategoryId,
  DocumentClassification,
  DocumentDefinition,
  DocumentDefinitionId,
  DocumentEvent,
  DocumentEventType,
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
} from "@/jag/documents/contracts/definitions";

export { DOCUMENT_CLASSIFICATIONS } from "@/jag/documents/contracts/definitions";

export type {
  CommunicationsDocumentPort,
  DecisionDocumentPort,
  DocumentExtensionCallResult,
  DocumentExtensionPorts,
  EntityDocumentPort,
  FormsDocumentPort,
  IntelligenceDocumentPort,
  ProcessDocumentPort,
  WorkflowDocumentPort,
} from "@/jag/documents/contracts/extensions";

export {
  bindDocumentExtensions,
  getDocumentExtensions,
  resetDocumentExtensionsForTests,
} from "@/jag/documents/contracts/extensions";
