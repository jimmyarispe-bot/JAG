import { canAccessConnectorOrganization } from "@/lib/connectors";
import { getConnectorOrchestrator } from "@/lib/connectors/orchestrator";
import {
  jsonError,
  jsonOk,
  requireJagApiSession,
  requireOrganizationId,
} from "@/lib/jag-platform/api";
import { JagErrors } from "@/lib/jag-platform/errors";

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
      queue: orchestrator.scheduler.listQueue(orgGate.organizationId),
      registry: orchestrator.registry.list(orgGate.organizationId).map((r) => ({
        connectorId: r.connectorId,
        schedule: r.schedule,
        nextSyncAt: r.nextSyncAt,
        priority: r.priority,
      })),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    connectorId?: string;
    schedule?: string;
    priority?: "High" | "Normal" | "Low";
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessConnectorOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;
  if (!body.connectorId) {
    return jsonError(JagErrors.validation("connectorId is required."));
  }

  const orchestrator = getConnectorOrchestrator();
  if (body.priority) {
    orchestrator.scheduler.setPriority(
      orgGate.organizationId,
      body.connectorId,
      body.priority
    );
  }
  if (body.schedule) {
    const result = await orchestrator.schedule(
      {
        organizationId: orgGate.organizationId,
        organizationName: orgGate.organizationId,
        connectorId: body.connectorId,
        installationId: "",
        actorUserId: gate.session.userId,
        actorDisplayName: gate.session.displayName,
      },
      body.schedule as never
    );
    return jsonOk({ result }, { correlationId: gate.correlationId });
  }

  return jsonOk({ ok: true }, { correlationId: gate.correlationId });
}
