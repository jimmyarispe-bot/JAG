import {
  createFinanceEngine,
  createTreasuryEngine,
  type ConnectionProvider,
} from "@finance";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireFinanceOrg,
  requireFinanceOrgBody,
} from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireFinanceOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createTreasuryEngine();
  return jsonOk(
    {
      institutions: engine.listInstitutions(gate.organizationId),
      connections: engine.listConnections(gate.organizationId),
      providers: engine.connectionProviders(),
      plaid: engine.plaidInterface(),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?:
      | "register_institution"
      | "connect"
      | "status"
      | "rotate_credentials";
    name?: string;
    provider?: ConnectionProvider;
    country?: string;
    institutionId?: string;
    entityId?: string;
    connectionId?: string;
    status?: "active" | "pending" | "error" | "disconnected" | "needs_reauth";
    externalItemId?: string;
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const engine = createTreasuryEngine();
  const userId = gate.session.userId;
  createFinanceEngine().grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["create", "financial_administrator", "controller"]),
    actorUserId: userId,
  });

  if (body.action === "connect") {
    const conn = engine.connectInstitution({
      organizationId: gate.organizationId,
      userId,
      institutionId: body.institutionId ?? "",
      entityId: body.entityId,
      externalItemId: body.externalItemId,
    });
    if ("error" in conn) return jsonError(JagErrors.validation(conn.error));
    return jsonOk(
      { connection: conn },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (body.action === "status") {
    const conn = engine.markConnectionStatus({
      organizationId: gate.organizationId,
      userId,
      connectionId: body.connectionId ?? "",
      status: body.status ?? "active",
    });
    if ("error" in conn) return jsonError(JagErrors.validation(conn.error));
    return jsonOk({ connection: conn }, { correlationId: gate.correlationId });
  }

  if (body.action === "rotate_credentials") {
    const conn = engine.rotateConnectionCredentials({
      organizationId: gate.organizationId,
      userId,
      connectionId: body.connectionId ?? "",
    });
    if ("error" in conn) return jsonError(JagErrors.validation(conn.error));
    return jsonOk({ connection: conn }, { correlationId: gate.correlationId });
  }

  const institution = engine.registerInstitution({
    organizationId: gate.organizationId,
    userId,
    name: body.name ?? "Manual Institution",
    provider: body.provider ?? "manual",
    country: body.country,
  });
  if ("error" in institution) {
    return jsonError(JagErrors.validation(institution.error));
  }
  return jsonOk(
    { institution },
    { correlationId: gate.correlationId, status: 201 }
  );
}
