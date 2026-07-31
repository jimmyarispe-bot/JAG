export type {
  DocumentPersistencePorts,
  DocumentRepository,
  DocumentStorageProvider,
  DocumentVersionRepository,
  JagDocumentStoragePort,
} from "@/jag/documents/storage/providers";

export {
  bindDocumentPersistence,
  getDocumentPersistence,
  resetDocumentPersistenceForTests,
} from "@/jag/documents/storage/providers";
