import {
  getLastHardeningDashboard,
  listHardeningCatalog,
  runAcademyOsHardening,
  type HardeningSuiteId,
} from "@academyos";
import {
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
      { catalog: listHardeningCatalog() },
      { correlationId: gate.correlationId }
    );
  }
  return jsonOk(
    {
      dashboard: getLastHardeningDashboard(),
      catalog: listHardeningCatalog(),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    organizationIds?: string[];
    suiteIds?: HardeningSuiteId[];
    includeRc1?: boolean;
    freshSdk?: boolean;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;

  const dashboard = await runAcademyOsHardening({
    organizationId: gate.organizationId,
    organizationIds: body.organizationIds ?? [
      gate.organizationId,
      `${gate.organizationId}.isolation`,
    ],
    suiteIds: body.suiteIds,
    includeRc1: body.includeRc1,
    freshSdk: body.freshSdk,
  });

  return jsonOk(
    { dashboard },
    { correlationId: gate.correlationId, status: 201 }
  );
}
