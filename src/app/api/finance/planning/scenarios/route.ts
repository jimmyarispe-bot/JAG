import {
  createFinancialPlanningEngine,
  type ScenarioKind,
} from "@finance";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireFinanceOrg,
  requireFinanceOrgBody,
} from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireFinanceOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createFinancialPlanningEngine();
  return jsonOk(
    {
      scenarios: engine.listScenarios(gate.organizationId),
      model: engine.modelSnapshot(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "create" | "compare";
    name?: string;
    kind?: ScenarioKind;
    assumptionIds?: string[];
    scenarioIds?: string[];
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const engine = createFinancialPlanningEngine();

  if (body.action === "compare") {
    if (!body.scenarioIds?.length) {
      return jsonError(JagErrors.validation("scenarioIds required"));
    }
    const comparison = engine.compareScenarios({
      organizationId: gate.organizationId,
      scenarioIds: body.scenarioIds,
    });
    return jsonOk({ comparison }, { correlationId: gate.correlationId });
  }

  const scenario = engine.createScenario({
    organizationId: gate.organizationId,
    userId: gate.session.userId,
    name: body.name ?? "Scenario",
    kind: body.kind ?? "expected",
    assumptionIds: body.assumptionIds,
  });
  return jsonOk(
    { scenario },
    { correlationId: gate.correlationId, status: 201 }
  );
}
