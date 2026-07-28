import {
  createFinanceEngine,
  createReconciliationEngine,
  type ReconciliationAccountKind,
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
  const engine = createReconciliationEngine();
  return jsonOk(
    {
      periods: engine.listPeriods(gate.organizationId),
      analytics: engine.analytics(gate.organizationId),
      guards: engine.guards,
      digitalTwin: engine.digitalTwin,
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    bankAccountId?: string;
    periodKey?: string;
    statementBalance?: number;
    bookBalance?: number;
    cadence?: "monthly" | "quarterly" | "annual";
    scope?: "entity" | "department" | "program" | "project" | "organization";
    scopeId?: string;
    statementImportId?: string;
    accountKind?: ReconciliationAccountKind;
    runAutoMatch?: boolean;
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const userId = gate.session.userId;
  createFinanceEngine().grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["reconcile", "controller", "cfo"]),
    actorUserId: userId,
  });
  const engine = createReconciliationEngine();
  const result = engine.bootstrapPeriod({
    organizationId: gate.organizationId,
    userId,
    bankAccountId: body.bankAccountId ?? "",
    periodKey: body.periodKey ?? new Date().toISOString().slice(0, 7),
    statementBalance: body.statementBalance ?? 0,
    bookBalance: body.bookBalance,
    runAutoMatch: body.runAutoMatch,
  });
  if ("error" in result && !("period" in result)) {
    return jsonError(JagErrors.validation(result.error));
  }
  return jsonOk(result, { correlationId: gate.correlationId, status: 201 });
}
