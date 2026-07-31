import type {
  StorageObjectMetadata,
  StorageProvider,
} from "@/applications/academyos/infrastructure/storage/types";

type Entry = {
  data: Uint8Array;
  contentType?: string;
  updatedAt: string;
};

export function createMemoryStorageProvider(): StorageProvider {
  const store = new Map<string, Entry>();
  const key = (bucket: string, path: string) => `${bucket}::${path}`;

  return {
    id: "memory",
    async upload(input) {
      const bytes =
        typeof input.data === "string"
          ? new TextEncoder().encode(input.data)
          : input.data;
      const updatedAt = new Date().toISOString();
      store.set(key(input.bucket, input.path), {
        data: bytes,
        contentType: input.contentType,
        updatedAt,
      });
      return {
        path: input.path,
        bucket: input.bucket,
        contentType: input.contentType ?? null,
        sizeBytes: bytes.byteLength,
        updatedAt,
      };
    },
    async download(input) {
      return store.get(key(input.bucket, input.path))?.data ?? null;
    },
    async delete(input) {
      return store.delete(key(input.bucket, input.path));
    },
    async getMetadata(input) {
      const hit = store.get(key(input.bucket, input.path));
      if (!hit) return null;
      return {
        path: input.path,
        bucket: input.bucket,
        contentType: hit.contentType ?? null,
        sizeBytes: hit.data.byteLength,
        updatedAt: hit.updatedAt,
      } satisfies StorageObjectMetadata;
    },
    async createSignedUrl(input) {
      const hit = store.get(key(input.bucket, input.path));
      if (!hit) return null;
      return `memory://${input.bucket}/${input.path}?exp=${input.expiresInSeconds}`;
    },
  };
}
