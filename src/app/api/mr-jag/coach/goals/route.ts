import {
  createMrJagCoachEngine,
  installMrJag,
} from "@mr-jag";
import type { CoachGoal } from "@mr-jag";
import { jsonOk, requireMrJagOrg, requireMrJagOrgBody } from "../../_lib";

export async function GET(request: Request) {
  const gate = await requireMrJagOrg(request);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createMrJagCoachEngine();
  return jsonOk(
    {
      goals: engine.listGoals({
        organizationId: gate.organizationId,
        userId: gate.session.userId,
      }),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    persona?: string;
    action?: "create" | "increment" | "seed";
    goalId?: string;
    horizon?: CoachGoal["horizon"];
    title?: string;
    description?: string;
    targetCount?: number;
  };
  const gate = await requireMrJagOrgBody(body);
  if (!gate.ok) return gate.response;
  installMrJag();
  const engine = createMrJagCoachEngine();
  const action = body.action ?? "seed";

  if (action === "increment" && body.goalId) {
    return jsonOk(
      { goal: engine.incrementGoal(body.goalId) },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (action === "create") {
    return jsonOk(
      {
        goal: engine.createGoal({
          organizationId: gate.organizationId,
          userId: gate.session.userId,
          persona: body.persona,
          horizon: body.horizon ?? "daily",
          title: body.title ?? "Coach goal",
          description: body.description,
          targetCount: body.targetCount,
        }),
      },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  return jsonOk(
    {
      goals: engine.seedGoals({
        organizationId: gate.organizationId,
        userId: gate.session.userId,
        persona: body.persona,
      }),
    },
    { correlationId: gate.correlationId, status: 201 }
  );
}
