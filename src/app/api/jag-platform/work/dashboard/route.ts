import { canAccessEvidenceOrganization } from "@/lib/evidence-center";
import { createWorkService } from "@/lib/work";
import {
  jsonOk,
  requireJagApiSession,
  requireOrganizationId,
} from "@/lib/jag-platform/api";

export async function GET(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const orgGate = requireOrganizationId(
    searchParams.get("organizationId"),
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  return jsonOk(
    { dashboard: createWorkService().dashboard(orgGate.organizationId) },
    { correlationId: gate.correlationId }
  );
}
