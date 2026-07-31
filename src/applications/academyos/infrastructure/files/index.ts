/**
 * Files abstraction — aliases storage provider for document/binary workflows.
 * Prefer StorageProvider for new code; this re-export keeps the package layout complete.
 */
export type {
  StorageObjectMetadata as FileObjectMetadata,
  StorageProvider as FilesProvider,
} from "@/applications/academyos/infrastructure/storage";
export {
  createMemoryStorageProvider as createMemoryFilesProvider,
  createSupabaseStorageProvider as createSupabaseFilesProvider,
} from "@/applications/academyos/infrastructure/storage";
