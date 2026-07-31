import { createInnovationEngine, type HostInnovationSignals } from "@innovation";
import { installMrJag } from "@mr-jag";
import {
  jsonOk,
  requireInnovationOrg,
  requireInnovationOrgBody,
} from "../_lib";

export async function GET(request: Request) {
  const gate = await requireInnovationOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const { searchParams } = new URL(request.url);
  const engine = createInnovationEngine();
  const opportunityId = searchParams.get("opportunityId");
  if (opportunityId) {
    return jsonOk(
      { opportunity: engine.getOpportunity(opportunityId) },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    {
      opportunities: engine.listOpportunities({
        category: searchParams.get("category") ?? undefined,
        horizon: searchParams.get("horizon") ?? undefined,
        limit: Number(searchParams.get("limit") ?? 50) || 50,
      }),
      dashboard: engine.dashboard(gate.organizationId),
      mrJagHighlights: engine.dashboard(gate.organizationId).mrJagHighlights,
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    host?: HostInnovationSignals;
    limit?: number;
  };
  const gate = await requireInnovationOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createInnovationEngine();
  const result = engine.scan({
    organizationId: gate.organizationId,
    userId: gate.session.userId,
    host: body.host,
    limit: body.limit,
  });
  return jsonOk(
    {
      ...result,
      implementsChanges: false,
    },
    { correlationId: gate.correlationId, status: 201 }
  );
}
