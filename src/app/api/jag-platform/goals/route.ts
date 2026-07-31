import {
  canAccessEvidenceOrganization,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  createGoalService,
  GOAL_CATEGORIES,
  GOAL_TYPES,
  type GoalCategory,
  type GoalType,
} from "@/lib/goals";
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

  const service = createGoalService();
  const goalId = searchParams.get("goalId");
  if (goalId) {
    return jsonOk(
      { goal: service.get(orgGate.organizationId, goalId) },
      { correlationId: gate.correlationId }
    );
  }

  return jsonOk(
    { goals: service.list(orgGate.organizationId) },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    title?: string;
    description?: string;
    category?: string;
    goalType?: string;
    parentGoalId?: string | null;
    owner?: string | null;
    businessUnit?: string | null;
    department?: string | null;
    targetDate?: string | null;
    startDate?: string | null;
    priority?: "P1" | "P2" | "P3";
    manualProgressPercent?: number | null;
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

  const category = (GOAL_CATEGORIES as readonly string[]).includes(
    body.category ?? ""
  )
    ? (body.category as GoalCategory)
    : "General";
  const goalType = (GOAL_TYPES as readonly string[]).includes(
    body.goalType ?? ""
  )
    ? (body.goalType as GoalType)
    : "Objective";

  const result = createGoalService().create({
    organizationId: orgGate.organizationId,
    title: body.title.trim(),
    description: body.description.trim(),
    category,
    goalType,
    parentGoalId: body.parentGoalId ?? null,
    owner: body.owner ?? null,
    businessUnit: body.businessUnit ?? null,
    department: body.department ?? null,
    targetDate: body.targetDate ?? null,
    startDate: body.startDate ?? null,
    priority: body.priority ?? "P2",
    manualProgressPercent: body.manualProgressPercent ?? null,
    createdBy: gate.session.userId,
  });

  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }

  return jsonOk(
    { goal: result },
    { correlationId: gate.correlationId, status: 201 }
  );
}

export async function PATCH(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    goalId?: string;
    title?: string;
    description?: string;
    category?: GoalCategory;
    goalType?: GoalType;
    status?: string;
    owner?: string | null;
    businessUnit?: string | null;
    department?: string | null;
    parentGoalId?: string | null;
    targetDate?: string | null;
    startDate?: string | null;
    priority?: "P1" | "P2" | "P3";
    manualProgressPercent?: number | null;
    completedTaskIds?: string[];
    completedDecisionIds?: string[];
    kpiUpdateCount?: number;
  };

  const orgGate = requireOrganizationId(
    body.organizationId ?? null,
    (id) => canAccessEvidenceOrganization(gate.session, id),
    gate.correlationId
  );
  if (!orgGate.ok) return orgGate.response;

  if (!body.goalId) {
    return jsonError(JagErrors.validation("goalId is required."));
  }

  const result = createGoalService().patch({
    organizationId: orgGate.organizationId,
    goalId: body.goalId,
    actor: gate.session.userId,
    title: body.title,
    description: body.description,
    category: body.category,
    goalType: body.goalType,
    status: body.status as never,
    owner: body.owner,
    businessUnit: body.businessUnit,
    department: body.department,
    parentGoalId: body.parentGoalId,
    targetDate: body.targetDate,
    startDate: body.startDate,
    priority: body.priority,
    manualProgressPercent: body.manualProgressPercent,
    completedTaskIds: body.completedTaskIds,
    completedDecisionIds: body.completedDecisionIds,
    kpiUpdateCount: body.kpiUpdateCount,
  });

  if (result == null) {
    return jsonError(JagErrors.notFound("Goal", gate.correlationId));
  }
  if ("error" in result) {
    return jsonError(JagErrors.validation(result.error));
  }

  return jsonOk({ goal: result }, { correlationId: gate.correlationId });
}
