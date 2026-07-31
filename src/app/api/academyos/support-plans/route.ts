import {
  createSupportPlansService,
  type SupportPlanKind,
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
  const service = createSupportPlansService();
  if (searchParams.get("view") === "reviews_due") {
    return jsonOk(
      { plans: service.reviewsDue(gate.organizationId) },
      { correlationId: gate.correlationId }
    );
  }
  const items = service.list(
    gate.organizationId,
    searchParams.get("studentId") ?? undefined
  );
  return jsonOk(
    { ...paginate(items, parsePage(searchParams)) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    studentId?: string;
    kind?: string;
    title?: string;
    effectiveFrom?: string;
    effectiveTo?: string | null;
    assignedStaffIds?: string[];
    reviewDate?: string | null;
    requiredDocumentation?: string;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.studentId || !body.title || !body.effectiveFrom) {
    return jsonError(
      JagErrors.validation("studentId, title, and effectiveFrom are required.")
    );
  }
  const result = createSupportPlansService().create({
    organizationId: gate.organizationId,
    studentId: body.studentId,
    kind: (body.kind as SupportPlanKind) ?? "IEP",
    title: body.title,
    effectiveFrom: body.effectiveFrom,
    effectiveTo: body.effectiveTo,
    assignedStaffIds: body.assignedStaffIds,
    reviewDate: body.reviewDate,
    requiredDocumentation: body.requiredDocumentation,
    createdBy: gate.session.userId,
  });
  if ("error" in result) return jsonError(JagErrors.validation(result.error));
  return jsonOk(
    { plan: result },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    planId?: string;
    status?: "Draft" | "Active" | "Review Due" | "Archived";
    reviewDate?: string | null;
    assignedStaffIds?: string[];
    requiredDocumentation?: string;
    effectiveTo?: string | null;
  };
  const gate = await requireAcademyOsOrgBody(body);
  if (!gate.ok) return gate.response;
  if (!body.planId) {
    return jsonError(JagErrors.validation("planId is required."));
  }
  const result = createSupportPlansService().patch({
    organizationId: gate.organizationId,
    planId: body.planId,
    actor: gate.session.userId,
    status: body.status,
    reviewDate: body.reviewDate,
    assignedStaffIds: body.assignedStaffIds,
    requiredDocumentation: body.requiredDocumentation,
    effectiveTo: body.effectiveTo,
  });
  if (!result) return jsonError(JagErrors.notFound("Support plan not found."));
  return jsonOk({ plan: result }, { correlationId: gate.correlationId });
}
