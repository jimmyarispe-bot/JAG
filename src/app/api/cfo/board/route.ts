import { createChiefFinancialOfficerEngine } from "@cfo";
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
    { reports: engine.listBoards(gate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    periodKey?: string;
  };
  const gate = await requireCfoOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.periodKey) {
    return jsonError(JagErrors.validation("periodKey required"));
  }
  const engine = createChiefFinancialOfficerEngine();
  const report = engine.buildBoardReport({
    organizationId: gate.organizationId,
    userId: gate.session.userId,
    periodKey: body.periodKey,
  });
  return jsonOk(
    { report },
    { correlationId: gate.correlationId, status: 201 }
  );
}
