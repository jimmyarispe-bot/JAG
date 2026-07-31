import { canAccessEvidenceOrganization } from "@/lib/evidence-center";
import { createMitigationService } from "@/lib/risk";
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

  const riskId = searchParams.get("riskId") ?? undefined;
  return jsonOk(
    {
      mitigations: createMitigationService().list(
        orgGate.organizationId,
        riskId
      ),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    riskId?: string;
    title?: string;
    description?: string;
    owner?: string | null;
    dueDate?: string | null;
    status?: string;
    action?: string;
    mitigationId?: string;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  const service = createMitigationService();

  if (body.action === "update" && body.mitigationId) {
    const updated = service.update({
      organizationId: orgGate.organizationId,
      mitigationId: body.mitigationId,
      actor: gate.session.userId,
      title: body.title,
      description: body.description,
      status: body.status as never,
      owner: body.owner,
      dueDate: body.dueDate,
    });
    if (updated == null) {
      return jsonError(JagErrors.notFound("Mitigation", gate.correlationId));
    }
    if ("error" in updated) {
      return jsonError(JagErrors.validation(updated.error));
    }
    return jsonOk({ mitigation: updated }, { correlationId: gate.correlationId });
  }

  if (!body.riskId || !body.title?.trim()) {
    return jsonError(
      JagErrors.validation("riskId and title are required.")
    );
  }

  const result = service.create({
    organizationId: orgGate.organizationId,
    riskId: body.riskId,
    title: body.title.trim(),
    description: body.description?.trim() ?? "",
    owner: body.owner ?? null,
    dueDate: body.dueDate ?? null,
    status: body.status as never,
    createdBy: gate.session.userId,
  });

  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }

  return jsonOk(
    { mitigation: result },
    { correlationId: gate.correlationId, status: 201 }
  );
}
