import {
  getLastOperationsDashboard,
  validateConfiguration,
} from "@academyos";
import { jsonOk, requireAcademyOsOrg, requireAcademyOsOrgBody } from "@/app/api/academyos/_lib";

export async function GET(request: Request) {
  const gate = await requireAcademyOsOrg(request);
  if (!gate.ok) return gate.response;
  const last = getLastOperationsDashboard();
  return jsonOk(
    { configuration: last?.configuration ?? validateConfiguration() },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    environment?: "development" | "production" | "test";
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  const configuration = validateConfiguration({
    environment: body.environment,
    organizationId: gate.organizationId,
  });
  return jsonOk(
    { configuration },
    { correlationId: gate.correlationId, status: 201 }
  );
}
