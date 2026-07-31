import {
  canAccessEvidenceOrganization,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import { createMemoryService } from "@/lib/memory";
import {
  jsonError,
  jsonOk,
  requireJagApiSession,
  requireOrganizationId,
} from "@/lib/jag-platform/api";
import { JagErrors } from "@/lib/jag-platform/errors";

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    memoryId?: string;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;
  void resolveEvidenceOrganization(gate.session, orgGate.organizationId);

  if (!body.memoryId) {
    return jsonError(JagErrors.validation("memoryId is required."));
  }

  const result = createMemoryService().validate({
    organizationId: orgGate.organizationId,
    memoryId: body.memoryId,
    actor: gate.session.userId,
  });

  if (!result) {
    return jsonError(JagErrors.notFound("Memory not found."));
  }
  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }

  return jsonOk({ memory: result }, { correlationId: gate.correlationId });
}
