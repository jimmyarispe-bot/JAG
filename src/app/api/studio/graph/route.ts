import {
  createArchitectureDashboardService,
  createGraphService,
} from "@studio";
import { jsonOk, requireStudioOrg } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const service = createGraphService();

  if (searchParams.get("dashboard") === "1") {
    return jsonOk(
      { dashboard: createArchitectureDashboardService().build() },
      { correlationId: gate.correlationId }
    );
  }

  const nodeId = searchParams.get("nodeId");
  if (nodeId && searchParams.get("dependents") === "1") {
    return jsonOk(
      { nodeId, dependents: service.dependents(nodeId) },
      { correlationId: gate.correlationId }
    );
  }
  if (nodeId && searchParams.get("dependencies") === "1") {
    return jsonOk(
      { nodeId, dependencies: service.dependencies(nodeId) },
      { correlationId: gate.correlationId }
    );
  }

  if (searchParams.get("summary") === "1") {
    return jsonOk(
      { summary: service.summarize() },
      { correlationId: gate.correlationId }
    );
  }

  const graph = service.build({ force: searchParams.get("force") === "1" });
  const kind = searchParams.get("kind");
  const q = searchParams.get("q")?.trim().toLowerCase();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    200,
    Math.max(1, Number(searchParams.get("pageSize") ?? 100))
  );

  let nodes = [...graph.nodes];
  if (kind) nodes = nodes.filter((n) => n.kind === kind);
  if (q) {
    nodes = nodes.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.id.toLowerCase().includes(q) ||
        (n.path?.toLowerCase().includes(q) ?? false)
    );
  }
  const total = nodes.length;
  const start = (page - 1) * pageSize;
  const pageNodes = nodes.slice(start, start + pageSize);
  const nodeIds = new Set(pageNodes.map((n) => n.id));
  const edges = graph.edges.filter(
    (e) => nodeIds.has(e.from) || nodeIds.has(e.to)
  );

  return jsonOk(
    {
      graph: {
        ...graph,
        nodes: pageNodes,
        edges,
      },
      pagination: { page, pageSize, total },
    },
    { correlationId: gate.correlationId }
  );
}
