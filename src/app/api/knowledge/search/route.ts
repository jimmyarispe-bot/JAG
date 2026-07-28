import { createKnowledgeEngine } from "@knowledge";
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
  const query = url.searchParams.get("q") ?? "";
  const mode = (url.searchParams.get("mode") ?? "hybrid") as
    | "keyword"
    | "semantic"
    | "hybrid";
  const engine = createKnowledgeEngine();
  return jsonOk(
    {
      hits: engine.search({
        organizationId: gate.organizationId,
        query,
        mode,
      }),
      saved: engine.listSavedSearches(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "search" | "save" | "index";
    query?: string;
    mode?: "keyword" | "semantic" | "hybrid";
    filters?: Record<string, string>;
    name?: string;
    documentId?: string;
  };
  const gate = await requireKnowledgeOrgBody(body);
  if (!gate.ok) return gate.response;
  const engine = createKnowledgeEngine();

  if (body.action === "save") {
    if (!body.name || body.query == null) {
      return jsonError(JagErrors.validation("name and query required"));
    }
    const saved = engine.saveSearch({
      organizationId: gate.organizationId,
      userId: gate.session.userId,
      name: body.name,
      query: body.query,
      filters: body.filters,
    });
    return jsonOk(
      { saved },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (body.action === "index") {
    if (!body.documentId) {
      return jsonError(JagErrors.validation("documentId required"));
    }
    const entry = engine.indexDocument({
      organizationId: gate.organizationId,
      userId: gate.session.userId,
      documentId: body.documentId,
    });
    return jsonOk(
      { entry },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const hits = engine.search({
    organizationId: gate.organizationId,
    query: body.query ?? "",
    mode: body.mode ?? "hybrid",
    filters: body.filters,
  });
  return jsonOk({ hits }, { correlationId: gate.correlationId });
}
