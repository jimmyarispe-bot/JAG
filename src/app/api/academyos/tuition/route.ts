import {
  createTuitionService,
  type TuitionFrequency,
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
  const service = createTuitionService();
  const planId = searchParams.get("planId");
  if (planId) {
    return jsonOk(
      { plan: service.getPlan(gate.organizationId, planId) },
      { correlationId: gate.correlationId }
    );
  }
  if (searchParams.get("view") === "schedules") {
    const items = service.listSchedules(
      gate.organizationId,
      searchParams.get("familyAccountId") ?? undefined
    );
    return jsonOk(
      { ...paginate(items, parsePage(searchParams)) },
      { correlationId: gate.correlationId }
    );
  }
  const items = service.listPlans(gate.organizationId);
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "create_plan" | "assign_schedule";
    name?: string;
    frequency?: TuitionFrequency;
    baseAmount?: number;
    program?: string | null;
    campusId?: string | null;
    gradeLevel?: string | null;
    siblingDiscountPercent?: number | null;
    promotionalDiscountPercent?: number;
    effectiveFrom?: string;
    effectiveTo?: string | null;
    tuitionPlanId?: string;
    familyAccountId?: string;
    studentId?: string;
    amount?: number;
    dueDay?: number;
    startsOn?: string;
    endsOn?: string | null;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  const service = createTuitionService();

  if (body.action === "assign_schedule") {
    if (
      !body.tuitionPlanId ||
      !body.familyAccountId ||
      !body.studentId ||
      !body.startsOn
    ) {
      return jsonError(
        JagErrors.validation(
          "tuitionPlanId, familyAccountId, studentId, and startsOn are required."
        )
      );
    }
    const schedule = service.assignSchedule({
      organizationId: gate.organizationId,
      tuitionPlanId: body.tuitionPlanId,
      familyAccountId: body.familyAccountId,
      studentId: body.studentId,
      amount: body.amount,
      dueDay: body.dueDay,
      startsOn: body.startsOn,
      endsOn: body.endsOn,
      createdBy: gate.session.userId,
    });
    if ("error" in schedule) {
      return jsonError(JagErrors.validation(schedule.error));
    }
    return jsonOk(
      { schedule },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (
    !body.name ||
    !body.frequency ||
    body.baseAmount == null ||
    !body.effectiveFrom
  ) {
    return jsonError(
      JagErrors.validation(
        "name, frequency, baseAmount, and effectiveFrom are required."
      )
    );
  }
  const plan = service.createPlan({
    organizationId: gate.organizationId,
    name: body.name,
    frequency: body.frequency,
    baseAmount: body.baseAmount,
    program: body.program,
    campusId: body.campusId,
    gradeLevel: body.gradeLevel,
    siblingDiscountPercent: body.siblingDiscountPercent,
    promotionalDiscountPercent: body.promotionalDiscountPercent,
    effectiveFrom: body.effectiveFrom,
    effectiveTo: body.effectiveTo,
    createdBy: gate.session.userId,
  });
  if ("error" in plan) return jsonError(JagErrors.validation(plan.error));
  return jsonOk({ plan }, { correlationId: gate.correlationId, status: 201 });
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    planId?: string;
    name?: string;
    baseAmount?: number;
    status?: "Draft" | "Active" | "Archived";
    promotionalDiscountPercent?: number;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.planId) {
    return jsonError(JagErrors.validation("planId is required."));
  }
  const patched = createTuitionService().patchPlan({
    organizationId: gate.organizationId,
    planId: body.planId,
    name: body.name,
    baseAmount: body.baseAmount,
    status: body.status,
    promotionalDiscountPercent: body.promotionalDiscountPercent,
    actor: gate.session.userId,
  });
  if (!patched) return jsonError(JagErrors.notFound("Plan not found."));
  return jsonOk({ plan: patched }, { correlationId: gate.correlationId });
}
