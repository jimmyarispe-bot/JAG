import { createKnowledgeQueryEngine } from "@studio";
import { JagErrors, jsonError, jsonOk, requireStudioOrg } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from")?.trim();
  const to = searchParams.get("to")?.trim();
  if (!from || !to) {
    return jsonError(JagErrors.validation("from and to are required."));
  }
  const maxDepth = Math.min(
    12,
    Math.max(1, Number(searchParams.get("maxDepth") ?? 8))
  );
  const path = createKnowledgeQueryEngine().findPath(
    from,
    to,
    undefined,
    maxDepth
  );
  return jsonOk(
    { from, to, path, found: path != null },
    { correlationId: gate.correlationId }
  );
}
