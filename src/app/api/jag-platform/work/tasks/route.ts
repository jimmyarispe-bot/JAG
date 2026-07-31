import { canAccessEvidenceOrganization } from "@/lib/evidence-center";
import { createTaskService } from "@/lib/work";
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
      tasks: createTaskService().list(orgGate.organizationId, projectId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    title?: string;
    description?: string;
    projectId?: string | null;
    type?: "Task" | "Action" | "Deliverable";
    assignee?: string | null;
    dueDate?: string | null;
    relatedGoalId?: string | null;
    relatedDecisionId?: string | null;
    relatedRiskId?: string | null;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  if (!body.title?.trim() || !body.description?.trim()) {
    return jsonError(
      JagErrors.validation("Title and description are required.")
    );
  }

  const result = createTaskService().create({
    organizationId: orgGate.organizationId,
    title: body.title.trim(),
    description: body.description.trim(),
    type: body.type ?? "Task",
    projectId: body.projectId ?? null,
    assignee: body.assignee ?? null,
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
    { task: result },
    { correlationId: gate.correlationId, status: 201 }
  );
}
