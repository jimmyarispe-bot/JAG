import {
  assertEntityTypeRegistered,
  entityHasCapability,
} from "@/lib/platform/entities/registry";
import { getEntityDocument } from "@/lib/platform/entities/documents";
import type { EntityAttachment } from "@/lib/platform/entities/types";

const attachmentStore = new Map<string, EntityAttachment>();
let attSeq = 0;

export function resetEntityAttachmentsForTests(): void {
  attachmentStore.clear();
  attSeq = 0;
}

/**
 * Lightweight attachment records. May link to an EntityDocument id.
 * No storage backend changes.
 */
export function addEntityAttachment(input: {
  entityType: string;
  entityId: string;
  fileName: string;
  documentId?: string | null;
  mimeType?: string | null;
  storageRef?: string | null;
  sizeBytes?: number | null;
  metadata?: Record<string, unknown>;
  now?: string;
}): EntityAttachment {
  assertEntityTypeRegistered(input.entityType);
  if (
    !entityHasCapability(input.entityType, "attachments") &&
    !entityHasCapability(input.entityType, "documents")
  ) {
    throw new Error(
      `Entity type "${input.entityType}" does not enable attachments/documents`
    );
  }
  if (input.documentId && !getEntityDocument(input.documentId)) {
    throw new Error(`Linked document not found: ${input.documentId}`);
  }
  const now = input.now ?? new Date().toISOString();
  attSeq += 1;
  const row: EntityAttachment = {
    id: `ent-att:${attSeq}:${now}`,
    entityType: input.entityType,
    entityId: input.entityId,
    documentId: input.documentId ?? null,
    fileName: input.fileName,
    mimeType: input.mimeType ?? null,
    storageRef: input.storageRef ?? null,
    sizeBytes: input.sizeBytes ?? null,
    createdAt: now,
    metadata: { ...(input.metadata ?? {}) },
  };
  attachmentStore.set(row.id, row);
  return { ...row, metadata: { ...row.metadata } };
}

export function listEntityAttachments(
  entityType: string,
  entityId: string
): EntityAttachment[] {
  return [...attachmentStore.values()]
    .filter((a) => a.entityType === entityType && a.entityId === entityId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((a) => ({ ...a, metadata: { ...a.metadata } }));
}
