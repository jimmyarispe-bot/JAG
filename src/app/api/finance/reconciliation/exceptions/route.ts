import {
  createFinanceEngine,
  createReconciliationEngine,
  type AdjustmentKind,
} from "@finance";
import type { ReconciliationException } from "@finance";
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
      exceptions: engine.listExceptions(gate.organizationId, periodId),
      adjustments: engine.listAdjustments(gate.organizationId, periodId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "create" | "resolve" | "adjust";
    periodId?: string;
    exceptionId?: string;
    kind?: ReconciliationException["kind"];
    severity?: ReconciliationException["severity"];
    message?: string;
    relatedIds?: string[];
    adjustmentKind?: AdjustmentKind;
    amount?: number;
    memo?: string;
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const userId = gate.session.userId;
  createFinanceEngine().grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["reconcile", "create", "controller"]),
    actorUserId: userId,
  });
  const engine = createReconciliationEngine();

  if (body.action === "resolve") {
    const ex = engine.resolveException({
      organizationId: gate.organizationId,
      userId,
      exceptionId: body.exceptionId ?? "",
    });
    if ("error" in ex) return jsonError(JagErrors.validation(ex.error));
    return jsonOk({ exception: ex }, { correlationId: gate.correlationId });
  }
  if (body.action === "adjust") {
    const adj = engine.postAdjustment({
      organizationId: gate.organizationId,
      userId,
      periodId: body.periodId ?? "",
      kind: body.adjustmentKind ?? "miscellaneous",
      amount: body.amount ?? 0,
      memo: body.memo ?? "Adjustment",
    });
    if ("error" in adj) return jsonError(JagErrors.validation(adj.error));
    return jsonOk(
      { adjustment: adj },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const ex = engine.createException({
    organizationId: gate.organizationId,
    userId,
    periodId: body.periodId ?? "",
    kind: body.kind ?? "policy_violation",
    severity: body.severity ?? "medium",
    message: body.message ?? "Exception",
    relatedIds: body.relatedIds,
  });
  return jsonOk(
    { exception: ex },
    { correlationId: gate.correlationId, status: 201 }
  );
}
