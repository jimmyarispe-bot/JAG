import { canAccessEvidenceOrganization } from "@/lib/evidence-center";
import { createComplianceService } from "@/lib/risk";
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

  const service = createComplianceService();
  return jsonOk(
    {
      policies: service.listPolicies(orgGate.organizationId),
      requirements: service.listRequirements(orgGate.organizationId),
      obligations: service.listObligations(orgGate.organizationId),
      findings: service.listFindings(orgGate.organizationId),
      exceptions: service.listExceptions(orgGate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    kind?: string;
    title?: string;
    description?: string;
    rationale?: string;
    policyId?: string | null;
    procedure?: string;
    requiredEvidence?: string[];
    requiredReviews?: string[];
    renewalDate?: string | null;
    relatedRiskIds?: string[];
    relatedRiskId?: string | null;
    relatedRequirementId?: string | null;
    owner?: string | null;
    source?: string;
    dueDate?: string | null;
    status?: string;
    requirementId?: string;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  const service = createComplianceService();
  const kind = body.kind ?? "requirement";

  if (kind === "status" && body.requirementId && body.status) {
    const updated = service.updateRequirementStatus({
      organizationId: orgGate.organizationId,
      requirementId: body.requirementId,
      status: body.status as never,
      actor: gate.session.userId,
    });
    if (!updated) {
      return jsonError(JagErrors.notFound("Requirement", gate.correlationId));
    }
    return jsonOk({ requirement: updated }, { correlationId: gate.correlationId });
  }

  if (!body.title?.trim()) {
    return jsonError(JagErrors.validation("title is required."));
  }

  if (kind === "policy") {
    const result = service.createPolicy({
      organizationId: orgGate.organizationId,
      title: body.title.trim(),
      description: body.description?.trim() ?? "",
      owner: body.owner ?? null,
      createdBy: gate.session.userId,
    });
    if ("error" in result) {
      return jsonError(JagErrors.validation(result.error));
    }
    return jsonOk(
      { policy: result },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (kind === "obligation") {
    const result = service.createObligation({
      organizationId: orgGate.organizationId,
      title: body.title.trim(),
      description: body.description?.trim() ?? "",
      source: body.source,
      dueDate: body.dueDate ?? null,
      owner: body.owner ?? null,
      relatedRequirementId: body.relatedRequirementId ?? null,
      createdBy: gate.session.userId,
    });
    if ("error" in result) {
      return jsonError(JagErrors.validation(result.error));
    }
    return jsonOk(
      { obligation: result },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (kind === "finding") {
    const result = service.createFinding({
      organizationId: orgGate.organizationId,
      title: body.title.trim(),
      description: body.description?.trim() ?? "",
      relatedRiskId: body.relatedRiskId ?? null,
      relatedRequirementId: body.relatedRequirementId ?? null,
      createdBy: gate.session.userId,
    });
    if ("error" in result) {
      return jsonError(JagErrors.validation(result.error));
    }
    return jsonOk(
      { finding: result },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (kind === "exception") {
    const result = service.createException({
      organizationId: orgGate.organizationId,
      title: body.title.trim(),
      rationale: body.rationale?.trim() ?? body.description?.trim() ?? "",
      relatedRiskId: body.relatedRiskId ?? null,
      relatedRequirementId: body.relatedRequirementId ?? null,
      createdBy: gate.session.userId,
    });
    if ("error" in result) {
      return jsonError(JagErrors.validation(result.error));
    }
    return jsonOk(
      { exception: result },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const result = service.createRequirement({
    organizationId: orgGate.organizationId,
    title: body.title.trim(),
    description: body.description?.trim() ?? "",
    policyId: body.policyId ?? null,
    procedure: body.procedure,
    requiredEvidence: body.requiredEvidence,
    requiredReviews: body.requiredReviews,
    renewalDate: body.renewalDate ?? null,
    relatedRiskIds: body.relatedRiskIds,
    owner: body.owner ?? null,
    createdBy: gate.session.userId,
  });

  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }

  return jsonOk(
    { requirement: result },
    { correlationId: gate.correlationId, status: 201 }
  );
}
