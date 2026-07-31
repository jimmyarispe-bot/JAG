import { canAccessConnectorOrganization } from "@/lib/connectors";
import { getConnectorOrchestrator } from "@/lib/connectors/orchestrator";
import {
  jsonOk,
  requireJagApiSession,
  requireOrganizationId,
} from "@/lib/jag-platform/api";

export async function GET(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("organizationId");
  const orchestrator = getConnectorOrchestrator();

  if (orgId) {
    const orgGate = requireOrganizationId(
      orgId,
      (id) => canAccessConnectorOrganization(gate.session, id),
      gate.correlationId
    );
    if (!orgGate.ok) return orgGate.response;
    return jsonOk(
      {
        catalog: orchestrator.catalog.listForOrganization(
          orgGate.organizationId
        ),
        byCategory: orchestrator.catalog.listByCategory(),
      },
      { correlationId: gate.correlationId }
    );
  }

  return jsonOk(
    {
      catalog: orchestrator.catalog.list(),
      byCategory: orchestrator.catalog.listByCategory(),
    },
    { correlationId: gate.correlationId }
  );
}
