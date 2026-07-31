import {
  getLastValidationDashboard,
  listScenarioCatalog,
  runAcademyOsValidation,
  type ValidationScenarioId,
} from "@academyos";
import {
  JagErrors,
  jsonError,
  jsonOk,
  requireAcademyOsOrg,
  requireAcademyOsOrgBody,
} from "@/app/api/academyos/_lib";

export async function GET(request: Request) {
  const gate = await requireAcademyOsOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  if (searchParams.get("catalog") === "1") {
    return jsonOk(
      { catalog: listScenarioCatalog() },
      { correlationId: gate.correlationId }
    );
  }
  const last = getLastValidationDashboard();
  return jsonOk(
    { dashboard: last, catalog: listScenarioCatalog() },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    organizationIds?: string[];
    scenarioIds?: ValidationScenarioId[];
    freshSdk?: boolean;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;

  const dashboard = await runAcademyOsValidation({
    organizationId: gate.organizationId,
    organizationIds: body.organizationIds ?? [
      gate.organizationId,
      `${gate.organizationId}.isolation`,
    ],
    scenarioIds: body.scenarioIds,
    freshSdk: body.freshSdk,
  });

  if (!dashboard) {
    return jsonError(JagErrors.validation("Validation run produced no dashboard."));
  }

  return jsonOk(
    { dashboard },
    { correlationId: gate.correlationId, status: 201 }
  );
}
