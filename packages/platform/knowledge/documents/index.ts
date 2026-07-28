import { resolveDocumentType } from "../core";
import { publishKnowledgeEvent } from "../events";
import { contentHash, newId, nowIso } from "../ids";
import { putObject } from "../storage";
import { kstore } from "../store";
import type { DocumentRecord, DocumentVersion } from "../types";
import { appendTimeline } from "../timeline";
import { linkDocumentNode } from "../knowledge-graph";

export function uploadDocument(input: {
  organizationId: string;
  userId: string;
  title: string;
  content: string;
  mimeType?: string;
  typeKey?: string;
  folderId?: string | null;
  tags?: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
  changeNote?: string | null;
}): { document: DocumentRecord; version: DocumentVersion } {
  const type = resolveDocumentType(
    input.organizationId,
    input.typeKey ?? "general"
  );
  const mime = input.mimeType ?? "text/plain";
  const obj = putObject({
    organizationId: input.organizationId,
    content: input.content,
    mimeType: mime,
  });
  const versionId = newId("kver");
  const docId = newId("kdoc");
  const now = nowIso();

  const version = kstore.upsertVersion({
    id: versionId,
    organizationId: input.organizationId,
    documentId: docId,
    versionNumber: 1,
    storageKey: obj.key,
    contentHash: contentHash(input.content),
    byteSize: obj.byteSize,
    mimeType: mime,
    uploadedBy: input.userId,
    uploadedAt: now,
    changeNote: input.changeNote ?? "Initial upload",
    immutable: true,
  });

  const document = kstore.upsertDocument({
    id: docId,
    organizationId: input.organizationId,
    folderId: input.folderId ?? null,
    typeKey: type.key,
    domain: type.domain,
    title: input.title.trim() || "Untitled",
    mimeType: mime,
    status: "active",
    currentVersionId: version.id,
    tags: Object.freeze([...(input.tags ?? [])]),
    metadata: Object.freeze({ ...(input.metadata ?? {}) }),
    checkedOutBy: null,
    checkedOutAt: null,
    legalHold: false,
    retentionPolicyId: null,
    createdAt: now,
    createdBy: input.userId,
    updatedAt: now,
  });

  publishKnowledgeEvent({
    type: "knowledge.document_uploaded",
    organizationId: input.organizationId,
    recordType: "document",
    recordId: document.id,
    actorUserId: input.userId,
    payload: { typeKey: document.typeKey, versionId: version.id },
  });
  publishKnowledgeEvent({
    type: "knowledge.version_created",
    organizationId: input.organizationId,
    recordType: "document_version",
    recordId: version.id,
    actorUserId: input.userId,
    payload: { documentId: document.id, versionNumber: 1 },
  });

  linkDocumentNode({
    organizationId: input.organizationId,
    document,
  });
  appendTimeline({
    organizationId: input.organizationId,
    kind: "document_uploaded",
    title: `Uploaded ${document.title}`,
    documentId: document.id,
    occurredAt: now,
  });

  return { document, version };
}

export function createVersion(input: {
  organizationId: string;
  userId: string;
  documentId: string;
  content: string;
  mimeType?: string;
  changeNote?: string | null;
}): DocumentVersion {
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  if (doc.status === "immutable_archive" || doc.legalHold) {
    throw new Error("document is locked (immutable archive or legal hold)");
  }
  if (doc.checkedOutBy && doc.checkedOutBy !== input.userId) {
    throw new Error("document checked out by another user");
  }
  const prior = kstore.listVersions(doc.id);
  const mime = input.mimeType ?? doc.mimeType;
  const obj = putObject({
    organizationId: input.organizationId,
    content: input.content,
    mimeType: mime,
  });
  const version = kstore.upsertVersion({
    id: newId("kver"),
    organizationId: input.organizationId,
    documentId: doc.id,
    versionNumber: prior.length + 1,
    storageKey: obj.key,
    contentHash: contentHash(input.content),
    byteSize: obj.byteSize,
    mimeType: mime,
    uploadedBy: input.userId,
    uploadedAt: nowIso(),
    changeNote: input.changeNote ?? null,
    immutable: true,
  });
  kstore.upsertDocument({
    ...doc,
    currentVersionId: version.id,
    mimeType: mime,
    updatedAt: nowIso(),
    status: doc.status === "checked_out" ? "active" : doc.status,
    checkedOutBy: null,
    checkedOutAt: null,
  });
  publishKnowledgeEvent({
    type: "knowledge.version_created",
    organizationId: input.organizationId,
    recordType: "document_version",
    recordId: version.id,
    actorUserId: input.userId,
    payload: {
      documentId: doc.id,
      versionNumber: version.versionNumber,
    },
  });
  appendTimeline({
    organizationId: input.organizationId,
    kind: "document_versioned",
    title: `Version ${version.versionNumber} of ${doc.title}`,
    documentId: doc.id,
    occurredAt: version.uploadedAt,
  });
  return version;
}

export function checkOutDocument(input: {
  organizationId: string;
  userId: string;
  documentId: string;
}): DocumentRecord {
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  if (doc.checkedOutBy) throw new Error("already checked out");
  return kstore.upsertDocument({
    ...doc,
    status: "checked_out",
    checkedOutBy: input.userId,
    checkedOutAt: nowIso(),
    updatedAt: nowIso(),
  });
}

export function checkInDocument(input: {
  organizationId: string;
  userId: string;
  documentId: string;
  content?: string;
  changeNote?: string | null;
}): DocumentRecord {
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  if (doc.checkedOutBy && doc.checkedOutBy !== input.userId) {
    throw new Error("checked out by another user");
  }
  if (input.content != null) {
    createVersion({
      organizationId: input.organizationId,
      userId: input.userId,
      documentId: doc.id,
      content: input.content,
      changeNote: input.changeNote ?? "Check-in",
    });
  }
  const latest = kstore.getDocument(doc.id)!;
  return kstore.upsertDocument({
    ...latest,
    status: "active",
    checkedOutBy: null,
    checkedOutAt: null,
    updatedAt: nowIso(),
  });
}

export function archiveDocument(input: {
  organizationId: string;
  documentId: string;
  immutable?: boolean;
}): DocumentRecord {
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  return kstore.upsertDocument({
    ...doc,
    status: input.immutable ? "immutable_archive" : "archived",
    updatedAt: nowIso(),
  });
}

export function restoreDocument(input: {
  organizationId: string;
  documentId: string;
}): DocumentRecord {
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  if (doc.status === "immutable_archive") {
    throw new Error("immutable archive cannot be restored");
  }
  return kstore.upsertDocument({
    ...doc,
    status: "active",
    updatedAt: nowIso(),
  });
}

export function softDeleteDocument(input: {
  organizationId: string;
  documentId: string;
}): DocumentRecord {
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  if (doc.legalHold) throw new Error("legal hold prevents delete");
  return kstore.upsertDocument({
    ...doc,
    status: "soft_deleted",
    updatedAt: nowIso(),
  });
}

export function setLegalHold(input: {
  organizationId: string;
  documentId: string;
  hold: boolean;
}): DocumentRecord {
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  return kstore.upsertDocument({
    ...doc,
    legalHold: input.hold,
    status: input.hold ? "legal_hold" : doc.status === "legal_hold" ? "active" : doc.status,
    updatedAt: nowIso(),
  });
}

export function tagDocument(input: {
  organizationId: string;
  documentId: string;
  tags: readonly string[];
}): DocumentRecord {
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  return kstore.upsertDocument({
    ...doc,
    tags: Object.freeze([...new Set([...doc.tags, ...input.tags])]),
    updatedAt: nowIso(),
  });
}

export function getDocumentContent(versionId: string): string | null {
  const ver = kstore.getVersion(versionId);
  if (!ver) return null;
  return kstore.getStorage(ver.storageKey)?.content ?? null;
}

export function listDocuments(organizationId: string) {
  return kstore.listDocuments(organizationId);
}

export function getDocument(id: string) {
  return kstore.getDocument(id);
}

export function listVersions(documentId: string) {
  return kstore.listVersions(documentId);
}
