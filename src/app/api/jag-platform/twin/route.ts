import {
  canAccessEvidenceOrganization,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  bootstrapDigitalTwin,
  buildTwinExplorerView,
  createTwinRegistry,
  createTwinRelationshipService,
  createTwinResolver,
  TWIN_ENTITY_TYPES,
  TWIN_RELATIONSHIP_TYPES,
  type TwinEntityType,
  type TwinRelationshipType,
} from "@/lib/digital-twin";
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
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  const org = resolveEvidenceOrganization(
    gate.session,
    orgGate.organizationId
  );
  const organizationName = org?.name ?? orgGate.organizationId;
  const view = buildTwinExplorerView({
    organizationId: orgGate.organizationId,
    organizationName,
    actor: gate.session.userId,
  });

  return jsonOk({ view }, { correlationId: gate.correlationId });
}

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: string;
    entityType?: string;
    label?: string;
    description?: string;
    externalKey?: string;
    metadata?: Record<string, string>;
    fromTwinId?: string;
    toTwinId?: string;
    relationshipType?: string;
    twinId?: string;
    q?: string;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  const org = resolveEvidenceOrganization(
    gate.session,
    orgGate.organizationId
  );
  const organizationName = org?.name ?? orgGate.organizationId;
  const actor = gate.session.userId;

  if (body.action === "bootstrap") {
    const result = bootstrapDigitalTwin({
      organizationId: orgGate.organizationId,
      organizationName,
      actor,
    });
    return jsonOk({ result }, { correlationId: gate.correlationId });
  }

  if (body.action === "search") {
    const resolver = createTwinResolver();
    bootstrapDigitalTwin({
      organizationId: orgGate.organizationId,
      organizationName,
      actor,
    });
    const results = resolver.search({
      organizationId: orgGate.organizationId,
      q: body.q,
      entityType: (TWIN_ENTITY_TYPES as readonly string[]).includes(
        body.entityType ?? ""
      )
        ? (body.entityType as TwinEntityType)
        : "",
    });
    return jsonOk({ results }, { correlationId: gate.correlationId });
  }

  if (body.action === "resolve") {
    const resolver = createTwinResolver();
    const resolved = body.twinId
      ? resolver.resolve(orgGate.organizationId, body.twinId)
      : null;
    return jsonOk({ resolved }, { correlationId: gate.correlationId });
  }

  if (body.action === "connect") {
    if (
      !(TWIN_RELATIONSHIP_TYPES as readonly string[]).includes(
        body.relationshipType ?? ""
      )
    ) {
      return jsonError(JagErrors.validation("Invalid relationship type."));
    }
    const result = createTwinRelationshipService().connect({
      organizationId: orgGate.organizationId,
      fromTwinId: body.fromTwinId ?? "",
      toTwinId: body.toTwinId ?? "",
      relationshipType: body.relationshipType as TwinRelationshipType,
      actor,
      metadata: body.metadata,
    });
    if ("error" in result) {
      return jsonError(JagErrors.validation(result.error));
    }
    return jsonOk({ relationship: result }, { correlationId: gate.correlationId });
  }

  if (
    !(TWIN_ENTITY_TYPES as readonly string[]).includes(body.entityType ?? "")
  ) {
    return jsonError(JagErrors.validation("Invalid twin entity type."));
  }
  if (!body.label?.trim() || !body.externalKey?.trim()) {
    return jsonError(
      JagErrors.validation("label and externalKey are required.")
    );
  }

  const entity = createTwinRegistry().register({
    organizationId: orgGate.organizationId,
    entityType: body.entityType as TwinEntityType,
    label: body.label,
    description: body.description,
    externalKey: body.externalKey,
    metadata: body.metadata,
    createdBy: actor,
  });
  if ("error" in entity) {
    return jsonError(JagErrors.validation(entity.error));
  }
  return jsonOk(
    { entity },
    { correlationId: gate.correlationId, status: 201 }
  );
}
