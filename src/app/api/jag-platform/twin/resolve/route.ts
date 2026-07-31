import {
  canAccessEvidenceOrganization,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  bootstrapDigitalTwin,
  createTwinResolver,
  TWIN_ENTITY_TYPES,
  type TwinEntityType,
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
  bootstrapDigitalTwin({
    organizationId: orgGate.organizationId,
    organizationName: org?.name ?? orgGate.organizationId,
    actor: gate.session.userId,
  });

  const resolver = createTwinResolver();
  const twinId = searchParams.get("twinId");
  const graphNodeId = searchParams.get("graphNodeId");
  const entityType = searchParams.get("entityType");
  const externalKey = searchParams.get("externalKey");

  let resolved = null;
  if (twinId) {
    resolved = resolver.resolve(orgGate.organizationId, twinId);
  } else if (graphNodeId) {
    resolved = resolver.resolveByGraphNode(
      orgGate.organizationId,
      graphNodeId
    );
  } else if (
    entityType &&
    externalKey &&
    (TWIN_ENTITY_TYPES as readonly string[]).includes(entityType)
  ) {
    resolved = resolver.resolveByKey(
      orgGate.organizationId,
      entityType as TwinEntityType,
      externalKey
    );
  } else {
    return jsonError(
      JagErrors.validation(
        "Provide twinId, graphNodeId, or entityType+externalKey."
      )
    );
  }

  if (!resolved) {
    return jsonError(JagErrors.notFound("Twin entity", gate.correlationId));
  }

  return jsonOk({ resolved }, { correlationId: gate.correlationId });
}
