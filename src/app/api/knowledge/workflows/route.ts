import { createKnowledgeEngine, type WorkflowKind } from "@knowledge";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireKnowledgeOrg,
  requireKnowledgeOrgBody,
} from "../_lib";

export async function GET(request: Request) {
  const gate = await requireKnowledgeOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createKnowledgeEngine();
  return jsonOk(
    { workflows: engine.listWorkflows(gate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "start" | "complete";
    documentId?: string;
    workflowId?: string;
    kind?: WorkflowKind;
    assigneeId?: string | null;
    dueAt?: string | null;
    status?: "completed" | "rejected" | "expired";
  };
  const gate = await requireKnowledgeOrgBody(body);
  if (!gate.ok) return gate.response;
  const engine = createKnowledgeEngine();
  const userId = gate.session.userId;

  try {
    if (body.action === "complete") {
      if (!body.workflowId) {
        return jsonError(JagErrors.validation("workflowId required"));
      }
      const workflow = engine.completeWorkflow({
        organizationId: gate.organizationId,
        userId,
        workflowId: body.workflowId,
        status: body.status,
      });
      return jsonOk({ workflow }, { correlationId: gate.correlationId });
    }

    if (!body.documentId || !body.kind) {
      return jsonError(JagErrors.validation("documentId and kind required"));
    }
    const workflow = engine.startWorkflow({
      organizationId: gate.organizationId,
      userId,
      documentId: body.documentId,
      kind: body.kind,
      assigneeId: body.assigneeId,
      dueAt: body.dueAt,
    });
    return jsonOk(
      { workflow },
      { correlationId: gate.correlationId, status: 201 }
    );
  } catch (e) {
    return jsonError(
      JagErrors.validation(e instanceof Error ? e.message : "workflow failed")
    );
  }
}
