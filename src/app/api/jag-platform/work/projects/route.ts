import { canAccessEvidenceOrganization } from "@/lib/evidence-center";
import { createProjectService } from "@/lib/work";
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

  const service = createProjectService();
  return jsonOk(
    {
      projects: service.list(orgGate.organizationId),
      initiatives: service.listInitiatives(orgGate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    kind?: string;
    title?: string;
    description?: string;
    owner?: string | null;
    department?: string | null;
    businessUnit?: string | null;
    relatedGoalId?: string | null;
    relatedDecisionId?: string | null;
    relatedRiskId?: string | null;
    dueDate?: string | null;
    projectId?: string;
    status?: string;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  const service = createProjectService();

  if (body.kind === "initiative") {
    if (!body.title?.trim()) {
      return jsonError(JagErrors.validation("title is required."));
    }
    const result = service.createInitiative({
      organizationId: orgGate.organizationId,
      title: body.title.trim(),
      description: body.description?.trim() ?? "",
      owner: body.owner ?? null,
      relatedGoalId: body.relatedGoalId ?? null,
      createdBy: gate.session.userId,
    });
    if ("error" in result) {
      return jsonError(JagErrors.validation(result.error));
    }
    return jsonOk(
      { initiative: result },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (body.kind === "update" && body.projectId) {
    const updated = service.update({
      organizationId: orgGate.organizationId,
      projectId: body.projectId,
      actor: gate.session.userId,
      title: body.title,
      description: body.description,
      status: body.status as never,
      owner: body.owner,
      department: body.department,
      businessUnit: body.businessUnit,
      dueDate: body.dueDate,
    });
    if (!updated) {
      return jsonError(JagErrors.notFound("Project", gate.correlationId));
    }
    return jsonOk({ project: updated }, { correlationId: gate.correlationId });
  }

  if (!body.title?.trim()) {
    return jsonError(JagErrors.validation("title is required."));
  }

  const result = service.create({
    organizationId: orgGate.organizationId,
    title: body.title.trim(),
    description: body.description?.trim() ?? "",
    owner: body.owner ?? null,
    department: body.department ?? null,
    businessUnit: body.businessUnit ?? null,
    relatedGoalId: body.relatedGoalId ?? null,
    relatedDecisionId: body.relatedDecisionId ?? null,
    relatedRiskId: body.relatedRiskId ?? null,
    dueDate: body.dueDate ?? null,
    createdBy: gate.session.userId,
  });

  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }

  return jsonOk(
    { project: result },
    { correlationId: gate.correlationId, status: 201 }
  );
}
