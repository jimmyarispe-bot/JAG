import { canAccessConnectorOrganization } from "@/lib/connectors";
import {
  getConnectorOrchestrator,
  listOrchestratorJobs,
} from "@/lib/connectors/orchestrator";
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
  return jsonOk(
    {
      jobs: listOrchestratorJobs(orgGate.organizationId),
      queue: orchestrator.scheduler.listQueue(orgGate.organizationId),
      activeJobs: orchestrator.metrics.activeJobs(orgGate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}
