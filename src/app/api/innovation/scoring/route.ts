import { createInnovationEngine } from "@innovation";
import { installMrJag } from "@mr-jag";
import { jsonOk, requireInnovationOrg, requireInnovationOrgBody } from "../_lib";

export async function GET(request: Request) {
  const gate = await requireInnovationOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createInnovationEngine();
  const opportunities = engine.listOpportunities({ limit: 50 });
  return jsonOk(
    {
      scoring: opportunities.map((o) =>
        Object.freeze({
          opportunityId: o.opportunityId,
          executiveSummary: o.executiveSummary,
          scores: o.scores,
          financial: o.financial,
        })
      ),
      analytics: engine.analytics(gate.organizationId),
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
  // Ensure fresh scan then return scoring board
  engine.scan({
    organizationId: gate.organizationId,
    userId: gate.session.userId,
  });
  const opportunities = engine.listOpportunities({ limit: 50 });
  return jsonOk(
    {
      scoring: opportunities.map((o) =>
        Object.freeze({
          opportunityId: o.opportunityId,
          scores: o.scores,
          portfolioCategory: o.portfolioCategory,
          roadmapHorizon: o.roadmapHorizon,
        })
      ),
    },
    { correlationId: gate.correlationId, status: 201 }
  );
}
