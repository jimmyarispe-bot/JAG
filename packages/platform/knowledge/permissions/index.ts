import { publishKnowledgeEvent } from "../events";
import { newId } from "../ids";
import { kstore } from "../store";
import type { KnowledgePermission } from "../types";

export function grantPermission(input: {
  organizationId: string;
  scope: KnowledgePermission["scope"];
  scopeId?: string | null;
  principalId: string;
  actions: KnowledgePermission["actions"];
  expiresAt?: string | null;
  actorUserId?: string | null;
}): KnowledgePermission {
  const perm = kstore.upsertPermission({
    id: newId("kperm"),
    organizationId: input.organizationId,
    scope: input.scope,
    scopeId: input.scopeId ?? null,
    principalId: input.principalId,
    actions: Object.freeze([...input.actions]),
    expiresAt: input.expiresAt ?? null,
  });
  publishKnowledgeEvent({
    type: "knowledge.permission_granted",
    organizationId: input.organizationId,
    recordType: "permission",
    recordId: perm.id,
    actorUserId: input.actorUserId,
    payload: {
      scope: perm.scope,
      principalId: perm.principalId,
      actions: perm.actions,
    },
  });
  return perm;
}

export function hasPermission(input: {
  organizationId: string;
  principalId: string;
  action: "read" | "write" | "share" | "approve" | "admin";
  documentId?: string;
}): boolean {
  const now = Date.now();
  return kstore.listPermissions(input.organizationId).some((p) => {
    if (p.principalId !== input.principalId) return false;
    if (p.expiresAt && Date.parse(p.expiresAt) < now) return false;
    if (!p.actions.includes(input.action) && !p.actions.includes("admin")) {
      return false;
    }
    if (p.scope === "document" && input.documentId) {
      return p.scopeId === input.documentId;
    }
    return p.scope === "organization" || p.scope === "role" || p.scope === "team" || p.scope === "department";
  });
}

export function listPermissions(organizationId: string) {
  return kstore.listPermissions(organizationId);
}
