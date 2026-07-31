import type { StorageObjectMetadata } from "@/applications/academyos/infrastructure/storage";

export type DocumentRef = {
  id: string;
  bucket: string;
  path: string;
  fileName: string;
  contentType?: string | null;
  sizeBytes?: number | null;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
};

export type DocumentStorageProvider = {
  readonly id: "memory" | "supabase";
  uploadAttachment(input: {
    bucket?: string;
    path: string;
    fileName: string;
    data: Uint8Array | string;
    contentType?: string;
    entityType?: string | null;
    entityId?: string | null;
  }): Promise<DocumentRef>;
  downloadAttachment(ref: Pick<DocumentRef, "bucket" | "path">): Promise<Uint8Array | null>;
  deleteAttachment(ref: Pick<DocumentRef, "bucket" | "path">): Promise<boolean>;
  getMetadata(ref: Pick<DocumentRef, "bucket" | "path">): Promise<StorageObjectMetadata | null>;
  createSignedUrl(input: {
    bucket: string;
    path: string;
    expiresInSeconds?: number;
  }): Promise<string | null>;
};
