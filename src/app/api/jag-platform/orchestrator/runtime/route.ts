import { getConnectorOrchestrator } from "@/lib/connectors/orchestrator";
import { jsonOk, requireJagApiSession } from "@/lib/jag-platform/api";

export async function GET() {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const runtimes = getConnectorOrchestrator().runtime.list().map((r) => ({
    connectorId: r.connectorId,
    capabilities: r.capabilities(),
  }));

  return jsonOk({ runtimes }, { correlationId: gate.correlationId });
}
