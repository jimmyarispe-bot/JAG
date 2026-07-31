import {
  assertEntityTypeRegistered,
  entityHasCapability,
} from "@/lib/platform/entities/registry";
import type { EntityDocument } from "@/lib/platform/entities/types";

const documentStore = new Map<string, EntityDocument>();
let docSeq = 0;

export function resetEntityDocumentsForTests(): void {
  documentStore.clear();
  docSeq = 0;
}

/**
 * Generic document capability — storage hooks only.
 * Does not change blob/object storage backends.
 */
export function attachEntityDocument(input: {
  entityType: string;
  entityId: string;
  title: string;
  organizationId?: string | null;
  mimeType?: string | null;
  storageRef?: string | null;
  ownerUserId?: string | null;
  metadata?: Record<string, unknown>;
  now?: string;
}): EntityDocument {
  assertEntityTypeRegistered(input.entityType);
  if (!entityHasCapability(input.entityType, "documents")) {
    throw new Error(
      `Entity type "${input.entityType}" does not enable documents`
    );
  }
  const now = input.now ?? new Date().toISOString();
  docSeq += 1;
  const doc: EntityDocument = {
    id: `ent-doc:${docSeq}:${now}`,
    entityType: input.entityType,
    entityId: input.entityId,
    organizationId: input.organizationId ?? null,
    title: input.title,
    mimeType: input.mimeType ?? null,
    storageRef: input.storageRef ?? null,
    version: 1,
    ownerUserId: input.ownerUserId ?? null,
    createdAt: now,
    updatedAt: now,
    metadata: { ...(input.metadata ?? {}) },
  };
  documentStore.set(doc.id, doc);
  return { ...doc, metadata: { ...doc.metadata } };
}

/** Versioning hook — increments version and optional storageRef. */
export function bumpEntityDocumentVersion(input: {
  documentId: string;
  storageRef?: string | null;
  title?: string;
  now?: string;
}): EntityDocument {
  const existing = documentStore.get(input.documentId);
  if (!existing) throw new Error(`Document not found: ${input.documentId}`);
  const now = input.now ?? new Date().toISOString();
  const updated: EntityDocument = {
    ...existing,
    version: existing.version + 1,
    storageRef:
      input.storageRef !== undefined ? input.storageRef : existing.storageRef,
    title: input.title ?? existing.title,
    updatedAt: now,
    metadata: {
      ...existing.metadata,
      previousVersion: existing.version,
    },
  };
  documentStore.set(updated.id, updated);
  return { ...updated, metadata: { ...updated.metadata } };
}

export function listEntityDocuments(
  entityType: string,
  entityId: string
): EntityDocument[] {
  return [...documentStore.values()]
    .filter((d) => d.entityType === entityType && d.entityId === entityId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((d) => ({ ...d, metadata: { ...d.metadata } }));
}

export function getEntityDocument(documentId: string): EntityDocument | null {
  const d = documentStore.get(documentId);
  return d ? { ...d, metadata: { ...d.metadata } } : null;
}
