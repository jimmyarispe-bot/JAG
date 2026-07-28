import {
  createChiefFinancialOfficerEngine,
  type ValuationApproach,
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
    { valuations: engine.valuationHistory(gate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    periodKey?: string;
    approach?: ValuationApproach;
    multiple?: number;
  };
  const gate = await requireCfoOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.periodKey || !body.approach) {
    return jsonError(JagErrors.validation("periodKey and approach required"));
  }
  const engine = createChiefFinancialOfficerEngine();
  const report = engine.computeValuation({
    organizationId: gate.organizationId,
    userId: gate.session.userId,
    periodKey: body.periodKey,
    approach: body.approach,
    multiple: body.multiple,
  });
  return jsonOk(
    { report },
    { correlationId: gate.correlationId, status: 201 }
  );
}
