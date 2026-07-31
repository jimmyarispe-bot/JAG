import {
  canAccessEvidenceOrganization,
  listAccessibleEvidenceOrganizations,
} from "@/lib/evidence-center";
import { getExecutiveMetrics } from "@/lib/executive-intelligence";
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

  const metrics = getExecutiveMetrics({
    organizationId: orgGate.organizationId,
    organizationCount: listAccessibleEvidenceOrganizations(gate.session).length,
  });

  return jsonOk({ metrics }, { correlationId: gate.correlationId });
}
