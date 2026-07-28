import {
  createChiefFinancialOfficerEngine,
  type CfoScenarioKind,
} from "@cfo";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireCfoOrg,
  requireCfoOrgBody,
} from "../_lib";

export async function GET(request: Request) {
  const gate = await requireCfoOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createChiefFinancialOfficerEngine();
  return jsonOk(
    { scenarios: engine.listScenarios(gate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    kind?: CfoScenarioKind;
    name?: string;
    periodKey?: string;
    assumptions?: Record<string, number | string | boolean>;
  };
  const gate = await requireCfoOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.kind || !body.periodKey) {
    return jsonError(JagErrors.validation("kind and periodKey required"));
  }
  const engine = createChiefFinancialOfficerEngine();
  const scenario = engine.analyzeScenario({
    organizationId: gate.organizationId,
    userId: gate.session.userId,
    kind: body.kind,
    name: body.name ?? body.kind,
    periodKey: body.periodKey,
    assumptions: body.assumptions ?? {},
  });
  return jsonOk(
    { scenario },
    { correlationId: gate.correlationId, status: 201 }
  );
}
