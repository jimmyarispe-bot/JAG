import { createFinanceEngine, createReconciliationEngine } from "@finance";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireFinanceOrgBody,
} from "../../_lib";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "close" | "reopen";
    periodId?: string;
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const userId = gate.session.userId;
  createFinanceEngine().grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze([
      "close_period",
      "financial_administrator",
      "cfo",
      "controller",
    ]),
    actorUserId: userId,
  });
  const engine = createReconciliationEngine();

  if (body.action === "reopen") {
    const period = engine.reopen({
      organizationId: gate.organizationId,
      userId,
      periodId: body.periodId ?? "",
    });
    if ("error" in period) {
      return jsonError(JagErrors.validation(period.error));
    }
    return jsonOk({ period }, { correlationId: gate.correlationId });
  }

  const period = engine.close({
    organizationId: gate.organizationId,
    userId,
    periodId: body.periodId ?? "",
  });
  if ("error" in period) {
    return jsonError(JagErrors.validation(period.error));
  }
  return jsonOk({ period }, { correlationId: gate.correlationId });
}
