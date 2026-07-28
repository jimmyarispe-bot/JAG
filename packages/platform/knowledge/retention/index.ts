import { publishKnowledgeEvent } from "../events";
import { newId, nowIso } from "../ids";
import { archiveDocument, softDeleteDocument } from "../documents";
import { kstore } from "../store";
import type { RetentionPolicy } from "../types";

export function createRetentionPolicy(input: {
  organizationId: string;
  name: string;
  retainDays: number;
  action: RetentionPolicy["action"];
}): RetentionPolicy {
  return kstore.upsertRetention({
    id: newId("kret"),
    organizationId: input.organizationId,
    name: input.name,
    retainDays: input.retainDays,
    action: input.action,
    active: true,
  });
}

export function applyRetention(input: {
  organizationId: string;
  documentId: string;
  policyId: string;
  userId?: string | null;
}) {
  const policy = kstore
    .listRetention(input.organizationId)
    .find((p) => p.id === input.policyId);
  if (!policy) throw new Error("retention policy not found");
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  kstore.upsertDocument({
    ...doc,
    retentionPolicyId: policy.id,
    updatedAt: nowIso(),
  });
  let result;
  if (policy.action === "soft_delete") {
    result = softDeleteDocument({
      organizationId: input.organizationId,
      documentId: doc.id,
    });
  } else {
    result = archiveDocument({
      organizationId: input.organizationId,
      documentId: doc.id,
      immutable: policy.action === "immutable_archive",
    });
  }
  publishKnowledgeEvent({
    type: "knowledge.retention_applied",
    organizationId: input.organizationId,
    recordType: "document",
    recordId: doc.id,
    actorUserId: input.userId,
    payload: { policyId: policy.id, action: policy.action },
  });
  return result;
}

export function listRetentionPolicies(organizationId: string) {
  return kstore.listRetention(organizationId);
}
