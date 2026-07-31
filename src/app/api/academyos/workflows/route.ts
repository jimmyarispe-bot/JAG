import {
  createCommunicationsEmployeePortalService,
  createCommunicationsParentPortalService,
  createWorkflowService,
  type WorkflowRecipe,
} from "@academyos";
import type { WorkflowStatus } from "@academyos/communications";
import { paginate, parsePage } from "@academyos/api/pagination";
import {
  JagErrors,
  jsonError,
  jsonOk,
  requireAcademyOsOrg,
  requireAcademyOsOrgBody,
} from "@/app/api/academyos/_lib";

export async function GET(request: Request) {
  const gate = await requireAcademyOsOrg(request);
  if (!gate.ok) return gate.response;
  const { searchParams } = new URL(request.url);
  const service = createWorkflowService();
  const workflowId = searchParams.get("workflowId");
  if (workflowId) {
    return jsonOk(
      { workflow: service.get(gate.organizationId, workflowId) },
      { correlationId: gate.correlationId }
    );
  }
  const items = service.search({
    organizationId: gate.organizationId,
    q: searchParams.get("q") ?? undefined,
    status: (searchParams.get("status") as WorkflowStatus) || undefined,
    recipe: (searchParams.get("recipe") as WorkflowRecipe) || undefined,
    studentId: searchParams.get("studentId") ?? undefined,
    employeeId: searchParams.get("employeeId") ?? undefined,
    familyId: searchParams.get("familyId") ?? undefined,
  });
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    token?: string;
    portal?: string;
    action?: string;
    recipe?: WorkflowRecipe;
    name?: string;
    studentId?: string | null;
    familyId?: string | null;
    employeeId?: string | null;
    campusId?: string | null;
    programId?: string | null;
    activate?: boolean;
    workflowId?: string;
    stepId?: string;
  };

  if (
    body.action === "portal_complete_step" &&
    body.token &&
    body.workflowId &&
    body.stepId
  ) {
    const portal =
      body.portal === "employee"
        ? createCommunicationsEmployeePortalService()
        : createCommunicationsParentPortalService();
    const result = portal.completeWorkflowStep({
      token: body.token,
      workflowId: body.workflowId,
      stepId: body.stepId,
    });
    if (!result) return jsonError(JagErrors.notFound("Workflow not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ workflow: result });
  }

  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.recipe) {
    return jsonError(JagErrors.validation("recipe is required."));
  }
  const created = createWorkflowService().start({
    organizationId: gate.organizationId,
    recipe: body.recipe,
    name: body.name,
    studentId: body.studentId,
    familyId: body.familyId,
    employeeId: body.employeeId,
    campusId: body.campusId,
    programId: body.programId,
    activate: body.activate,
    createdBy: gate.session.userId,
  });
  if ("error" in created) return jsonError(JagErrors.validation(created.error));
  return jsonOk(
    { workflow: created },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    workflowId?: string;
    stepId?: string;
    status?: WorkflowStatus;
    skip?: boolean;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.workflowId) {
    return jsonError(JagErrors.validation("workflowId is required."));
  }
  const service = createWorkflowService();
  if (body.status) {
    const updated = service.setStatus({
      organizationId: gate.organizationId,
      workflowId: body.workflowId,
      status: body.status,
      actor: gate.session.userId,
    });
    if (!updated) return jsonError(JagErrors.notFound("Workflow not found."));
    if ("error" in updated)
      return jsonError(JagErrors.validation(updated.error));
    return jsonOk({ workflow: updated }, { correlationId: gate.correlationId });
  }
  if (!body.stepId) {
    return jsonError(
      JagErrors.validation("stepId or status is required for PATCH.")
    );
  }
  const advanced = service.advance({
    organizationId: gate.organizationId,
    workflowId: body.workflowId,
    stepId: body.stepId,
    actor: gate.session.userId,
    skip: body.skip,
  });
  if (!advanced) return jsonError(JagErrors.notFound("Workflow not found."));
  if ("error" in advanced)
    return jsonError(JagErrors.validation(advanced.error));
  return jsonOk({ workflow: advanced }, { correlationId: gate.correlationId });
}
