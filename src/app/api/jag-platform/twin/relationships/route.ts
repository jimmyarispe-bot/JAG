import { canAccessEvidenceOrganization } from "@/lib/evidence-center";
import {
  createTwinRelationshipService,
  TWIN_RELATIONSHIP_TYPES,
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

  const twinId = searchParams.get("twinId") ?? undefined;
  const relationshipType = searchParams.get("relationshipType") ?? "";
  const relationships = createTwinRelationshipService().list(
    orgGate.organizationId,
    {
      twinId,
      relationshipType: (TWIN_RELATIONSHIP_TYPES as readonly string[]).includes(
        relationshipType
      )
        ? (relationshipType as TwinRelationshipType)
        : undefined,
    }
  );

  return jsonOk({ relationships }, { correlationId: gate.correlationId });
}

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    fromTwinId?: string;
    toTwinId?: string;
    relationshipType?: string;
    metadata?: Record<string, string>;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

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
    actor: gate.session.userId,
    metadata: body.metadata,
  });
  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }
  return jsonOk(
    { relationship: result },
    { correlationId: gate.correlationId, status: 201 }
  );
}
