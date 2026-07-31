import {
  createAssignmentService,
  type AssignmentKind,
} from "@academyos";
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
  const items = createAssignmentService().list(
    gate.organizationId,
    searchParams.get("employeeId") ?? undefined
  );
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    employeeId?: string;
    kind?: AssignmentKind;
    targetId?: string;
    targetName?: string;
    startsOn?: string;
    endsOn?: string | null;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (
    !body.employeeId ||
    !body.kind ||
    !body.targetId ||
    !body.targetName ||
    !body.startsOn
  ) {
    return jsonError(
      JagErrors.validation(
        "employeeId, kind, targetId, targetName, and startsOn are required."
      )
    );
  }
  const assigned = createAssignmentService().assign({
    organizationId: gate.organizationId,
    employeeId: body.employeeId,
    kind: body.kind,
    targetId: body.targetId,
    targetName: body.targetName,
    startsOn: body.startsOn,
    endsOn: body.endsOn,
    createdBy: gate.session.userId,
  });
  if ("error" in assigned) {
    return jsonError(JagErrors.validation(assigned.error));
  }
  return jsonOk(
    { assignment: assigned },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    assignmentId?: string;
    endsOn?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.assignmentId || !body.endsOn) {
    return jsonError(
      JagErrors.validation("assignmentId and endsOn are required.")
    );
  }
  const ended = createAssignmentService().end({
    organizationId: gate.organizationId,
    assignmentId: body.assignmentId,
    endsOn: body.endsOn,
    actor: gate.session.userId,
  });
  if (!ended) return jsonError(JagErrors.notFound("Assignment not found."));
  return jsonOk({ assignment: ended }, { correlationId: gate.correlationId });
}
