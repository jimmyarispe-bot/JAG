import {
  createInterventionService,
  type InterventionKind,
  type InterventionStatus,
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
  const service = createInterventionService();
  const interventionId = searchParams.get("interventionId");
  if (interventionId) {
    return jsonOk(
      { intervention: service.get(gate.organizationId, interventionId) },
      { correlationId: gate.correlationId }
    );
  }

  const items = service.list(gate.organizationId, {
    studentId: searchParams.get("studentId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    kind: searchParams.get("kind") ?? undefined,
  });
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    studentId?: string;
    kind?: InterventionKind;
    goals?: string;
    assignedStaffIds?: string[];
    startsOn?: string;
    endsOn?: string | null;
    reviewOn?: string | null;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.studentId || !body.kind || !body.goals || !body.startsOn) {
    return jsonError(
      JagErrors.validation(
        "studentId, kind, goals, and startsOn are required."
      )
    );
  }
  const created = createInterventionService().create({
    organizationId: gate.organizationId,
    studentId: body.studentId,
    kind: body.kind,
    goals: body.goals,
    assignedStaffIds: body.assignedStaffIds,
    startsOn: body.startsOn,
    endsOn: body.endsOn,
    reviewOn: body.reviewOn,
    createdBy: gate.session.userId,
  });
  if ("error" in created) return jsonError(JagErrors.validation(created.error));
  return jsonOk(
    { intervention: created },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    interventionId?: string;
    status?: InterventionStatus;
    goals?: string;
    assignedStaffIds?: string[];
    endsOn?: string | null;
    reviewOn?: string | null;
    outcome?: string;
    progressNotes?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.interventionId) {
    return jsonError(JagErrors.validation("interventionId is required."));
  }
  const patched = createInterventionService().patch({
    organizationId: gate.organizationId,
    interventionId: body.interventionId,
    status: body.status,
    goals: body.goals,
    assignedStaffIds: body.assignedStaffIds,
    endsOn: body.endsOn,
    reviewOn: body.reviewOn,
    outcome: body.outcome,
    progressNotes: body.progressNotes,
    actor: gate.session.userId,
  });
  if (!patched) return jsonError(JagErrors.notFound("Intervention not found."));
  if ("error" in patched) return jsonError(JagErrors.validation(patched.error));
  return jsonOk(
    { intervention: patched },
    { correlationId: gate.correlationId }
  );
}
