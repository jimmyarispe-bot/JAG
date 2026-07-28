import {
  buildStudioDashboard,
  buildStudioInsightsSummary,
  createStudioInsightProvider,
  installJagStudio,
} from "@studio";
import {
  JagErrors,
  jsonError,
  jsonOk,
  requireStudioOrg,
  requireStudioOrgBody,
} from "../_lib";

export async function GET(request: Request) {
  const gate = await requireStudioOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  if (searchParams.get("dashboard") === "1") {
    return jsonOk(
      { dashboard: buildStudioDashboard() },
      { correlationId: gate.correlationId }
    );
  }
  if (searchParams.get("evaluate") === "1") {
    const insights = createStudioInsightProvider().evaluate({
      organizationId: gate.organizationId,
      asOf: new Date().toISOString(),
      signals: {},
    });
    return jsonOk({ insights }, { correlationId: gate.correlationId });
  }
  return jsonOk(
    { summary: buildStudioInsightsSummary() },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: string;
  };
  const gate = await requireStudioOrgBody(body);
  if (!gate.ok) return gate.response;
  if (body.action !== "install") {
    return jsonError(JagErrors.validation('action must be "install".'));
  }
  const result = installJagStudio({
    organizationId: gate.organizationId,
  });
  return jsonOk(
    { install: result, dashboard: buildStudioDashboard() },
    { correlationId: gate.correlationId, status: 201 }
  );
}
