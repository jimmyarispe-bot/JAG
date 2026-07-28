import { createFinanceEngine, type EntityKind } from "@finance";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireFinanceOrg,
  requireFinanceOrgBody,
} from "../_lib";

export async function GET(request: Request) {
  const gate = await requireFinanceOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createFinanceEngine();
  return jsonOk(
    {
      entities: engine.listEntities(gate.organizationId),
      intercompany: engine.listIntercompanyLinks(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "create" | "bootstrap" | "link";
    name?: string;
    kind?: EntityKind;
    parentEntityId?: string;
    fromEntityId?: string;
    toEntityId?: string;
    relationship?: string;
    coaTemplate?: "corporate" | "nonprofit" | "education" | "healthcare" | "government" | "manufacturing" | "professional_services" | "custom";
  };
  const gate = await requireFinanceOrgBody(body);
  if (!gate.ok) return gate.response;
  const engine = createFinanceEngine();
  const userId = gate.session.userId;

  if (body.action === "bootstrap") {
    const result = engine.bootstrap({
      organizationId: gate.organizationId,
      userId,
      entityName: body.name,
      coaTemplate: body.coaTemplate,
    });
    if ("error" in result) {
      return jsonError(JagErrors.validation(result.error));
    }
    return jsonOk(
      { ...result },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (body.action === "link") {
    const link = engine.linkIntercompany({
      organizationId: gate.organizationId,
      userId,
      fromEntityId: body.fromEntityId ?? "",
      toEntityId: body.toEntityId ?? "",
      relationship: body.relationship ?? "intercompany",
    });
    if ("error" in link) return jsonError(JagErrors.validation(link.error));
    return jsonOk({ link }, { correlationId: gate.correlationId, status: 201 });
  }

  // Ensure actor can create
  engine.grantRoles({
    organizationId: gate.organizationId,
    userId,
    roles: Object.freeze(["cfo"]),
    actorUserId: userId,
  });
  const entity = engine.createEntity({
    organizationId: gate.organizationId,
    userId,
    name: body.name ?? "Entity",
    kind: body.kind ?? "single",
    parentEntityId: body.parentEntityId,
  });
  if ("error" in entity) return jsonError(JagErrors.validation(entity.error));
  return jsonOk(
    { entity },
    { correlationId: gate.correlationId, status: 201 }
  );
}
