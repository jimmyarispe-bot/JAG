import {
  getLastOperationsDashboard,
  validateBackupRecovery,
} from "@academyos";
import { jsonOk, requireAcademyOsOrg, requireAcademyOsOrgBody } from "@/app/api/academyos/_lib";

export async function GET(request: Request) {
  const gate = await requireAcademyOsOrg(request);
  if (!gate.ok) return gate.response;
  const last = getLastOperationsDashboard();
  return jsonOk(
    { backup: last?.backup ?? validateBackupRecovery() },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  const backup = validateBackupRecovery({
    organizationId: gate.organizationId,
  });
  return jsonOk(
    { backup },
    { correlationId: gate.correlationId, status: 201 }
  );
}
