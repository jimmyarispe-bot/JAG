import { createFinancialReportingEngine, type ReportScope } from "@finance";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireFinanceOrgBody,
} from "../../_lib";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    periodKey?: string;
    scope?: ReportScope;
    scopeId?: string | null;
    dimensionFilters?: Record<string, string>;
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.periodKey) {
    return jsonError(JagErrors.validation("periodKey required"));
  }
  const engine = createFinancialReportingEngine();
  const statement = engine.trialBalance({
    organizationId: gate.organizationId,
    userId: gate.session.userId,
    periodKey: body.periodKey,
    scope: body.scope,
    scopeId: body.scopeId,
    dimensionFilters: body.dimensionFilters,
  });
  return jsonOk(
    { trialBalance: statement },
    { correlationId: gate.correlationId, status: 201 }
  );
}
