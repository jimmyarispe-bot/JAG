import type {
  DocumentRef,
  DocumentStorageProvider,
} from "@/applications/academyos/infrastructure/documents/types";
import type { StorageProvider } from "@/applications/academyos/infrastructure/storage";

const DEFAULT_BUCKET = "academyos-documents";

export function createDocumentStorageProvider(
  storage: StorageProvider,
  options?: { defaultBucket?: string }
): DocumentStorageProvider {
  const defaultBucket = options?.defaultBucket ?? DEFAULT_BUCKET;
  let seq = 0;

  return {
    id: storage.id,
    async uploadAttachment(input) {
      const bucket = input.bucket ?? defaultBucket;
      const meta = await storage.upload({
        bucket,
        path: input.path,
        data: input.data,
        contentType: input.contentType,
      });
      seq += 1;
      return {
        id: `doc_${seq}_${Date.now().toString(36)}`,
        bucket,
        path: input.path,
        fileName: input.fileName,
        contentType: meta.contentType ?? input.contentType ?? null,
        sizeBytes: meta.sizeBytes ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        createdAt: meta.updatedAt ?? new Date().toISOString(),
      } satisfies DocumentRef;
    },
    downloadAttachment: (ref) =>
      storage.download({ bucket: ref.bucket, path: ref.path }),
    deleteAttachment: (ref) =>
      storage.delete({ bucket: ref.bucket, path: ref.path }),
    getMetadata: (ref) =>
      storage.getMetadata({ bucket: ref.bucket, path: ref.path }),
    createSignedUrl: (input) =>
      storage.createSignedUrl({
        bucket: input.bucket,
        path: input.path,
        expiresInSeconds: input.expiresInSeconds ?? 3600,
      }),
  };
}
