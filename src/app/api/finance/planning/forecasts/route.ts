import {
  createFinancialPlanningEngine,
  type ForecastMethod,
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
    { forecasts: engine.listForecasts(gate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    name?: string;
    method?: ForecastMethod;
    periodKey?: string;
    lines?: { label: string; amount: number; accountId?: string | null }[];
    scenarioId?: string | null;
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.periodKey) {
    return jsonError(JagErrors.validation("periodKey required"));
  }
  const engine = createFinancialPlanningEngine();
  const forecast = engine.createForecast({
    organizationId: gate.organizationId,
    userId: gate.session.userId,
    name: body.name ?? "Forecast",
    method: body.method ?? "rolling",
    periodKey: body.periodKey,
    lines: body.lines ?? [],
    scenarioId: body.scenarioId,
  });
  return jsonOk(
    { forecast },
    { correlationId: gate.correlationId, status: 201 }
  );
}
