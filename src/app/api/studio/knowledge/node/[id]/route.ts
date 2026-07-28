import { createKnowledgeQueryEngine } from "@studio";
import { JagErrors, jsonError, jsonOk, requireStudioOrg } from "../../../_lib";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { id: raw } = await context.params;
  const id = decodeURIComponent(raw);
  const engine = createKnowledgeQueryEngine();
  const node = engine.findNode(id);
  if (!node) return jsonError(JagErrors.notFound(`Knowledge node ${id}`));
  const { searchParams } = new URL(request.url);
  const direction =
    (searchParams.get("direction") as "in" | "out" | "both") || "both";
  return jsonOk(
    {
      node,
      neighbors: engine.findNeighbors(id, undefined, direction),
      dependents: engine.findDependents(id),
      dependencies: engine.findDependencies(id),
      documentation: engine.findDocumentation(id),
      tests: engine.findTests(id),
      pers: engine.findPERs(id),
    },
    { correlationId: gate.correlationId }
  );
}
