import { buildHealthReport, getLastOperationsDashboard } from "@academyos";
import { jsonOk, requireAcademyOsOrg, requireAcademyOsOrgBody } from "@/app/api/academyos/_lib";

export async function GET(request: Request) {
  const gate = await requireAcademyOsOrg(request);
  if (!gate.ok) return gate.response;
  const last = getLastOperationsDashboard();
  return jsonOk(
    { health: last?.health ?? buildHealthReport() },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  const health = buildHealthReport({ organizationId: gate.organizationId });
  return jsonOk(
    { health },
    { correlationId: gate.correlationId, status: 201 }
  );
}
