import { newId, nowIso } from "../ids";
import { publishCfoEvent } from "../events";
import { evaluateMetrics, metricValue } from "../metrics";
import { listScenarios, upsertScenario } from "../store";
import type { CfoScenarioKind, CfoScenarioResult } from "../types";

export function analyzeScenario(input: {
  organizationId: string;
  userId: string;
  kind: CfoScenarioKind;
  name: string;
  periodKey: string;
  assumptions: Readonly<Record<string, number | string | boolean>>;
}): CfoScenarioResult {
  const snap = evaluateMetrics({
    organizationId: input.organizationId,
    periodKey: input.periodKey,
  });
  let revenue = metricValue(snap, "revenue") ?? 0;
  let expenses =
    (metricValue(snap, "revenue") ?? 0) -
    (metricValue(snap, "operating_income") ?? 0);
  let cash = metricValue(snap, "cash") ?? 0;
  const a = input.assumptions;

  const num = (k: string, fallback = 0) =>
    typeof a[k] === "number" ? (a[k] as number) : fallback;

  switch (input.kind) {
    case "hiring":
    case "salary_changes": {
      const add = num("annualCost") || num("payrollIncreasePct") * expenses;
      expenses += add;
      cash -= add / 12;
      break;
    }
    case "enrollment_changes":
    case "revenue_growth":
    case "scholarship_changes":
    case "grant_loss": {
      const pct = num("changePct", num("growthPct", 0));
      revenue *= 1 + pct / 100;
      if (input.kind === "grant_loss") revenue -= num("grantAmount");
      break;
    }
    case "expense_growth":
      expenses *= 1 + num("changePct") / 100;
      break;
    case "acquisitions":
    case "capital_purchases":
      cash -= num("purchaseAmount", num("capitalAmount"));
      break;
    case "debt":
      cash += num("proceeds");
      expenses += num("interestAnnual");
      break;
    case "custom":
      revenue *= 1 + num("revenueChangePct") / 100;
      expenses *= 1 + num("expenseChangePct") / 100;
      cash += num("cashDelta");
      break;
  }

  const projectedEbitda = revenue - expenses;
  const result = upsertScenario({
    id: newId("cfoscen"),
    organizationId: input.organizationId,
    kind: input.kind,
    name: input.name,
    assumptions: Object.freeze({ ...a }),
    projectedRevenue: revenue,
    projectedExpenses: expenses,
    projectedCash: cash,
    projectedEbitda,
    impactSummary: `${input.kind}: revenue→${revenue.toFixed(0)}, expenses→${expenses.toFixed(0)}, cash→${cash.toFixed(0)}`,
    generatedAt: nowIso(),
    generatedBy: input.userId,
  });

  publishCfoEvent({
    type: "cfo.scenario_analyzed",
    organizationId: input.organizationId,
    recordType: "cfo_scenario",
    recordId: result.id,
    actorUserId: input.userId,
    payload: { kind: result.kind, impactSummary: result.impactSummary },
  });
  return result;
}

export { listScenarios };
