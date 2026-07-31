import { createUniversalOrganizationEngine } from "@organization";
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
  return jsonOk(
    {
      analytics: engine.performanceAnalytics(gate.organizationId),
      goals: engine.listGoals(gate.organizationId),
      dashboard: engine.dashboard(gate.organizationId),
    },
    { correlationId: gate.correlationId }
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    organizationId?: string;
    action?:
      | "progress"
      | "kpi"
      | "milestone"
      | "review"
      | "one_on_one";
    goalId?: string;
    progressPercent?: number;
    name?: string;
    title?: string;
    target?: number;
    current?: number;
    unit?: string;
    personRef?: string;
    periodLabel?: string;
    summary?: string;
    rating?: number;
    managerRef?: string;
    reportRef?: string;
    notes?: string;
  };
  const gate = await requireOrgModelOrgBody(body);
  if (!gate.ok) return gate.response;
  const engine = createUniversalOrganizationEngine();
  const action = body.action ?? "progress";

  if (action === "kpi") {
    const kpi = engine.createKpi({
      organizationId: gate.organizationId,
      name: body.name ?? "KPI",
      target: body.target,
      current: body.current,
      unit: body.unit,
      goalId: body.goalId,
    });
    if ("error" in kpi) return jsonError(JagErrors.validation(kpi.error));
    return jsonOk({ kpi }, { correlationId: gate.correlationId, status: 201 });
  }
  if (action === "milestone") {
    const milestone = engine.createMilestone({
      organizationId: gate.organizationId,
      goalId: body.goalId ?? "",
      title: body.title ?? "Milestone",
    });
    if ("error" in milestone) {
      return jsonError(JagErrors.validation(milestone.error));
    }
    return jsonOk(
      { milestone },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (action === "review") {
    return jsonOk(
      {
        review: engine.recordReview({
          organizationId: gate.organizationId,
          personRef: body.personRef ?? "",
          periodLabel: body.periodLabel ?? "period",
          summary: body.summary ?? "",
          rating: body.rating,
        }),
      },
      { correlationId: gate.correlationId, status: 201 }
    );
  }
  if (action === "one_on_one") {
    return jsonOk(
      {
        oneOnOne: engine.recordOneOnOne({
          organizationId: gate.organizationId,
          managerRef: body.managerRef ?? "",
          reportRef: body.reportRef ?? "",
          notes: body.notes ?? "",
        }),
      },
      { correlationId: gate.correlationId, status: 201 }
    );
  }

  const goal = engine.updateGoalProgress({
    organizationId: gate.organizationId,
    goalId: body.goalId ?? "",
    progressPercent: body.progressPercent ?? 0,
  });
  if ("error" in goal) return jsonError(JagErrors.validation(goal.error));
  return jsonOk({ goal }, { correlationId: gate.correlationId, status: 201 });
}
