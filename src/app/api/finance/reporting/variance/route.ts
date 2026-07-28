import { createFinancialReportingEngine } from "@finance";
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
  const engine = createFinancialReportingEngine();
  return jsonOk(
    { variances: engine.listVariances(gate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    mode?:
      | "budget_vs_actual"
      | "forecast_vs_actual"
      | "prior_year"
      | "prior_period";
    periodKey?: string;
    comparePeriodKey?: string | null;
    budgetId?: string | null;
    forecastLines?: { label: string; amount: number }[];
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.mode || !body.periodKey) {
    return jsonError(JagErrors.validation("mode and periodKey required"));
  }
  const engine = createFinancialReportingEngine();
  try {
    const variance = engine.computeVariance({
      organizationId: gate.organizationId,
      userId: gate.session.userId,
      mode: body.mode,
      periodKey: body.periodKey,
      comparePeriodKey: body.comparePeriodKey,
      budgetId: body.budgetId,
      forecastLines: body.forecastLines,
    });
    return jsonOk(
      { variance },
      { correlationId: gate.correlationId, status: 201 }
    );
  } catch (e) {
    return jsonError(
      JagErrors.validation(e instanceof Error ? e.message : "variance failed")
    );
  }
}
