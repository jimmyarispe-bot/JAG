export type StorageObjectMetadata = {
  path: string;
  bucket: string;
  contentType?: string | null;
  sizeBytes?: number | null;
  updatedAt?: string | null;
};

export type StorageProvider = {
  readonly id: "memory" | "supabase";
  upload(input: {
    bucket: string;
    path: string;
    data: Uint8Array | string;
    contentType?: string;
  }): Promise<StorageObjectMetadata>;
  download(input: {
    bucket: string;
    path: string;
  }): Promise<Uint8Array | null>;
  delete(input: { bucket: string; path: string }): Promise<boolean>;
  getMetadata(input: {
    bucket: string;
    path: string;
  }): Promise<StorageObjectMetadata | null>;
  createSignedUrl(input: {
    bucket: string;
    path: string;
    expiresInSeconds: number;
  }): Promise<string | null>;
};
