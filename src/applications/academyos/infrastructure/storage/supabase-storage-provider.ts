import type { StorageProvider } from "@/applications/academyos/infrastructure/storage/types";

type StorageBucketApi = {
  upload: (
    path: string,
    data: Uint8Array | string,
    opts?: { contentType?: string; upsert?: boolean }
  ) => Promise<{ error: { message: string } | null }>;
  download: (
    path: string
  ) => Promise<{ data: Blob | null; error: { message: string } | null }>;
  remove: (
    paths: string[]
  ) => Promise<{ error: { message: string } | null }>;
  list: (
    path?: string
  ) => Promise<{
    data: Array<{ name: string; updated_at?: string; metadata?: { size?: number } }> | null;
    error: { message: string } | null;
  }>;
  createSignedUrl: (
    path: string,
    expiresIn: number
  ) => Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
};

export type SupabaseStorageLikeClient = {
  storage: {
    from: (bucket: string) => StorageBucketApi;
  };
};

export function createSupabaseStorageProvider(
  client: SupabaseStorageLikeClient
): StorageProvider {
  return {
    id: "supabase",
    async upload(input) {
      const { error } = await client.storage.from(input.bucket).upload(
        input.path,
        input.data,
        { contentType: input.contentType, upsert: true }
      );
      if (error) throw new Error(`Storage upload failed: ${error.message}`);
      return {
        path: input.path,
        bucket: input.bucket,
        contentType: input.contentType ?? null,
        sizeBytes:
          typeof input.data === "string"
            ? new TextEncoder().encode(input.data).byteLength
            : input.data.byteLength,
        updatedAt: new Date().toISOString(),
      };
    },
    async download(input) {
      const { data, error } = await client.storage
        .from(input.bucket)
        .download(input.path);
      if (error || !data) return null;
      const buffer = await data.arrayBuffer();
      return new Uint8Array(buffer);
    },
    async delete(input) {
      const { error } = await client.storage
        .from(input.bucket)
        .remove([input.path]);
      if (error) throw new Error(`Storage delete failed: ${error.message}`);
      return true;
    },
    async getMetadata(input) {
      const folder = input.path.includes("/")
        ? input.path.slice(0, input.path.lastIndexOf("/"))
        : "";
      const name = input.path.includes("/")
        ? input.path.slice(input.path.lastIndexOf("/") + 1)
        : input.path;
      const { data, error } = await client.storage.from(input.bucket).list(folder);
      if (error || !data) return null;
      const hit = data.find((item) => item.name === name);
      if (!hit) return null;
      return {
        path: input.path,
        bucket: input.bucket,
        contentType: null,
        sizeBytes: hit.metadata?.size ?? null,
        updatedAt: hit.updated_at ?? null,
      };
    },
    async createSignedUrl(input) {
      const { data, error } = await client.storage
        .from(input.bucket)
        .createSignedUrl(input.path, input.expiresInSeconds);
      if (error || !data) return null;
      return data.signedUrl;
    },
  };
}
