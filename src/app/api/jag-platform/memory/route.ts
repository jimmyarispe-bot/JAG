import {
  canAccessEvidenceOrganization,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  createMemoryService,
  MEMORY_CATEGORIES,
  MEMORY_SOURCES,
  type MemoryCategory,
  type MemorySource,
} from "@/lib/memory";
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

  const service = createMemoryService();
  const memoryId = searchParams.get("memoryId");
  if (memoryId) {
    return jsonOk(
      { memory: service.get(orgGate.organizationId, memoryId) },
      { correlationId: gate.correlationId }
    );
  }

  return jsonOk(
    { memories: service.list(orgGate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    title?: string;
    summary?: string;
    category?: string;
    source?: string;
    owner?: string | null;
    relatedDecisionId?: string | null;
    relatedGoalId?: string | null;
    relatedRiskId?: string | null;
    relatedProjectId?: string | null;
    relatedWorkItemId?: string | null;
    relatedEvidenceIds?: string[];
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;
  void resolveEvidenceOrganization(gate.session, orgGate.organizationId);

  if (!body.title?.trim() || !body.summary?.trim()) {
    return jsonError(
      JagErrors.validation("Title and summary are required.")
    );
  }

  const category = (MEMORY_CATEGORIES as readonly string[]).includes(
    body.category ?? ""
  )
    ? (body.category as MemoryCategory)
    : undefined;
  const source = (MEMORY_SOURCES as readonly string[]).includes(
    body.source ?? ""
  )
    ? (body.source as MemorySource)
    : undefined;

  const result = createMemoryService().create({
    organizationId: orgGate.organizationId,
    title: body.title.trim(),
    summary: body.summary.trim(),
    category,
    source,
    owner: body.owner ?? null,
    relatedDecisionId: body.relatedDecisionId ?? null,
    relatedGoalId: body.relatedGoalId ?? null,
    relatedRiskId: body.relatedRiskId ?? null,
    relatedProjectId: body.relatedProjectId ?? null,
    relatedWorkItemId: body.relatedWorkItemId ?? null,
    relatedEvidenceIds: body.relatedEvidenceIds,
    createdBy: gate.session.userId,
  });

  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }

  return jsonOk(
    { memory: result },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    memoryId?: string;
    title?: string;
    summary?: string;
    category?: string;
    source?: string;
    status?: string;
    owner?: string | null;
    relatedDecisionId?: string | null;
    relatedGoalId?: string | null;
    relatedRiskId?: string | null;
    relatedProjectId?: string | null;
    relatedWorkItemId?: string | null;
    relatedEvidenceIds?: string[];
    reviewed?: boolean;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  if (!body.memoryId) {
    return jsonError(JagErrors.validation("memoryId is required."));
  }

  const result = createMemoryService().patch({
    organizationId: orgGate.organizationId,
    memoryId: body.memoryId,
    actor: gate.session.userId,
    title: body.title,
    summary: body.summary,
    category: (MEMORY_CATEGORIES as readonly string[]).includes(
      body.category ?? ""
    )
      ? (body.category as MemoryCategory)
      : undefined,
    source: (MEMORY_SOURCES as readonly string[]).includes(body.source ?? "")
      ? (body.source as MemorySource)
      : undefined,
    status: body.status as never,
    owner: body.owner,
    relatedDecisionId: body.relatedDecisionId,
    relatedGoalId: body.relatedGoalId,
    relatedRiskId: body.relatedRiskId,
    relatedProjectId: body.relatedProjectId,
    relatedWorkItemId: body.relatedWorkItemId,
    relatedEvidenceIds: body.relatedEvidenceIds,
    reviewed: body.reviewed,
  });

  if (!result) {
    return jsonError(JagErrors.notFound("Memory not found."));
  }
  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }

  return jsonOk({ memory: result }, { correlationId: gate.correlationId });
}
