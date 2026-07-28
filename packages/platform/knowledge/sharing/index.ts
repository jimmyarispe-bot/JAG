import { publishKnowledgeEvent } from "../events";
import { newId, nowIso } from "../ids";
import { grantPermission } from "../permissions";
import { kstore } from "../store";
import type { ShareGrant } from "../types";

export function shareDocument(input: {
  organizationId: string;
  userId: string;
  documentId: string;
  principalId: string;
  actions?: ShareGrant["actions"];
  expiresAt?: string | null;
}): ShareGrant {
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  const actions = input.actions ?? Object.freeze(["read" as const]);
  const share = kstore.upsertShare({
    id: newId("kshare"),
    organizationId: input.organizationId,
    documentId: doc.id,
    principalId: input.principalId,
    actions: Object.freeze([...actions]),
    expiresAt: input.expiresAt ?? null,
    createdAt: nowIso(),
  });
  grantPermission({
    organizationId: input.organizationId,
    scope: "document",
    scopeId: doc.id,
    principalId: input.principalId,
    actions: actions.includes("write")
      ? Object.freeze(["read", "write", "share"] as const)
      : Object.freeze(["read", "share"] as const),
    expiresAt: input.expiresAt,
    actorUserId: input.userId,
  });
  publishKnowledgeEvent({
    type: "knowledge.shared",
    organizationId: input.organizationId,
    recordType: "share",
    recordId: share.id,
    actorUserId: input.userId,
    payload: { documentId: doc.id, principalId: input.principalId },
  });
  return share;
}

export function listShares(organizationId: string) {
  return kstore.listShares(organizationId);
}
