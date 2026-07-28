import {
  createFinancialReportingEngine,
  type ReportingDashboard,
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
    {
      dashboards: engine.listDashboards(gate.organizationId),
      foundation: engine.foundationDashboard(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    kind?: ReportingDashboard["kind"];
    periodKey?: string;
    scopeId?: string | null;
    customKpis?: Record<string, number>;
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.periodKey) {
    return jsonError(JagErrors.validation("periodKey required"));
  }
  const engine = createFinancialReportingEngine();
  const dashboard = engine.buildDashboard({
    organizationId: gate.organizationId,
    userId: gate.session.userId,
    kind: body.kind ?? "executive",
    periodKey: body.periodKey,
    scopeId: body.scopeId,
    customKpis: body.customKpis,
  });
  return jsonOk(
    { dashboard },
    { correlationId: gate.correlationId, status: 201 }
  );
}
