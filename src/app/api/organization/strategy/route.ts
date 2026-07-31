import {
  createUniversalOrganizationEngine,
  type StrategyMode,
} from "@organization";
import {
  jsonError,
  jsonOk,
  JagErrors,
  requireOrgModelOrg,
  requireOrgModelOrgBody,
} from "../_lib";

export async function GET(request: Request) {
  const gate = await requireOrgModelOrg(request);
  if (!gate.ok) return gate.response;
  const engine = createUniversalOrganizationEngine();
  const org = engine.get(gate.organizationId);
  return jsonOk(
    {
      mode: org?.constitution.strategyMode ?? null,
      chain: engine.describeStrategyChain(gate.organizationId),
      plan: org?.strategicPlan ?? null,
      goals: engine.listGoals(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?: "mode" | "plan" | "goal";
    mode?: StrategyMode;
    title?: string;
    description?: string;
    level?: "organizational" | "department" | "team" | "individual";
    parentGoalId?: string;
    strategicObjectiveId?: string;
    objectives?: { title: string; description?: string }[];
    initiatives?: {
      title: string;
      description?: string;
      objectiveIndex?: number;
    }[];
  };
  const gate = await requireOrgModelOrgBody(body);
  if (!gate.ok) return gate.response;
  const engine = createUniversalOrganizationEngine();
  const action = body.action ?? "goal";

  if (action === "mode" && body.mode) {
    const result = engine.setStrategyMode(gate.organizationId, body.mode);
    if ("error" in result) {
      return jsonError(JagErrors.validation(result.error));
    }
    return jsonOk(
      { constitution: result },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  if (action === "plan") {
    const plan = engine.upsertStrategicPlan({
      organizationId: gate.organizationId,
      title: body.title ?? "Strategic Plan",
      objectives: body.objectives,
      initiatives: body.initiatives,
    });
    if ("error" in plan) {
      return jsonError(JagErrors.validation(plan.error));
    }
    return jsonOk(
      { plan },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const goal = engine.createGoal({
    organizationId: gate.organizationId,
    title: body.title ?? "Goal",
    description: body.description,
    level: body.level,
    parentGoalId: body.parentGoalId,
    strategicObjectiveId: body.strategicObjectiveId,
  });
  if ("error" in goal) {
    return jsonError(JagErrors.validation(goal.error));
  }
  return jsonOk(
    { goal },
    { correlationId: gate.correlationId, status: 201 }
  );
}
