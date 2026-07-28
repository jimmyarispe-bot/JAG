/**
 * Budgets — annual/quarterly/monthly with scenario placeholders.
 * Forecasting deferred.
 */

import { randomUUID } from "node:crypto";
import { recordFinanceAudit } from "../audit";
import { requireFinancePermission } from "../permissions";
import { listBudgets, upsertBudget } from "../store";
import type { Budget } from "../types";

export function createBudget(input: {
  organizationId: string;
  userId: string;
  name: string;
  horizon: Budget["horizon"];
  scope: Budget["scope"];
  scopeId?: string | null;
  periodKey: string;
  lines: readonly { accountId: string; amount: number }[];
  scenarioKey?: string | null;
}): Budget | { error: string } {
  const gate = requireFinancePermission({
    organizationId: input.organizationId,
    userId: input.userId,
    role: "create",
  });
  if ("error" in gate) return gate;

  const budget = upsertBudget({
    id: `bud:${randomUUID()}`,
    organizationId: input.organizationId,
    name: input.name,
    horizon: input.horizon,
    scope: input.scope,
    scopeId: input.scopeId ?? null,
    periodKey: input.periodKey,
    lines: Object.freeze(input.lines.map((l) => Object.freeze({ ...l }))),
    scenarioKey: input.scenarioKey ?? null,
    createdAt: new Date().toISOString(),
  });
  recordFinanceAudit({
    organizationId: input.organizationId,
    action: "budget.create",
    recordType: "budget",
    recordId: budget.id,
    userId: input.userId,
    newValue: budget,
  });
  return budget;
}

export { listBudgets };
