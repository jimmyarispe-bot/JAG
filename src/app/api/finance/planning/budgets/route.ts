import {
  createFinanceEngine,
  createFinancialPlanningEngine,
  type BudgetKind,
  type BudgetHorizon,
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
    { budgets: engine.listBudgets(gate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "create" | "version";
    budgetId?: string;
    name?: string;
    horizon?: BudgetHorizon;
    kind?: BudgetKind;
    scope?: string;
    scopeId?: string;
    periodKey?: string;
    lines?: { accountId: string; amount: number }[];
    scenarioKey?: string | null;
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const userId = gate.session.userId;
  createFinanceEngine().grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["create", "controller"]),
    actorUserId: userId,
  });
  const engine = createFinancialPlanningEngine();

  if (body.action === "version") {
    if (!body.budgetId) {
      return jsonError(JagErrors.validation("budgetId required to version"));
    }
    const next = engine.versionBudget({
      organizationId: gate.organizationId,
      userId,
      budgetId: body.budgetId,
      lines: body.lines,
      name: body.name,
    });
    if ("error" in next) return jsonError(JagErrors.validation(next.error));
    return jsonOk({ budget: next }, { correlationId: gate.correlationId, status: 201 });
  }

  const budget = engine.createBudget({
    organizationId: gate.organizationId,
    userId,
    name: body.name ?? "Budget",
    horizon: body.horizon ?? "annual",
    kind: body.kind ?? "operating",
    scope: body.scope,
    scopeId: body.scopeId,
    periodKey: body.periodKey ?? new Date().getUTCFullYear().toString(),
    lines: body.lines ?? [],
    scenarioKey: body.scenarioKey,
  });
  if ("error" in budget) return jsonError(JagErrors.validation(budget.error));
  return jsonOk(
    { budget },
    { correlationId: gate.correlationId, status: 201 }
  );
}
