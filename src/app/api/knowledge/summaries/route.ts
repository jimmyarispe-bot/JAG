import { createKnowledgeEngine, type SummaryKind } from "@knowledge";
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
    { summaries: engine.listSummaries(gate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    documentId?: string;
    kind?: SummaryKind;
  };
  const gate = await requireKnowledgeOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.documentId) {
    return jsonError(JagErrors.validation("documentId required"));
  }
  const engine = createKnowledgeEngine();
  try {
    const summary = engine.summarizeDocument({
      organizationId: gate.organizationId,
      userId: gate.session.userId,
      documentId: body.documentId,
      kind: body.kind ?? "executive",
    });
    return jsonOk(
      { summary },
      { correlationId: gate.correlationId, status: 201 }
    );
  } catch (e) {
    return jsonError(
      JagErrors.validation(e instanceof Error ? e.message : "summary failed")
    );
  }
}
