import {
  canAccessEvidenceOrganization,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  createDependencyService,
  createWorkService,
  WORK_ITEM_TYPES,
  type WorkItemType,
} from "@/lib/work";
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

  const service = createWorkService();
  const workItemId = searchParams.get("workItemId");
  if (workItemId) {
    return jsonOk(
      { workItem: service.get(orgGate.organizationId, workItemId) },
      { correlationId: gate.correlationId }
    );
  }

  const projectId = searchParams.get("projectId");
  const workItems = projectId
    ? service.listByProject(orgGate.organizationId, projectId)
    : service.list(orgGate.organizationId);

  return jsonOk({ workItems }, { correlationId: gate.correlationId });
}

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: string;
    title?: string;
    description?: string;
    type?: string;
    projectId?: string | null;
    assignee?: string | null;
    owner?: string | null;
    department?: string | null;
    businessUnit?: string | null;
    dueDate?: string | null;
    relatedGoalId?: string | null;
    relatedDecisionId?: string | null;
    relatedRiskId?: string | null;
    fromWorkItemId?: string;
    toWorkItemId?: string;
    dependencyKind?: string;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;
  void resolveEvidenceOrganization(gate.session, orgGate.organizationId);

  if (body.action === "dependency") {
    if (!body.fromWorkItemId || !body.toWorkItemId || !body.dependencyKind) {
      return jsonError(
        JagErrors.validation(
          "fromWorkItemId, toWorkItemId, and dependencyKind are required."
        )
      );
    }
    const result = createDependencyService().add({
      organizationId: orgGate.organizationId,
      fromWorkItemId: body.fromWorkItemId,
      toWorkItemId: body.toWorkItemId,
      kind: body.dependencyKind as never,
      createdBy: gate.session.userId,
    });
    if ("error" in result) {
      return jsonError(JagErrors.validation(result.error));
    }
    return jsonOk(
      { dependency: result },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (!body.title?.trim() || !body.description?.trim()) {
    return jsonError(
      JagErrors.validation("Title and description are required.")
    );
  }

  const type = (WORK_ITEM_TYPES as readonly string[]).includes(body.type ?? "")
    ? (body.type as WorkItemType)
    : "Work Item";

  const result = createWorkService().create({
    organizationId: orgGate.organizationId,
    title: body.title.trim(),
    description: body.description.trim(),
    type,
    projectId: body.projectId ?? null,
    assignee: body.assignee ?? null,
    owner: body.owner ?? null,
    department: body.department ?? null,
    businessUnit: body.businessUnit ?? null,
    dueDate: body.dueDate ?? null,
    relatedGoalId: body.relatedGoalId ?? null,
    relatedDecisionId: body.relatedDecisionId ?? null,
    relatedRiskId: body.relatedRiskId ?? null,
    createdBy: gate.session.userId,
  });

  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }

  return jsonOk(
    { workItem: result },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    workItemId?: string;
    title?: string;
    description?: string;
    status?: string;
    assignee?: string | null;
    owner?: string | null;
    priority?: "P1" | "P2" | "P3";
    dueDate?: string | null;
    actualEffort?: number;
    projectId?: string | null;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  if (!body.workItemId) {
    return jsonError(JagErrors.validation("workItemId is required."));
  }

  const result = createWorkService().patch({
    organizationId: orgGate.organizationId,
    workItemId: body.workItemId,
    actor: gate.session.userId,
    title: body.title,
    description: body.description,
    status: body.status as never,
    assignee: body.assignee,
    owner: body.owner,
    priority: body.priority,
    dueDate: body.dueDate,
    actualEffort: body.actualEffort,
    projectId: body.projectId,
  });

  if (result == null) {
    return jsonError(JagErrors.notFound("Work item", gate.correlationId));
  }
  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }

  return jsonOk({ workItem: result }, { correlationId: gate.correlationId });
}
