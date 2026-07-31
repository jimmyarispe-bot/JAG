import {
  canAccessEvidenceOrganization,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  createDecisionService,
  DECISION_STATUSES,
  type DecisionStatus,
} from "@/lib/executive-intelligence";
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

  const service = createDecisionService();
  service.syncFromInsights(orgGate.organizationId, gate.session.userId);

  const decisionId = searchParams.get("decisionId");
  if (decisionId) {
    const decision = service.get(orgGate.organizationId, decisionId);
    return jsonOk({ decision }, { correlationId: gate.correlationId });
  }

  const decisions = service.list(orgGate.organizationId);
  return jsonOk({ decisions }, { correlationId: gate.correlationId });
}

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: string;
    category?: string;
    title?: string;
    description?: string;
    severity?: "Info" | "Warning" | "Critical";
    source?: string;
    dueDate?: string | null;
    relatedEvidenceIds?: string[];
    businessUnit?: string | null;
    department?: string | null;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  void resolveEvidenceOrganization(gate.session, orgGate.organizationId);
  const service = createDecisionService();

  if (body.action === "sync") {
    const result = service.syncFromInsights(
      orgGate.organizationId,
      gate.session.userId
    );
    return jsonOk({ result }, { correlationId: gate.correlationId });
  }

  if (!body.title?.trim() || !body.description?.trim()) {
    return jsonError(
      JagErrors.validation("Title and description are required.")
    );
  }

  const decision = service.create({
    organizationId: orgGate.organizationId,
    category: (body.category as never) ?? "Manual",
    title: body.title.trim(),
    description: body.description.trim(),
    severity: body.severity ?? "Info",
    source: "Manual",
    createdBy: gate.session.userId,
    dueDate: body.dueDate,
    relatedEvidenceIds: body.relatedEvidenceIds,
    businessUnit: body.businessUnit ?? null,
    department: body.department ?? null,
    initialStatus: "Needs Review",
  });

  return jsonOk({ decision }, { correlationId: gate.correlationId, status: 201 });
}

export async function PATCH(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    decisionId?: string;
    status?: string;
    title?: string;
    description?: string;
    severity?: "Info" | "Warning" | "Critical";
    priority?: "P1" | "P2" | "P3";
    dueDate?: string | null;
    department?: string | null;
    businessUnit?: string | null;
    assignment?: {
      targetType: "Person" | "Team" | "Business Unit";
      targetId: string;
      targetLabel: string;
      reason?: string;
    } | null;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  if (!body.decisionId) {
    return jsonError(JagErrors.validation("decisionId is required."));
  }

  if (
    body.status &&
    !(DECISION_STATUSES as readonly string[]).includes(body.status)
  ) {
    return jsonError(JagErrors.validation("Invalid decision status."));
  }

  try {
    const decision = createDecisionService().patch({
      organizationId: orgGate.organizationId,
      decisionId: body.decisionId,
      actor: gate.session.userId,
      status: body.status as DecisionStatus | undefined,
      title: body.title,
      description: body.description,
      severity: body.severity,
      priority: body.priority,
      dueDate: body.dueDate,
      department: body.department,
      businessUnit: body.businessUnit,
      assignment: body.assignment,
    });
    if (!decision) {
      return jsonError(
        JagErrors.notFound("Decision", gate.correlationId)
      );
    }
    return jsonOk({ decision }, { correlationId: gate.correlationId });
  } catch (err) {
    return jsonError(
      JagErrors.validation(
        err instanceof Error ? err.message : "Invalid decision update."
      )
    );
  }
}
