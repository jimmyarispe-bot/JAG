import { canAccessEvidenceOrganization } from "@/lib/evidence-center";
import { createGoalService } from "@/lib/goals";
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

  const goalId = searchParams.get("goalId");
  if (!goalId) {
    return jsonError(JagErrors.validation("goalId is required."));
  }

  const goal = createGoalService().recalculateProgress(
    orgGate.organizationId,
    goalId
  );
  if (!goal) {
    return jsonError(JagErrors.notFound("Goal", gate.correlationId));
  }

  return jsonOk(
    {
      goalId: goal.id,
      progressPercent: goal.progressPercent,
      health: goal.health,
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const gate = await requireJagApiSession();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    goalId?: string;
    manualProgressPercent?: number;
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
