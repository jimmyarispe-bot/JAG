import { publishKnowledgeEvent } from "../events";
import { parseDocument } from "../parsing";
import { hashVector, newId, nowIso } from "../ids";
import { kstore } from "../store";
import type { SemanticIndexEntry } from "../types";

export function indexDocument(input: {
  organizationId: string;
  userId: string;
  documentId: string;
}): SemanticIndexEntry {
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  const parsed = parseDocument(input);
  const text = `${doc.title}\n${parsed.text}\n${doc.tags.join(" ")}`;
  const entry = kstore.upsertIndex({
    id: newId("kidx"),
    organizationId: input.organizationId,
    documentId: doc.id,
    versionId: doc.currentVersionId,
    vector: hashVector(text),
    text,
    createdAt: nowIso(),
  });
  publishKnowledgeEvent({
    type: "knowledge.indexed",
    organizationId: input.organizationId,
    recordType: "semantic_index",
    recordId: entry.id,
    actorUserId: input.userId,
    payload: { documentId: doc.id, dims: entry.vector.length },
  });
  return entry;
}

export function listIndex(organizationId: string) {
  return kstore.listIndex(organizationId);
}
