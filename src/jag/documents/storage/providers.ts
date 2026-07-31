/**
 * Persistence / storage contracts only — no SQL or cloud drivers in this sprint.
 */

import type {
  DocumentInstance,
  DocumentInstanceId,
  DocumentVersion,
  DocumentVersionId,
} from "@/jag/documents/contracts/definitions";

/** Opaque content storage — adapters implement this later. */
export type DocumentStorageProvider = {
  readonly putObject: (input: {
    organizationId: string;
    contentRef: string;
    body: Uint8Array | ArrayBuffer;
    contentType?: string;
  }) => Promise<{ contentRef: string }>;
  readonly getObject: (input: {
    organizationId: string;
    contentRef: string;
  }) => Promise<{ body: Uint8Array; contentType?: string } | null>;
  readonly deleteObject?: (input: {
    organizationId: string;
    contentRef: string;
  }) => Promise<void>;
};

/** @deprecated Prefer DocumentStorageProvider — Sprint 002 port shape. */
export type JagDocumentStoragePort = {
  upload(input: {
    bucket: string;
    path: string;
    body: Blob | ArrayBuffer | Buffer;
    contentType?: string;
  }): Promise<{ path: string }>;
  createSignedUrl(input: {
    bucket: string;
    path: string;
    expiresInSeconds: number;
  }): Promise<{ url: string }>;
};

export type DocumentRepository = {
  readonly save: (instance: DocumentInstance) => Promise<void>;
  readonly findById: (
    instanceId: DocumentInstanceId
  ) => Promise<DocumentInstance | null>;
  readonly listByOrganization: (
    organizationId: string
  ) => Promise<readonly DocumentInstance[]>;
};

export type DocumentVersionRepository = {
  readonly append: (version: DocumentVersion) => Promise<void>;
  readonly list: (
    instanceId: DocumentInstanceId
  ) => Promise<readonly DocumentVersion[]>;
  readonly findById: (
    versionId: DocumentVersionId
  ) => Promise<DocumentVersion | null>;
};

export type DocumentPersistencePorts = {
  readonly documents?: DocumentRepository;
  readonly versions?: DocumentVersionRepository;
  readonly storage?: DocumentStorageProvider;
};

let persistence: DocumentPersistencePorts = Object.freeze({});

export function bindDocumentPersistence(
  ports: DocumentPersistencePorts
): void {
  persistence = Object.freeze({ ...ports });
}

export function getDocumentPersistence(): DocumentPersistencePorts {
  return persistence;
}

export function resetDocumentPersistenceForTests(): void {
  persistence = Object.freeze({});
}
