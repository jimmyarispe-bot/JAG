import {
  buildKnowledgeDashboard,
  buildKnowledgeGraph,
} from "@studio";
import { jsonOk, requireStudioOrg } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "1";

  if (searchParams.get("dashboard") === "1" || searchParams.get("health") === "1") {
    return jsonOk(
      { knowledge: buildKnowledgeDashboard() },
      { correlationId: gate.correlationId }
    );
  }

  const graph = buildKnowledgeGraph({ force });
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    200,
    Math.max(1, Number(searchParams.get("pageSize") ?? 50))
  );
  const kind = searchParams.get("kind");
  let nodes = [...graph.nodes];
  if (kind) nodes = nodes.filter((n) => n.kind === kind);
  const total = nodes.length;
  const start = (page - 1) * pageSize;

  return jsonOk(
    {
      graph: {
        root: graph.root,
        builtAt: graph.builtAt,
        version: graph.version,
        catalogVersion: graph.catalogVersion,
        countsByKind: graph.countsByKind,
        edgeCountsByKind: graph.edgeCountsByKind,
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        nodes: nodes.slice(start, start + pageSize),
        edges: graph.edges.slice(0, pageSize),
      },
      pagination: { page, pageSize, total },
    },
    { correlationId: gate.correlationId }
  );
}
