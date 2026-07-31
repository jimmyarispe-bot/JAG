import { canAccessEvidenceOrganization } from "@/lib/evidence-center";
import { createMilestoneService } from "@/lib/work";
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

  const projectId = searchParams.get("projectId") ?? undefined;
  return jsonOk(
    {
      milestones: createMilestoneService().list(
        orgGate.organizationId,
        projectId
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
    projectId?: string;
    title?: string;
    description?: string;
    dueDate?: string | null;
    milestoneId?: string;
    status?: string;
    action?: string;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  const service = createMilestoneService();

  if (body.action === "refresh" && body.milestoneId) {
    const refreshed = service.refresh(
      orgGate.organizationId,
      body.milestoneId
    );
    if (!refreshed) {
      return jsonError(JagErrors.notFound("Milestone", gate.correlationId));
    }
    return jsonOk({ milestone: refreshed }, { correlationId: gate.correlationId });
  }

  if (body.action === "update" && body.milestoneId) {
    const updated = service.update({
      organizationId: orgGate.organizationId,
      milestoneId: body.milestoneId,
      actor: gate.session.userId,
      title: body.title,
      description: body.description,
      dueDate: body.dueDate,
      status: body.status as never,
    });
    if (updated == null) {
      return jsonError(JagErrors.notFound("Milestone", gate.correlationId));
    }
    if ("error" in updated) {
      return jsonError(JagErrors.validation(updated.error));
    }
    return jsonOk({ milestone: updated }, { correlationId: gate.correlationId });
  }

  if (!body.projectId || !body.title?.trim()) {
    return jsonError(
      JagErrors.validation("projectId and title are required.")
    );
  }

  const result = service.create({
    organizationId: orgGate.organizationId,
    projectId: body.projectId,
    title: body.title.trim(),
    description: body.description,
    dueDate: body.dueDate ?? null,
    createdBy: gate.session.userId,
  });

  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }

  return jsonOk(
    { milestone: result },
    { correlationId: gate.correlationId, status: 201 }
  );
}
