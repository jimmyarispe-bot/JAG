import { createSubstituteService } from "@academyos";
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
  const service = createSubstituteService();
  if (searchParams.get("view") === "coverage") {
    return jsonOk(
      { coverage: service.coverageStats(gate.organizationId) },
      { correlationId: gate.correlationId }
    );
  }
  const items = service.list(gate.organizationId);
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "request" | "assign";
    employeeId?: string;
    startsOn?: string;
    endsOn?: string;
    reason?: string;
    sessionIds?: string[];
    absenceId?: string;
    substituteEmployeeId?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  const service = createSubstituteService();

  if (body.action === "assign") {
    if (!body.absenceId || !body.substituteEmployeeId) {
      return jsonError(
        JagErrors.validation(
          "absenceId and substituteEmployeeId are required."
        )
      );
    }
    const result = service.assignSubstitute({
      organizationId: gate.organizationId,
      absenceId: body.absenceId,
      substituteEmployeeId: body.substituteEmployeeId,
      actor: gate.session.userId,
    });
    if (!result) return jsonError(JagErrors.notFound("Absence not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ absence: result }, { correlationId: gate.correlationId });
  }

  if (
    !body.employeeId ||
    !body.startsOn ||
    !body.endsOn ||
    !body.reason
  ) {
    return jsonError(
      JagErrors.validation(
        "employeeId, startsOn, endsOn, and reason are required."
      )
    );
  }
  const created = service.requestAbsence({
    organizationId: gate.organizationId,
    employeeId: body.employeeId,
    startsOn: body.startsOn,
    endsOn: body.endsOn,
    reason: body.reason,
    sessionIds: body.sessionIds,
    createdBy: gate.session.userId,
  });
  if ("error" in created) return jsonError(JagErrors.validation(created.error));
  return jsonOk(
    { absence: created },
    { correlationId: gate.correlationId, status: 201 }
  );
}
