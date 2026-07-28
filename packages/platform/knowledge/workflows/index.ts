import { publishKnowledgeEvent } from "../events";
import { newId, nowIso } from "../ids";
import { kstore } from "../store";
import type { KnowledgeWorkflow, WorkflowKind } from "../types";

export function startWorkflow(input: {
  organizationId: string;
  userId: string;
  documentId: string;
  kind: WorkflowKind;
  assigneeId?: string | null;
  dueAt?: string | null;
}): KnowledgeWorkflow {
  const doc = kstore.getDocument(input.documentId);
  if (!doc || doc.organizationId !== input.organizationId) {
    throw new Error("document not found");
  }
  const wf = kstore.upsertWorkflow({
    id: newId("kwf"),
    organizationId: input.organizationId,
    documentId: doc.id,
    kind: input.kind,
    status: "pending",
    assigneeId: input.assigneeId ?? null,
    dueAt: input.dueAt ?? null,
    completedAt: null,
    createdAt: nowIso(),
    createdBy: input.userId,
  });
  publishKnowledgeEvent({
    type: "knowledge.workflow_updated",
    organizationId: input.organizationId,
    recordType: "workflow",
    recordId: wf.id,
    actorUserId: input.userId,
    payload: { kind: wf.kind, status: wf.status, documentId: doc.id },
  });
  return wf;
}

export function completeWorkflow(input: {
  organizationId: string;
  userId: string;
  workflowId: string;
  status?: "completed" | "rejected" | "expired";
}): KnowledgeWorkflow {
  const wf = kstore
    .listWorkflows(input.organizationId)
    .find((w) => w.id === input.workflowId);
  if (!wf) throw new Error("workflow not found");
  const next = kstore.upsertWorkflow({
    ...wf,
    status: input.status ?? "completed",
    completedAt: nowIso(),
  });
  publishKnowledgeEvent({
    type: "knowledge.workflow_updated",
    organizationId: input.organizationId,
    recordType: "workflow",
    recordId: next.id,
    actorUserId: input.userId,
    payload: { kind: next.kind, status: next.status },
  });
  return next;
}

export function listWorkflows(organizationId: string) {
  return kstore.listWorkflows(organizationId);
}
