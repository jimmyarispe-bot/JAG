import { getLastOperationsDashboard, validateUpgrade } from "@academyos";
import { jsonOk, requireAcademyOsOrg, requireAcademyOsOrgBody } from "@/app/api/academyos/_lib";

export async function GET(request: Request) {
  const gate = await requireAcademyOsOrg(request);
  if (!gate.ok) return gate.response;
  const last = getLastOperationsDashboard();
  return jsonOk(
    { upgrades: last?.upgrades ?? validateUpgrade() },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  const upgrades = validateUpgrade({ organizationId: gate.organizationId });
  return jsonOk(
    { upgrades },
    { correlationId: gate.correlationId, status: 201 }
  );
}
