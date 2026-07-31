import {
  canAccessEvidenceOrganization,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  bootstrapDigitalTwin,
  createTwinMetricsService,
} from "@/lib/digital-twin";
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

  const metrics = createTwinMetricsService().snapshot(
    orgGate.organizationId
  );
  return jsonOk({ metrics }, { correlationId: gate.correlationId });
}
