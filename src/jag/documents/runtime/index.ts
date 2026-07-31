export {
  documentNow,
  resetDocumentClockForTests,
  setDocumentClockForTests,
} from "@/jag/documents/runtime/clock";
export {
  nextDocumentOpaqueId,
  resetDocumentIdsForTests,
  setDocumentIdPrefixForTests,
} from "@/jag/documents/runtime/ids";
export {
  getDocumentAccessCount,
  getDocumentInstance,
  getDocumentVersion,
  listDocumentInstances,
  listDocumentVersions,
  resetDocumentInstanceStoreForTests,
} from "@/jag/documents/runtime/instance-store";
export {
  DocumentRuntime,
  accessDocument,
  archiveDocument,
  createDocument,
  getDocumentMetrics,
  linkDocument,
  restoreDocument,
  updateDocumentMetadata,
  validateDocument,
  versionDocument,
  type CreateDocumentInput,
} from "@/jag/documents/runtime/document-runtime";
