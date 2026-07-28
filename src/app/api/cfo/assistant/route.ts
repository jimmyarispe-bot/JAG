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
    { answers: engine.listAssistantAnswers(gate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    question?: string;
    periodKey?: string;
  };
  const gate = await requireCfoOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.question?.trim()) {
    return jsonError(JagErrors.validation("question required"));
  }
  const engine = createChiefFinancialOfficerEngine();
  const answer = engine.ask({
    organizationId: gate.organizationId,
    userId: gate.session.userId,
    question: body.question,
    periodKey: body.periodKey,
  });
  return jsonOk(
    { answer },
    { correlationId: gate.correlationId, status: 201 }
  );
}
