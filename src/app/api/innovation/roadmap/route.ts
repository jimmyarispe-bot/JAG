import { createInnovationEngine } from "@innovation";
import { installMrJag } from "@mr-jag";
import { jsonOk, requireInnovationOrg, requireInnovationOrgBody } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireInnovationOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createInnovationEngine();
  if (engine.listOpportunities().length === 0) {
    engine.scan({
      organizationId: gate.organizationId,
      userId: gate.session.userId,
    });
  }
  return jsonOk(
    {
      roadmap: engine.roadmap(),
      horizons: engine.roadmapHorizons,
      dashboard: engine.dashboard(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
  };
  const gate = await requireInnovationOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createInnovationEngine();
  engine.scan({
    organizationId: gate.organizationId,
    userId: gate.session.userId,
  });
  return jsonOk(
    { roadmap: engine.roadmap() },
    { correlationId: gate.correlationId, status: 201 }
  );
}
