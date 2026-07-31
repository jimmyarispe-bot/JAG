import {
  createEmployeePortalService,
  createEmployeeService,
  createWorkforceReportingService,
  type EmployeeStatus,
  type EmploymentType,
  type WorkforceReportKind,
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
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (token) {
    const portal = createEmployeePortalService().resolve(token);
    if ("error" in portal) return jsonError(JagErrors.unauthorized());
    return jsonOk(portal);
  }

  const gate = await requireAcademyOsOrg(request);
  if (!gate.ok) return gate.response;

  const report = searchParams.get("report") as WorkforceReportKind | null;
  if (report) {
    return jsonOk(
      {
        report: createWorkforceReportingService().generate(
          gate.organizationId,
          report
        ),
      },
      { correlationId: gate.correlationId }
    );
  }

  const service = createEmployeeService();
  const employeeId = searchParams.get("employeeId");
  if (employeeId) {
    return jsonOk(
      { employee: service.get(gate.organizationId, employeeId) },
      { correlationId: gate.correlationId }
    );
  }

  const items = service.search({
    organizationId: gate.organizationId,
    q: searchParams.get("q") ?? undefined,
    status: (searchParams.get("status") as EmployeeStatus) || undefined,
    campusId: searchParams.get("campusId") ?? undefined,
    employmentType:
      (searchParams.get("employmentType") as EmploymentType) || undefined,
    department: searchParams.get("department") ?? undefined,
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
    action?: string;
    timesheetId?: string;
    displayName?: string;
    email?: string | null;
    employmentType?: EmploymentType;
    campusId?: string | null;
    campusName?: string | null;
    department?: string | null;
    positionId?: string | null;
    supervisorId?: string | null;
    hireDate?: string | null;
    annualSalary?: number | null;
    hourlyRate?: number | null;
  };

  if (body.action === "portal_submit_timesheet" && body.token) {
    const result = createEmployeePortalService().submitTimesheet({
      token: body.token,
      timesheetId: body.timesheetId ?? "",
    });
    if (!result) return jsonError(JagErrors.notFound("Timesheet not found."));
    if ("error" in result) return jsonError(JagErrors.validation(result.error));
    return jsonOk({ timesheet: result });
  }

  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.displayName || !body.employmentType) {
    return jsonError(
      JagErrors.validation("displayName and employmentType are required.")
    );
  }
  const created = createEmployeeService().create({
    organizationId: gate.organizationId,
    displayName: body.displayName,
    email: body.email,
    employmentType: body.employmentType,
    campusId: body.campusId,
    campusName: body.campusName,
    department: body.department,
    positionId: body.positionId,
    supervisorId: body.supervisorId,
    hireDate: body.hireDate,
    annualSalary: body.annualSalary,
    hourlyRate: body.hourlyRate,
    createdBy: gate.session.userId,
  });
  if ("error" in created) return jsonError(JagErrors.validation(created.error));
  return jsonOk(
    { employee: created },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    employeeId?: string;
    displayName?: string;
    status?: EmployeeStatus;
    department?: string | null;
    positionId?: string | null;
    backgroundCheckClear?: boolean;
    trainingComplete?: boolean;
    annualSalary?: number | null;
    hourlyRate?: number | null;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.employeeId) {
    return jsonError(JagErrors.validation("employeeId is required."));
  }
  const patched = createEmployeeService().patch({
    organizationId: gate.organizationId,
    employeeId: body.employeeId,
    displayName: body.displayName,
    status: body.status,
    department: body.department,
    positionId: body.positionId,
    backgroundCheckClear: body.backgroundCheckClear,
    trainingComplete: body.trainingComplete,
    annualSalary: body.annualSalary,
    hourlyRate: body.hourlyRate,
    actor: gate.session.userId,
  });
  if (!patched) return jsonError(JagErrors.notFound("Employee not found."));
  if ("error" in patched) return jsonError(JagErrors.validation(patched.error));
  return jsonOk({ employee: patched }, { correlationId: gate.correlationId });
}
