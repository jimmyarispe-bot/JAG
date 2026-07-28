import {
  createFinancialReportingEngine,
  type ReportScope,
  type StatementKind,
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
  const engine = createFinancialReportingEngine();
  return jsonOk(
    { statements: engine.listStatements(gate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    kind?: StatementKind;
    periodKey?: string;
    comparePeriodKey?: string | null;
    scope?: ReportScope;
    scopeId?: string | null;
    dimensionFilters?: Record<string, string>;
    comparative?: boolean;
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.kind || !body.periodKey) {
    return jsonError(JagErrors.validation("kind and periodKey required"));
  }
  const engine = createFinancialReportingEngine();
  try {
    const statement = engine.generateStatement({
      organizationId: gate.organizationId,
      userId: gate.session.userId,
      kind: body.kind,
      periodKey: body.periodKey,
      comparePeriodKey: body.comparePeriodKey,
      scope: body.scope,
      scopeId: body.scopeId,
      dimensionFilters: body.dimensionFilters,
      comparative: body.comparative,
    });
    return jsonOk(
      { statement },
      { correlationId: gate.correlationId, status: 201 }
    );
  } catch (e) {
    return jsonError(
      JagErrors.validation(e instanceof Error ? e.message : "statement failed")
    );
  }
}
