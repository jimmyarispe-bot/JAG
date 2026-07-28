import {
  getLastOperationsDashboard,
  validateDeployment,
} from "@academyos";
import { jsonOk, requireAcademyOsOrg, requireAcademyOsOrgBody } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireAcademyOsOrg(request);
  if (!gate.ok) return gate.response;
  const last = getLastOperationsDashboard();
  return jsonOk(
    { deployment: last?.deployment ?? validateDeployment() },
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
  const deployment = validateDeployment({
    environment: body.environment,
    organizationId: gate.organizationId,
  });
  return jsonOk(
    { deployment },
    { correlationId: gate.correlationId, status: 201 }
  );
}
