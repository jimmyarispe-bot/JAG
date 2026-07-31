import {
  canAccessEvidenceOrganization,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  createRiskService,
  RISK_CATEGORIES,
  type RiskCategory,
  type RiskImpact,
  type RiskLikelihood,
} from "@/lib/risk";
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

  const service = createRiskService();
  const riskId = searchParams.get("riskId");
  if (riskId) {
    return jsonOk(
      { risk: service.get(orgGate.organizationId, riskId) },
      { correlationId: gate.correlationId }
    );
  }

  return jsonOk(
    { risks: service.list(orgGate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    category?: string;
    title?: string;
    description?: string;
    likelihood?: number;
    impact?: number;
    owner?: string | null;
    businessUnit?: string | null;
    department?: string | null;
    relatedGoalId?: string | null;
    relatedDecisionId?: string | null;
    mitigationPlan?: string;
    reviewDate?: string | null;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;
  void resolveEvidenceOrganization(gate.session, orgGate.organizationId);

  if (!body.title?.trim() || !body.description?.trim()) {
    return jsonError(
      JagErrors.validation("Title and description are required.")
    );
  }

  const category = (RISK_CATEGORIES as readonly string[]).includes(
    body.category ?? ""
  )
    ? (body.category as RiskCategory)
    : "Operational";

  const result = createRiskService().create({
    organizationId: orgGate.organizationId,
    category,
    title: body.title.trim(),
    description: body.description.trim(),
    likelihood: (body.likelihood as RiskLikelihood) ?? 3,
    impact: (body.impact as RiskImpact) ?? 3,
    owner: body.owner ?? null,
    businessUnit: body.businessUnit ?? null,
    department: body.department ?? null,
    relatedGoalId: body.relatedGoalId ?? null,
    relatedDecisionId: body.relatedDecisionId ?? null,
    mitigationPlan: body.mitigationPlan ?? "",
    reviewDate: body.reviewDate ?? null,
    createdBy: gate.session.userId,
  });

  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }

  return jsonOk(
    { risk: result },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    riskId?: string;
    title?: string;
    description?: string;
    category?: RiskCategory;
    status?: string;
    likelihood?: RiskLikelihood;
    impact?: RiskImpact;
    owner?: string | null;
    businessUnit?: string | null;
    department?: string | null;
    mitigationPlan?: string;
    reviewDate?: string | null;
    relatedGoalId?: string | null;
    relatedDecisionId?: string | null;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  if (!body.riskId) {
    return jsonError(JagErrors.validation("riskId is required."));
  }

  const result = createRiskService().patch({
    organizationId: orgGate.organizationId,
    riskId: body.riskId,
    actor: gate.session.userId,
    title: body.title,
    description: body.description,
    category: body.category,
    status: body.status as never,
    likelihood: body.likelihood,
    impact: body.impact,
    owner: body.owner,
    businessUnit: body.businessUnit,
    department: body.department,
    mitigationPlan: body.mitigationPlan,
    reviewDate: body.reviewDate,
    relatedGoalId: body.relatedGoalId,
    relatedDecisionId: body.relatedDecisionId,
  });

  if (result == null) {
    return jsonError(JagErrors.notFound("Risk", gate.correlationId));
  }
  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }

  return jsonOk({ risk: result }, { correlationId: gate.correlationId });
}
