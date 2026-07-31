import {
  buildWorkforceSummary,
  createPayrollPreparationService,
  type CompensationProgramKey,
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
  if (searchParams.get("view") === "summary") {
    return jsonOk(
      { summary: buildWorkforceSummary(gate.organizationId) },
      { correlationId: gate.correlationId }
    );
  }
  if (searchParams.get("view") === "virtual_pay") {
    const programKey = searchParams.get(
      "programKey"
    ) as CompensationProgramKey | null;
    const studentCount = Number(searchParams.get("studentCount") ?? "0");
    if (!programKey) {
      return jsonError(JagErrors.validation("programKey is required."));
    }
    const amount = createPayrollPreparationService().calculateVirtualPay(
      gate.organizationId,
      programKey,
      studentCount
    );
    return jsonOk({ amount }, { correlationId: gate.correlationId });
  }
  const items = createPayrollPreparationService().list(gate.organizationId);
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "prepare" | "configure";
    periodStart?: string;
    periodEnd?: string;
    virtualSessions?: {
      employeeId: string;
      programKey: CompensationProgramKey;
      studentCount: number;
      stipend?: number;
      bonus?: number;
    }[];
    overtimeByEmployee?: Record<string, number>;
    compensation?: {
      virtualRules: {
        programKey: CompensationProgramKey;
        firstStudentAmount: number;
        additionalStudentAmount: number;
      }[];
    };
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  const service = createPayrollPreparationService();

  if (body.action === "configure") {
    if (!body.compensation) {
      return jsonError(JagErrors.validation("compensation is required."));
    }
    const config = service.configureCompensation(
      gate.organizationId,
      body.compensation
    );
    return jsonOk({ config }, { correlationId: gate.correlationId });
  }

  if (!body.periodStart || !body.periodEnd) {
    return jsonError(
      JagErrors.validation("periodStart and periodEnd are required.")
    );
  }
  const prep = service.prepare({
    organizationId: gate.organizationId,
    periodStart: body.periodStart,
    periodEnd: body.periodEnd,
    virtualSessions: body.virtualSessions,
    overtimeByEmployee: body.overtimeByEmployee,
    createdBy: gate.session.userId,
  });
  return jsonOk(
    { payroll: prep },
    { correlationId: gate.correlationId, status: 201 }
  );
}
