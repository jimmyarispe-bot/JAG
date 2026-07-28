import { createChiefFinancialOfficerEngine, type EbitdaAdjustment } from "@cfo";
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
    {
      reports: engine.listEbitda(gate.organizationId),
      adjustments: engine.listAdjustments(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "compute" | "adjust";
    periodKey?: string;
    kind?: EbitdaAdjustment["kind"];
    label?: string;
    amount?: number;
    rationale?: string;
  };
  const gate = await requireCfoOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.periodKey) {
    return jsonError(JagErrors.validation("periodKey required"));
  }
  const engine = createChiefFinancialOfficerEngine();
  const userId = gate.session.userId;

  if (body.action === "adjust") {
    if (!body.kind || body.amount == null || !body.label) {
      return jsonError(
        JagErrors.validation("kind, label, and amount required for adjust")
      );
    }
    const adjustment = engine.recordEbitdaAdjustment({
      organizationId: gate.organizationId,
      userId,
      kind: body.kind,
      label: body.label,
      amount: body.amount,
      periodKey: body.periodKey,
      rationale: body.rationale ?? body.label,
    });
    return jsonOk(
      { adjustment },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const report = engine.computeEbitda({
    organizationId: gate.organizationId,
    userId,
    periodKey: body.periodKey,
  });
  return jsonOk(
    { report },
    { correlationId: gate.correlationId, status: 201 }
  );
}
