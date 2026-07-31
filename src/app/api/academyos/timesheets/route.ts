import { createTimekeepingService } from "@academyos";
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
  const service = createTimekeepingService();
  const timesheetId = searchParams.get("timesheetId");
  if (timesheetId) {
    return jsonOk(
      { timesheet: service.get(gate.organizationId, timesheetId) },
      { correlationId: gate.correlationId }
    );
  }
  const items = service.list(
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
    action?:
      | "create"
      | "add_entry"
      | "session_time"
      | "submit"
      | "approve"
      | "reject";
    employeeId?: string;
    weekStarting?: string;
    timesheetId?: string;
    date?: string;
    minutes?: number;
    source?: "Clock" | "Manual" | "Session";
    sessionId?: string;
    notes?: string;
    isSchoolLeader?: boolean;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  const service = createTimekeepingService();

  if (body.action === "submit") {
    if (!body.timesheetId) {
      return jsonError(JagErrors.validation("timesheetId is required."));
    }
    const result = service.submit({
      organizationId: gate.organizationId,
      timesheetId: body.timesheetId,
      actor: gate.session.userId,
    });
    if (!result) return jsonError(JagErrors.notFound("Timesheet not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ timesheet: result }, { correlationId: gate.correlationId });
  }

  if (body.action === "approve") {
    if (!body.timesheetId) {
      return jsonError(JagErrors.validation("timesheetId is required."));
    }
    const result = service.approve({
      organizationId: gate.organizationId,
      timesheetId: body.timesheetId,
      actor: gate.session.userId,
      isSchoolLeader: body.isSchoolLeader ?? true,
    });
    if (!result) return jsonError(JagErrors.notFound("Timesheet not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ timesheet: result }, { correlationId: gate.correlationId });
  }

  if (body.action === "reject") {
    if (!body.timesheetId) {
      return jsonError(JagErrors.validation("timesheetId is required."));
    }
    const result = service.reject({
      organizationId: gate.organizationId,
      timesheetId: body.timesheetId,
      actor: gate.session.userId,
    });
    if (!result) return jsonError(JagErrors.notFound("Timesheet not found."));
    return jsonOk({ timesheet: result }, { correlationId: gate.correlationId });
  }

  if (body.action === "add_entry" || body.action === "session_time") {
    if (!body.timesheetId || !body.date || body.minutes == null) {
      return jsonError(
        JagErrors.validation("timesheetId, date, and minutes are required.")
      );
    }
    const result =
      body.action === "session_time"
        ? service.addSessionTime({
            organizationId: gate.organizationId,
            timesheetId: body.timesheetId,
            sessionId: body.sessionId ?? "session",
            date: body.date,
            minutes: body.minutes,
            actor: gate.session.userId,
          })
        : service.addEntry({
            organizationId: gate.organizationId,
            timesheetId: body.timesheetId,
            entry: {
              date: body.date,
              minutes: body.minutes,
              source: body.source ?? "Manual",
              sessionId: body.sessionId ?? null,
              notes: body.notes ?? "",
            },
            actor: gate.session.userId,
          });
    if (!result) return jsonError(JagErrors.notFound("Timesheet not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ timesheet: result }, { correlationId: gate.correlationId });
  }

  if (!body.employeeId || !body.weekStarting) {
    return jsonError(
      JagErrors.validation("employeeId and weekStarting are required.")
    );
  }
  const created = service.create({
    organizationId: gate.organizationId,
    employeeId: body.employeeId,
    weekStarting: body.weekStarting,
    createdBy: gate.session.userId,
  });
  if ("error" in created) return jsonError(JagErrors.validation(created.error));
  return jsonOk(
    { timesheet: created },
    { correlationId: gate.correlationId, status: 201 }
  );
}
