import { createFinanceEngine } from "@finance";
import type { Budget } from "@finance";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireFinanceOrg,
  requireFinanceOrgBody,
} from "../_lib";

export async function GET(request: Request) {
  const gate = await requireFinanceOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createFinanceEngine();
  return jsonOk(
    { budgets: engine.listBudgets(gate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    name?: string;
    horizon?: Budget["horizon"];
    scope?: Budget["scope"];
    scopeId?: string;
    periodKey?: string;
    lines?: { accountId: string; amount: number }[];
    scenarioKey?: string | null;
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const engine = createFinanceEngine();
  const userId = gate.session.userId;
  engine.grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["create", "controller"]),
    actorUserId: userId,
  });
  const budget = engine.createBudget({
    organizationId: gate.organizationId,
    userId,
    name: body.name ?? "Budget",
    horizon: body.horizon ?? "annual",
    scope: body.scope ?? "organization",
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
