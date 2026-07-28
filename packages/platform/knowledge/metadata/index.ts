import { nowIso } from "../ids";
import { kstore } from "../store";
import type { DocumentRecord } from "../types";

export function setMetadata(input: {
  organizationId: string;
  documentId: string;
  metadata: Readonly<Record<string, unknown>>;
  merge?: boolean;
}): DocumentRecord {
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  return kstore.upsertDocument({
    ...doc,
    metadata: Object.freeze(
      input.merge === false
        ? { ...input.metadata }
        : { ...doc.metadata, ...input.metadata }
    ),
    updatedAt: nowIso(),
  });
}

export function getMetadata(documentId: string) {
  return kstore.getDocument(documentId)?.metadata ?? null;
}
