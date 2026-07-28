import { createKnowledgeEngine, type ExtractionMethod } from "@knowledge";
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
  const url = new URL(request.url);
  const documentId = url.searchParams.get("documentId") ?? undefined;
  const engine = createKnowledgeEngine();
  return jsonOk(
    {
      facts: engine.listEvidenceFacts(gate.organizationId, documentId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    documentId?: string;
    versionId?: string;
    location?: string;
    statement?: string;
    confidence?: number;
    method?: ExtractionMethod;
  };
  const gate = await requireKnowledgeOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.documentId || !body.statement || !body.location) {
    return jsonError(
      JagErrors.validation("documentId, statement, and location required")
    );
  }
  const engine = createKnowledgeEngine();
  const doc = engine.getDocument(body.documentId);
  if (!doc) return jsonError(JagErrors.validation("document not found"));
  const fact = engine.recordEvidenceFact({
    organizationId: gate.organizationId,
    userId: gate.session.userId,
    documentId: body.documentId,
    versionId: body.versionId ?? doc.currentVersionId,
    location: body.location,
    statement: body.statement,
    confidence: body.confidence ?? 0.9,
    method: body.method ?? "manual",
  });
  return jsonOk(
    { fact },
    { correlationId: gate.correlationId, status: 201 }
  );
}
