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

  const dashboard = getConnectorOrchestrator().getDashboard(
    orgGate.organizationId
  );
  return jsonOk({ dashboard }, { correlationId: gate.correlationId });
}

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    organizationName?: string;
    connectorId?: string;
    action?: string;
    schedule?: string;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessConnectorOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  const orchestrator = getConnectorOrchestrator();
  const ctx = {
    organizationId: orgGate.organizationId,
    organizationName: body.organizationName ?? orgGate.organizationId,
    connectorId: body.connectorId ?? "",
    installationId: "",
    actorUserId: gate.session.userId,
    actorDisplayName: gate.session.displayName,
    demo: true,
  };

  if (body.action === "runDue") {
    const result = await orchestrator.runDue(orgGate.organizationId, ctx);
    return jsonOk({ result }, { correlationId: gate.correlationId });
  }

  if (!body.connectorId && body.action !== "runDue") {
    return jsonError(JagErrors.validation("connectorId is required."));
  }

  let result;
  switch (body.action) {
    case "connect":
      result = await orchestrator.connect(ctx);
      break;
    case "disconnect":
      result = await orchestrator.disconnect(ctx);
      break;
    case "validate":
      result = await orchestrator.validate(ctx);
      break;
    case "sync":
      result = await orchestrator.sync(ctx);
      break;
    case "refresh":
      result = await orchestrator.refresh(ctx);
      break;
    case "schedule":
      result = await orchestrator.schedule(
        ctx,
        (body.schedule as never) ?? "Manual"
      );
      break;
    default:
      result = { ok: false, message: "Unknown action." };
  }

  return jsonOk({ result }, { correlationId: gate.correlationId });
}
