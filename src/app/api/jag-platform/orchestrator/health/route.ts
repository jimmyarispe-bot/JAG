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
  const orgGate = requireOrganizationId(
    searchParams.get("organizationId"),
    (id) => canAccessConnectorOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  const orchestrator = getConnectorOrchestrator();
  const connectorId = searchParams.get("connectorId");
  if (connectorId) {
    return jsonOk(
      {
        evaluation: orchestrator.health.evaluate(
          orgGate.organizationId,
          connectorId
        ),
      },
      { correlationId: gate.correlationId }
    );
  }

  return jsonOk(
    {
      summary: orchestrator.health.summarize(orgGate.organizationId),
      registry: orchestrator.registry.list(orgGate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}
