import {
  createKnowledgeQueryEngine,
  type KnowledgeNodeKind,
} from "@studio";
import { JagErrors, jsonError, jsonOk, requireStudioOrg } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return jsonError(JagErrors.validation("q is required."));
  const kindsParam = searchParams.get("kinds");
  const kinds = kindsParam
    ? (kindsParam.split(",").map((k) => k.trim()) as KnowledgeNodeKind[])
    : undefined;
  const hits = createKnowledgeQueryEngine().searchGraph({
    q,
    kinds,
    limit: Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 40))),
  });
  return jsonOk({ hits }, { correlationId: gate.correlationId });
}
