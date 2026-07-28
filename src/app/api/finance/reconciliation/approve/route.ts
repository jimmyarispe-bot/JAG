import {
  createFinanceEngine,
  createReconciliationEngine,
  type ApproverStage,
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
  const { searchParams } = new URL(request.url);
  const periodId = searchParams.get("periodId") ?? undefined;
  const engine = createReconciliationEngine();
  return jsonOk(
    {
      approvals: engine.listApprovals(gate.organizationId, periodId),
      stages: engine.approvalStages,
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "approve" | "finalize";
    periodId?: string;
    stage?: ApproverStage;
    note?: string;
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const userId = gate.session.userId;
  createFinanceEngine().grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze([
      "reconcile",
      "approve",
      "controller",
      "cfo",
      "financial_administrator",
    ]),
    actorUserId: userId,
  });
  const engine = createReconciliationEngine();

  if (body.action === "finalize") {
    const period = engine.finalize({
      organizationId: gate.organizationId,
      userId,
      periodId: body.periodId ?? "",
    });
    if ("error" in period) {
      return jsonError(JagErrors.validation(period.error));
    }
    return jsonOk({ period }, { correlationId: gate.correlationId });
  }

  const result = engine.approve({
    organizationId: gate.organizationId,
    userId,
    periodId: body.periodId ?? "",
    stage: body.stage ?? "reconciler",
    note: body.note,
  });
  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }
  return jsonOk(result, { correlationId: gate.correlationId });
}
