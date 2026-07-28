import { createKnowledgeEngine, type GraphNodeKind } from "@knowledge";
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
    { graph: engine.queryGraph(gate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "node" | "relate";
    kind?: GraphNodeKind;
    label?: string;
    externalRef?: string | null;
    fromNodeId?: string;
    toNodeId?: string;
    relationship?: string;
    evidenceFactIds?: string[];
  };
  const gate = await requireKnowledgeOrgBody(body);
  if (!gate.ok) return gate.response;
  const engine = createKnowledgeEngine();

  if (body.action === "relate") {
    if (!body.fromNodeId || !body.toNodeId || !body.relationship) {
      return jsonError(
        JagErrors.validation("fromNodeId, toNodeId, relationship required")
      );
    }
    const edge = engine.relate({
      organizationId: gate.organizationId,
      fromNodeId: body.fromNodeId,
      toNodeId: body.toNodeId,
      relationship: body.relationship,
      evidenceFactIds: body.evidenceFactIds,
      actorUserId: gate.session.userId,
    });
    return jsonOk(
      { edge },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (!body.kind || !body.label) {
    return jsonError(JagErrors.validation("kind and label required"));
  }
  const node = engine.upsertNode({
    organizationId: gate.organizationId,
    kind: body.kind,
    label: body.label,
    externalRef: body.externalRef,
  });
  return jsonOk(
    { node },
    { correlationId: gate.correlationId, status: 201 }
  );
}
